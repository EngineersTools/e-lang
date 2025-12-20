import { InferenceRuleNotApplicable, isType, Type } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator, DimensionVector } from "../../dimension-calculator.js";


export function createMeasurementBinaryOperationInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    BinaryExpression: (languageNode): Type | "N/A" => {
      // 1. Infer types of operands
      const leftType = typir.Inference.inferType(languageNode.left);
      const rightType = typir.Inference.inferType(languageNode.right);

      // 2. Check if both are Measurement types
      if (
        isType(leftType) &&
        isType(rightType) &&
        leftType.kind === typir.factory.Measurement &&
        rightType.kind === typir.factory.Measurement
      ) {
        // ... (rest of logic)
        const leftProps = (leftType as any).properties; 
        const rightProps = (rightType as any).properties;

        const leftVec = leftProps.unit.vector as DimensionVector;
        const rightVec = rightProps.unit.vector as DimensionVector;

        if (["+", "-", "="].includes(languageNode.operator)) {
            return leftType;
        } 
        else if (languageNode.operator === "*") {
            const resultVec = DimensionCalculator.addVectors(leftVec, rightVec);
            return createDerivedMeasurementType(typir, resultVec);
        } 
        else if (languageNode.operator === "/") {
            const resultVec = DimensionCalculator.subtractVectors(leftVec, rightVec);
            return createDerivedMeasurementType(typir, resultVec);
        }

        return InferenceRuleNotApplicable;
      }
      
      return InferenceRuleNotApplicable;
    },
  });

  typir.validation.Collector.addValidationRulesForAstNodes({
    BinaryExpression: [
      (node, accept) => {
        if (["+", "-", "="].includes(node.operator)) {
          const leftType = typir.Inference.inferType(node.left);
          const rightType = typir.Inference.inferType(node.right);

          if (
            isType(leftType) &&
            isType(rightType) &&
            leftType.kind === typir.factory.Measurement &&
            rightType.kind === typir.factory.Measurement
          ) {
            const leftVec = (leftType as any).properties.unit.vector as DimensionVector;
            const rightVec = (rightType as any).properties.unit.vector as DimensionVector;
            
            // Compare vectors
            const leftStr = new DimensionCalculator().toString(leftVec);
            const rightStr = new DimensionCalculator().toString(rightVec);

            if (leftStr !== rightStr) {
                accept({
                message: `Dimension mismatch: Cannot perform '${node.operator}' on '${leftType.getName()}' (${leftStr}) and '${rightType.getName()}' (${rightStr}).`,
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

function createDerivedMeasurementType(typir: ElangTypirServices, vector: DimensionVector): Type {
    const calc = new DimensionCalculator();
    const vecStr = calc.toString(vector);
    
    const name = vecStr.length > 0 ? `Derived<${vecStr}>` : "Scalar";

    if (vector.size === 0) {
        return typir.factory.Primitives.get({ primitiveName: "number" })!;
    }

    return typir.factory.Measurement.create({
        properties: {
            unit: {
                name: name,
                vector: vector
            }
        }
    }).finish().getTypeFinal()!;
}
