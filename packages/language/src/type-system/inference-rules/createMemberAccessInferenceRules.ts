import { InferenceRuleNotApplicable, isType } from "typir";
import { MemberAccess } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { isModelMemberAssignment, isParameterDeclaration } from "../../generated/ast.js";

export function createMemberAccessInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    MemberAccess: (node: MemberAccess) => {
      if (node.member && node.member.ref) {
        const ref = node.member.ref;
        if (isParameterDeclaration(ref)) {
          const type = typir.Inference.inferType(ref);
          return isType(type) ? type : InferenceRuleNotApplicable;
        } else if (isModelMemberAssignment(ref)) {
          const type = typir.Inference.inferType(ref.value);
          return isType(type) ? type : InferenceRuleNotApplicable;
        }
      }
      return InferenceRuleNotApplicable;
    },
  });
}
