import { isType, InferenceRuleNotApplicable } from "typir";
import { ModelExpression } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { ModelProperty } from "../custom-types/model/Model.type.js";
import { patchTypirType } from "../utils/patchTypirTypes.js";

export function createModelExpressionInferenceRules(
  typir: ELangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    ModelExpression: (languageNode: ModelExpression) => {
      const properties: ModelProperty[] = [];
      
      for (const member of languageNode.members) {
        if (member.property && member.value) {
          console.log("ModelExpression member:", member.property, "Value Type:", member.value.$type);
          const valueType = typir.Inference.inferType(member.value);
          // console.log("Inferred Type:", valueType); // Can't easily stringify Type?
          console.log("Inferred Type Valid:", isType(valueType), "Keys:", isType(valueType) ? Object.keys(valueType as any) : "N/A");
          if (isType(valueType)) {
            properties.push({
              name: member.property,
              type: valueType,
              isOptional: false,
            });
          }
        }
      }

      const type = typir.factory.Model.create({
        associatedLanguageNode: languageNode,
        properties: {
          name: "Anonymous",
          parentTypes: [],
          properties: properties,
        },
      })
      .finish()
      .getTypeFinal();

      return type ? patchTypirType(type) : InferenceRuleNotApplicable;
    },
  });
}
