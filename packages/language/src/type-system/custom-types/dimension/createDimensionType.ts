import { TypirLangiumServices } from "typir-langium";
import {
    DimensionDeclaration
} from "../../../generated/ast.js";
import { ELangAdditionalTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";

export function createDimensionType(
  languageNode: DimensionDeclaration,
  typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
) {
  return typir.factory.Dimension.create({
    properties: {
      name: languageNode.name,
      description: languageNode.description ?? "",
      units: languageNode.units.map((unit) => ({
        name: unit.name,
        description: unit.description ?? "",
        longName: unit.longName ?? "",
      })),
    },
  })
    .inferenceRule({
      languageKey: DimensionDeclaration.$type,
      matching: (node: DimensionDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
