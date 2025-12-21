import {
  InferenceRuleNotApplicable
} from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createConstantDeclarationInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    ConstantDeclaration: (languageNode) => {
      if (languageNode.type) {
        return languageNode.type;
      } else if (languageNode.value) {
        return languageNode.value;
      } else {
        return InferenceRuleNotApplicable;
      }
    },
  });

  // typir.validation.Collector.addValidationRulesForAstNodes({
    // ConstantDeclaration: validateVariableDeclaration,
  // });
}

// function validateVariableDeclaration(
//   node: ConstantDeclaration,
//   accept: ValidationProblemAcceptor<ELangSpecifics>,
//   typir: TypirServices<ELangSpecifics>
// ): void {
//   typir.validation.Constraints.ensureNodeIsAssignable(
//     node.value,
//     node,
//     accept,
//     (actual, expected) => ({
//       message: `The expression '${node.value?.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.name}' with type '${expected.name}'`,
//       languageProperty: "value",
//     })
//   );
// }
