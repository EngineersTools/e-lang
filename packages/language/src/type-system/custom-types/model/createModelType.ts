import { isModelDeclaration, ModelDeclaration } from "../../../index.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ModelType } from "./Model.type.js";

export function createModelType(
  languageNode: ModelDeclaration,
  typir: ELangTypirServices
) {
  return typir.factory.Model.create({
    properties: {
      name: languageNode.name,
      // parentTypes: languageNode.parentTypes.map((pt: ModelDeclaration) => createModelType(pt.ref, typir)),
      // properties: languageNode.properties.map(p => typir.Inference.inferType(p)).filter(isType).filter(isModelProperty),
      parentTypes: languageNode.parentTypes.map((modelDeclararion) => {
        if (isModelDeclaration(modelDeclararion.ref))
          return typir.Inference.inferType(modelDeclararion.ref) as unknown as ModelType;
        throw new Error(
          `Invalid parent type reference in model '${languageNode.name}'.`
        );
      }),
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
