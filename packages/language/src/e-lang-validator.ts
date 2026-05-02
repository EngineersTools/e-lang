import type { ValidationAcceptor, ValidationChecks } from "langium";
import { AstUtils } from "langium";
import type { ELangAstType } from "./generated/ast.js";
import type { ELangServices } from "./ELangServices.type.js";
import {
  ConstantDeclaration,
  MutableDeclaration,
  ModelDeclaration,
  FormulaDeclaration,
  DimensionDeclaration,
  UnitDeclaration,
  BinaryExpression,
  ReturnStatement,
  isNumberLiteral,
  isFormulaDeclaration,
  isLambdaExpression
} from "./generated/ast.js";
import { DimensionCalculator } from "./type-system/utils/DimensionCalculator.js";
import { ConversionCalculator } from "./type-system/utils/ConversionCalculator.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ELangServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ELangValidator;
  const checks: ValidationChecks<ELangAstType> = {
    ConstantDeclaration: validator.checkConstantInitialization,
    MutableDeclaration: validator.checkVariableTypeOrInitialization,
    ModelDeclaration: [validator.checkModelInheritanceCycles, validator.checkUniqueParameters],
    FormulaDeclaration: validator.checkUniqueParameters,
    DimensionDeclaration: validator.checkCyclicDependenciesInDimensions,
    UnitDeclaration: validator.checkCyclicDependenciesInUnits,
    BinaryExpression: validator.checkDivisionByZero,
    ReturnStatement: validator.checkReturnStatementLocation,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ELangValidator {
  checkConstantInitialization(decl: ConstantDeclaration, accept: ValidationAcceptor): void {
    if (!decl.assignment && !decl.value) {
      accept("error", "A constant must be initialized.", { node: decl, property: "name" });
    }
  }

  checkVariableTypeOrInitialization(decl: MutableDeclaration, accept: ValidationAcceptor): void {
    if (!decl.type && !decl.assignment && !decl.value) {
      accept("error", "A variable must either have a type annotation or be initialized.", { node: decl, property: "name" });
    }
  }

  checkModelInheritanceCycles(decl: ModelDeclaration, accept: ValidationAcceptor): void {
    const visited = new Set<ModelDeclaration>();
    const stack = new Set<ModelDeclaration>();

    function dfs(current: ModelDeclaration): boolean {
      if (stack.has(current)) return true;
      if (visited.has(current)) return false;

      visited.add(current);
      stack.add(current);

      if (current.parentTypes) {
        for (const parentRef of current.parentTypes) {
          const parent = parentRef.ref;
          if (parent && dfs(parent)) {
            return true;
          }
        }
      }

      stack.delete(current);
      return false;
    }

    if (dfs(decl)) {
      accept("error", `Model '${decl.name}' has a cyclic inheritance.`, { node: decl, property: "name" });
    }
  }

  checkUniqueParameters(decl: FormulaDeclaration | ModelDeclaration, accept: ValidationAcceptor): void {
    const seenNames = new Set<string>();
    if (decl.parameters) {
      for (const param of decl.parameters) {
        if (seenNames.has(param.name)) {
          accept("error", `Duplicate parameter '${param.name}'.`, { node: param, property: "name" });
        } else {
          seenNames.add(param.name);
        }
      }
    }
  }

  checkCyclicDependenciesInDimensions(decl: DimensionDeclaration, accept: ValidationAcceptor): void {
    try {
      const calculator = new DimensionCalculator();
      calculator.compute(decl);
    } catch (e: any) {
      if (e instanceof Error && e.message && e.message.includes("Cycle detected")) {
        accept("error", e.message, { node: decl, property: "name" });
      }
    }
  }

  checkCyclicDependenciesInUnits(decl: UnitDeclaration, accept: ValidationAcceptor): void {
    try {
      const calculator = new ConversionCalculator();
      calculator.compute(decl);
    } catch (e: any) {
      if (e instanceof Error && e.message && e.message.includes("Cycle detected")) {
        accept("error", e.message, { node: decl, property: "name" });
      }
    }
  }

  checkDivisionByZero(expr: BinaryExpression, accept: ValidationAcceptor): void {
    if (expr.operator === '/' && isNumberLiteral(expr.right)) {
      if (expr.right.value === 0) {
        accept("error", "Division by zero.", { node: expr, property: "right" });
      }
    }
  }

  checkReturnStatementLocation(node: ReturnStatement, accept: ValidationAcceptor): void {
    const isInsideFunction = AstUtils.hasContainerOfType(node, isFormulaDeclaration) || AstUtils.hasContainerOfType(node, isLambdaExpression);
    if (!isInsideFunction) {
      accept("error", "Return statements must be inside a formula or lambda expression.", { node });
    }
  }
}
