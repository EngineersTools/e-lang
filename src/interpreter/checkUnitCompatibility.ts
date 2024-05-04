import { MeasurementLiteral, isUnitFamilyDeclaration } from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";


export async function checkUnitCompatibility(
  leftValue: MeasurementLiteral,
  rightValue: MeasurementLiteral
) {
  if (leftValue.unit.ref &&
    isUnitFamilyDeclaration(leftValue.unit.ref.$container) &&
    rightValue.unit.ref &&
    isUnitFamilyDeclaration(rightValue.unit.ref.$container) &&
    leftValue.unit.ref.$container.name !== rightValue.unit.ref.$container.name) {
    throw new AstNodeError(
      leftValue,
      `Invalid operation: Units '${leftValue.unit.ref.name}' and '${rightValue.unit.ref.name}' do not belong to the same family. '${leftValue.unit.ref.name}' is a member of the '${leftValue.unit.ref.$container.name}' whilst '${rightValue.unit.ref.name}' is a member of the '${rightValue.unit.ref.$container.name}'`
    );
  }
}
