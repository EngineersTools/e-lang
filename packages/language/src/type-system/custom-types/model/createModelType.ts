import { TypirLangiumServices } from "typir-langium";
import { ModelDeclaration } from "../../../index.js";
import { ELangAdditionalTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";

export function createModelType(
  languageNode: ModelDeclaration,
  typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
) {
  return typir.factory.Model.create({
    properties: {
      name: languageNode.name,
      parentTypes: [],
      properties: [],
    },
  })
    .inferenceRule({
      languageKey: ModelDeclaration.$type,
      matching: (node: ModelDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
