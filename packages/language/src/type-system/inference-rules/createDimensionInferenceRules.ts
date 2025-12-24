import { InferenceRuleNotApplicable } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createDimensionInferenceRules(typir: ElangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    DimensionDeclaration: (languageNode) => {

      languageNode.name
      
      typir.factory.Dimension.create({
        properties: { name: languageNode.name  },
      });

      return InferenceRuleNotApplicable;
    }
  });
}
