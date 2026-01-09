import { ModelDeclaration } from "../../../index.js";
import {
  ELangTypirServices
} from "../../ELangAdditionalTypirServices.type.js";

export function createModelType(
  languageNode: ModelDeclaration,
  typir: ELangTypirServices
) {
  // modelType.addListener(type => {
  //   typir.Conversion.markAsConvertible(typir.factory.Primitives.get({ primitiveName: 'null' })!, type, 'IMPLICIT_EXPLICIT');
  // });

  return typir.factory.Model.create({
    properties: {
      name: languageNode.name,
      // parentTypes: languageNode.parentTypes.map((pt: ModelDeclaration) => createModelType(pt.ref, typir)),
      // properties: languageNode.properties.map(p => typir.Inference.inferType(p)).filter(isType).filter(isModelProperty),
      parentTypes: [],
      properties: []
    },
  })
    .inferenceRule({
      languageKey: ModelDeclaration.$type,
      matching: (node: ModelDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
