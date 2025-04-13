import {
  ValidationAcceptor,
  ValidationChecks,
  ValidationRegistry,
} from "langium";
import { ELangServices } from "./e-lang-module.js";
import {
  ConstantDeclaration,
  ELangAstType,
  MutableDeclaration,
} from "./generated/ast.js";

export class ELangValidationRegistry extends ValidationRegistry {
  constructor(services: ELangServices) {
    super(services);

    const validator = services.validation.ELangValidator;
    const checks: ValidationChecks<ELangAstType> = {
      ConstantDeclaration: validator.checkVariableDeclaration,
      MutableDeclaration: validator.checkVariableDeclaration,
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
}
