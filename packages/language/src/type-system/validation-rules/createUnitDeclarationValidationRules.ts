import { isType } from "typir";
import {
    DimensionDeclaration,
    isDimensionDeclaration,
    isUnitOperation,
    UnitDeclaration,
    UnitExpression,
} from "../../generated/ast.js";
import { isDimensionType } from "../custom-types/dimension/Dimension.type.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../utils/DimensionCalculator.js";

export function createUnitDeclarationValidationRules(
  typir: ELangTypirServices
) {
  const calculator = new DimensionCalculator();

  typir.validation.Collector.addValidationRulesForAstNodes({
    UnitDeclaration: [
      (node, accept) => {
        if (nodeHasDimensionReference(node) && nodeHasExpression(node)) {
          const dimensionType = typir.Inference.inferType(node.dimension.ref);
          if (
            isType(dimensionType) &&
            "properties" in dimensionType &&
            isDimensionType(dimensionType.properties)
          ) {
            const dimensionVector = dimensionType.properties.vector;
            const expressionVector = calculator.compute(node.expression);
            if (
              !DimensionCalculator.areVectorsEqual(
                expressionVector,
                dimensionVector
              )
            ) {
              accept({
                message: `The unit '${node.name}' definition is incompatible with its dimension '${node.dimension.ref.name}'.`,
                languageNode: node,
                severity: "error",
              });
            }
          }
        }
      },
    ],
  });
}

function nodeHasDimensionReference(
  node: UnitDeclaration
): node is UnitDeclaration & { dimension: { ref: DimensionDeclaration } } {
  return (
    node.dimension !== undefined &&
    node.dimension.ref !== undefined &&
    isDimensionDeclaration(node.dimension.ref)
  );
}

function nodeHasExpression(
  node: UnitDeclaration
): node is UnitDeclaration & { expression: UnitExpression } {
  return node.expression !== undefined && isUnitOperation(node.expression);
}
