import { ValidationChecks } from "langium";
import type { ELangServices } from "./ELangServices.type.js";
import { ELangAstType } from "./generated/ast.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ELangServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ELangValidator;
  const checks: ValidationChecks<ELangAstType> = {
    // BinaryExpression: (node, accept) => {
    //      validateBinaryExpression(node, accept, services);
    // }
  };
  registry.register(checks, validator);
}



// function validateBinaryExpression(node: BinaryExpression, accept: any, services: ELangServices) {
//     if (["+", "-", "="].includes(node.operator)) {
//         // Safe partial implementation avoiding Typir inference recursion
//         if (isMeasurementLiteral(node.left) && isMeasurementLiteral(node.right)) {
//              try {
//                  const leftVec = services.typir.factory.Unit.get(node.left.unit?.ref?.name!)?.vector
//                      ?? (new DimensionCalculator().calculateDimension(node.left.unit?.ref!));

//                  const rightVec = services.typir.factory.Unit.get(node.right.unit?.ref?.name!)?.vector
//                      ?? (new DimensionCalculator().calculateDimension(node.right.unit?.ref!));

//                  if (leftVec && rightVec) {
//                     const leftStr = new DimensionCalculator().toString(leftVec);
//                     const rightStr = new DimensionCalculator().toString(rightVec);

//                     if (leftStr !== rightStr) {
//                          accept(
//                              'error',
//                              `Dimension mismatch: Cannot perform '${node.operator}' on '${node.left.unit?.ref?.name ?? 'number'}' (${leftStr}) and '${node.right.unit?.ref?.name ?? 'number'}' (${rightStr}).`,
//                              {
//                                  node: node
//                              }
//                          );
//                     }
//                  }
//              } catch (e) {
//                  // Ignore errors during calculation to prevent crash
//              }
//         }
//     }
// }

/**
 * Implementation of custom validations.
 */
export class ELangValidator {}
