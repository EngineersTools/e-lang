import { TypirLangiumServices } from "typir-langium";
import { MeasurementLiteral } from "../../../generated/ast.js";
import { ELangAdditionalTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";

export function createMeasurementType(
  languageNode: MeasurementLiteral,
  typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
) {
  return typir.factory.Measurement.create({
    properties: {
      unit: {
        name: languageNode.unit.ref?.name!,
      },
    },
  })
    .inferenceRule({
      languageKey: MeasurementLiteral.$type,
      matching: (node: MeasurementLiteral) =>
        languageNode === node && languageNode.unit.ref !== undefined,
    })
    .finish()
    .getTypeFinal();
}
