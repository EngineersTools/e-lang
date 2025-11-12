import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createDimensionDeclarationValidationRules(
  typir: ElangTypirServices
) {
  typir.validation.Collector.addValidationRulesForAstNodes({
    DimensionDeclaration: [
      (node, accept) => {
        if (node.units.length === 0 && !node.base) {
          accept({
            message: `A dimension must have at least one unit or base dimension defined.`,
            languageNode: node,
            severity: "error",
          });
        }
      },
      (node, accept) => {
        if (node.base && node.units.length !== 0) {
          accept({
            message: `A dimension with a defined base cannot have units defined too.`,
            languageNode: node,
            severity: "error",
          });
        }
      },
    ],
  });
}
