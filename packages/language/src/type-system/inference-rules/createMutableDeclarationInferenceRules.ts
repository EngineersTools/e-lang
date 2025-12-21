import {
  InferenceRuleNotApplicable,
} from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMutableDeclarationInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    MutableDeclaration: (languageNode) => {
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
  //   MutableDeclaration: validateVariableDeclaration,
  // });
}

// function validateVariableDeclaration(
//   node: MutableDeclaration,
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
