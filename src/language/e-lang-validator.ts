import {
  AstUtils,
  NameProvider,
  ValidationAcceptor,
  ValidationChecks,
  ValidationRegistry,
} from "langium";
import { ELangServices } from "./e-lang-module.js";
import {
  ConstantDeclaration,
  ELangAstType,
  isConstantDeclaration,
  isELangProgram,
  isFormulaDeclaration,
  isForStatement,
  isLambdaExpression,
  isMutableDeclaration,
  isNamedElement,
  isParameterDeclaration,
  isStatementBlock,
  MutableDeclaration,
  NamedElement,
} from "./generated/ast.js";
import { isScopeBoundary } from "./helpers.js";

export class ELangValidationRegistry extends ValidationRegistry {
  protected readonly nameProvider: NameProvider;

  constructor(services: ELangServices) {
    super(services);

    this.nameProvider = services.references.NameProvider;

    const validator = services.validation.ELangValidator;
    const checks: ValidationChecks<ELangAstType> = {
      ConstantDeclaration: [
        validator.checkVariableDeclaration,
        (
          decl: ConstantDeclaration | MutableDeclaration,
          accept: ValidationAcceptor
        ) =>
          validator.checkNoVariableRedeclaration(
            decl,
            accept,
            this.nameProvider
          ),
      ],
      MutableDeclaration: [
        validator.checkVariableDeclaration,
        (
          decl: ConstantDeclaration | MutableDeclaration,
          accept: ValidationAcceptor
        ) =>
          validator.checkNoVariableRedeclaration(
            decl,
            accept,
            this.nameProvider
          ),
      ],
    };
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class ELangValidator {
  checkVariableDeclaration(
    decl: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (!decl.type && !decl.value) {
      accept(
        "error",
        "Variables require a type hint or an assignment at creation",
        {
          node: decl,
          property: "name",
        }
      );
    }
  }

  /**
   * Checks that a variable or constant is not redeclared within the same scope.
   */
  checkNoVariableRedeclaration(
    decl: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor,
    nameProvider: NameProvider
  ): void {
    const name = decl.name; // Use the parsed name directly
    if (!name) {
      // Declaration is incomplete, likely a parsing error already exists
      return;
    }

    // Find the nearest container that defines a scope
    const scopeContainer = AstUtils.getContainerOfType(decl, isScopeBoundary);
    if (!scopeContainer) {
      // Should not happen if grammar is correct, but handle defensively
      console.warn(
        "Could not find scope container for declaration:",
        name,
        decl.$cstNode?.text
      );
      return;
    }

    let elementsToCheck: NamedElement[] = [];

    // Collect all relevant named elements within this specific scope
    if (isStatementBlock(scopeContainer) || isELangProgram(scopeContainer)) {
      elementsToCheck = scopeContainer.statements.filter(isNamedElement); // Get all named elements directly within the block/program
    } else if (isFormulaDeclaration(scopeContainer)) {
      elementsToCheck = [
        ...scopeContainer.parameters,
        ...scopeContainer.body.statements.filter(isNamedElement), // Add elements from body
      ];
    } else if (isLambdaExpression(scopeContainer)) {
      elementsToCheck = [...scopeContainer.parameters];
      if (isStatementBlock(scopeContainer.body)) {
        elementsToCheck.push(
          ...scopeContainer.body.statements.filter(isNamedElement)
        );
      }
      // If lambda body is just an Expression, it doesn't introduce a new sub-scope for declarations
    } else if (isForStatement(scopeContainer)) {
      // Scope includes the counter variable and statements in the block
      elementsToCheck = [
        scopeContainer.counter, // The loop counter itself
        ...scopeContainer.block.statements.filter(isNamedElement),
      ];
    }

    // Find duplicates within the collected elements
    const duplicates = elementsToCheck.filter((element) => {
      // Check if it's a relevant declaration type (Var, Const, Param)
      if (
        isConstantDeclaration(element) ||
        isMutableDeclaration(element) ||
        isParameterDeclaration(element)
      ) {
        // Compare names and make sure it's not the exact same node
        return nameProvider.getName(element) === name && element !== decl;
      }
      return false;
    });

    if (duplicates.length > 0) {
      accept(
        "error",
        `Duplicate identifier '${name}'. Cannot redeclare in the same scope.`,
        { node: decl, property: "name" }
      );
      // Add info notes to the other locations:
      // duplicates.forEach((dup) => {
      //   accept("info", `Previous declaration of '${name}' is here.`, {
      //     node: dup,
      //     property: "name",
      //   });
      // });
    }
  }
}
