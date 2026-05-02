import { InferOperatorWithSingleOperand } from "typir";
import { LogicalNotExpression, NegativeNumericExpression } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";
import { getOrCreateTypeBool, getOrCreateTypeComplex, getOrCreateTypeNumber } from "../typir-types/createPrimitives.js";

export function createUnaryOperationInferenceRules(typir: ELangTypirServices) {
  const typeNumber = getOrCreateTypeNumber(typir);
  const typeBoolean = getOrCreateTypeBool(typir);
  const typeComplex = getOrCreateTypeComplex(typir);

  const unaryLogicalNotRule: InferOperatorWithSingleOperand<
    ELangSpecifics,
    LogicalNotExpression
  > = {
    languageKey: LogicalNotExpression.$type,
    matching: (node: LogicalNotExpression, name: string) => name === "not",
    operand: (node: LogicalNotExpression, _name: string) => node.value,
    validateArgumentsOfCalls: true,
  };

  typir.factory.Operators.createUnary({
    name: "not",
    signature: { operand: typeBoolean, return: typeBoolean },
  })
    .inferenceRule(unaryLogicalNotRule)
    .finish();

  const unaryNegativeNumericRule: InferOperatorWithSingleOperand<
    ELangSpecifics,
    NegativeNumericExpression
  > = {
    languageKey: NegativeNumericExpression.$type,
    matching: (node: NegativeNumericExpression, name: string) => name === "-",
    operand: (node: NegativeNumericExpression, _name: string) => node.value,
    validateArgumentsOfCalls: true,
  };

  typir.factory.Operators.createUnary({
    name: "-",
    signatures: [
      { operand: typeNumber, return: typeNumber },
      { operand: typeComplex, return: typeComplex },
    ]
  })
    .inferenceRule(unaryNegativeNumericRule)
    .finish();
}
