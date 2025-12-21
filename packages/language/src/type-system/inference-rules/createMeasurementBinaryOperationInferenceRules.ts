import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementBinaryOperationInferenceRules(
  typir: ElangTypirServices
) {
    // Inference rules for binary operations on measurements are currently handled via manual validation in ELangValidator.
    // This avoidance is to prevent stack overflow issues observed with Typir's recursive validation.
    // Future work: Re-enable Typir inference rules when recursion issue is resolved.
}
