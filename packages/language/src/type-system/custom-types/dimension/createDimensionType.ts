import { CustomType } from "typir";
import { DimensionDeclaration } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { createMeasurementTypeForUnit } from "../measurement/createMeasurementType.js";
import { DimensionType } from "./Dimension.type.js";

export function createDimensionTypeFromDeclaration(
  languageNode: DimensionDeclaration,
  typir: ElangTypirServices
) {
  let dimensionType: CustomType<DimensionType, ELangSpecifics> | undefined;

  if (languageNode.base) {
    dimensionType = createDimensionTypeFromBase(languageNode, typir);
  } else {
    dimensionType = typir.factory.Dimension.create({
      properties: {
        name: languageNode.name,
        description: languageNode.description ?? "",
        units: languageNode.units.map((unit) => ({
          name: unit.name,
          description: unit.description ?? "",
          longName: unit.longName ?? "",
        })),
        base: [],
      },
    })
      .inferenceRule({
        languageKey: DimensionDeclaration.$type,
        matching: (node: DimensionDeclaration) => languageNode === node,
      })
      .finish()
      .getTypeFinal();
  }

  if (dimensionType && languageNode.units.length > 0) {
    for (const unit of languageNode.units) {
      const measurementType = createMeasurementTypeForUnit(unit.name, typir);

      if (measurementType) {
        typir.Conversion.markAsConvertible(
          measurementType,
          dimensionType,
          "IMPLICIT_EXPLICIT"
        );
      }
    }
  }

  return dimensionType;
}

export function createDimensionTypeFromBase(
  languageNode: DimensionDeclaration,
  typir: ElangTypirServices
) {
  const dimensionType = typir.factory.Dimension.create({
    properties: {
      name: languageNode.name,
      description: languageNode.description ?? "",
      units: languageNode.base?.elements.map((el) => {
        const unitProps = {
          name: `${el.base.ref?.name ?? "Unknown Unit"}^${
            el.exponent
              ? el.negativeExponent
                ? -Math.abs(el.exponent)
                : el.exponent
              : 1
          }`,
          longName: "",
          description: "",
        };

        return unitProps;
      }) ?? [],
      base: languageNode.base
        ? languageNode.base.elements.map((base) => ({
            base: base.base.ref?.name ?? "Unknown Dimension",
            exponent: base.exponent
              ? base.negativeExponent
                ? -Math.abs(base.exponent)
                : base.exponent
              : 1,
          }))
        : [],
    },
  })
    .inferenceRule({
      languageKey: DimensionDeclaration.$type,
      matching: (node: DimensionDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();

  return dimensionType;
}
