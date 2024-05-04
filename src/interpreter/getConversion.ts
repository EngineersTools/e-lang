import { Reference } from "langium";
import {
  FormulaDeclaration,
  LambdaDeclaration,
  MeasurementLiteral,
  UnitFamilyDeclaration,
  isUnitFamilyDeclaration,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";

export function getConversion(
  left: MeasurementLiteral,
  right: MeasurementLiteral
): Reference<FormulaDeclaration> | LambdaDeclaration {
  if (
    left.unit.ref &&
    right.unit.ref &&
    isUnitFamilyDeclaration(right.unit.ref.$container)
  ) {
    for (const conversion of right.unit.ref.$container.conversions) {
      if (
        conversion.from.ref?.name == left.unit.ref.name &&
        conversion.to.ref?.name == right.unit.ref.name
      ) {
        if (conversion.lambda) return conversion.lambda;
        else if (conversion.formula) return conversion.formula;
      }
    }
  }

  throw new AstNodeError(
    right,
    `Cannot find conversion between unit '${left.unit.$refText}' and unit '${
      right.unit.$refText
    }'.
     Check that unit family '${
       (left.unit.ref?.$container as UnitFamilyDeclaration).name
     }' includes a suitable conversion declaration.`
  );
}
