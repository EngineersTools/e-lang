import type { ValidationChecks } from 'langium';
import type { ELangAstType } from './generated/ast.js';
import type { ELangServices } from "./ELangServices.type.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ELangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ELangValidator;
    const checks: ValidationChecks<ELangAstType> = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        /*
        Element: validator.checkElement
        */
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ELangValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    /*
    checkElement(element: Element, accept: ValidationAcceptor): void {
        // Always accepts
    }
    */
}
