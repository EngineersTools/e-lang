import { ModelDeclaration } from "../../../index.js";
import {
  ELangTypirServices
} from "../../ELangAdditionalTypirServices.type.js";

export function createModelType(
  languageNode: ModelDeclaration,
  typir: ELangTypirServices
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
