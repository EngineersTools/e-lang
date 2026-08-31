import type { BinaryExpression, BooleanLiteral, MeasurementLiteral, NullLiteral, NumericLiteral, Program, Statement, TextLiteral } from "../frontend/ast";
import type { BooleanValue, MeasurementValue, NullValue, NumberValue, RuntimeValue, TextValue } from "./values";

export function evaluateStatement(astNode: Statement): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return { type: "number", value: (astNode as NumericLiteral).value } as NumberValue;
        case "TextLiteral":
            return { type: "text", value: (astNode as TextLiteral).value } as TextValue;
        case "BooleanLiteral":
            return { type: "boolean", value: (astNode as BooleanLiteral).value } as BooleanValue;
        case "NullLiteral":
            return { type: "null", value: (astNode as NullLiteral).value } as NullValue;
        case "MeasurementLiteral":
            return { type: "measurement", value: (astNode as MeasurementLiteral).value, unit: (astNode as MeasurementLiteral).unit } as MeasurementValue;
        case "BinaryExpression":
            return evaluateBinaryExpression(astNode as BinaryExpression);
        case "Program":
            return evaluateProgram(astNode as Program);
        default:
            throw new Error(`Unsupported statement kind: ${astNode.kind}`);
    }
}

function evaluateProgram(astNode: Program): RuntimeValue {
    let lastEvaluatedValue: RuntimeValue = { type: "null", value: null } as NullValue;
    for (const statement of astNode.body) {
        lastEvaluatedValue = evaluateStatement(statement);
    }
    return lastEvaluatedValue;
}

function evaluateBinaryExpression(astNode: BinaryExpression): RuntimeValue {
    const leftValue = evaluateStatement(astNode.left);
    const rightValue = evaluateStatement(astNode.right);

    if (leftValue.type === "measurement" || rightValue.type === "measurement") {
        return evaluateMeasurementBinaryExpression(astNode);
    }

    if (leftValue.type !== rightValue.type) {
        throw new Error(`Type mismatch in binary expression: ${leftValue.type} and ${rightValue.type}`);
    }

    switch (astNode.operator) {
        case "+":
            if (leftValue.type === "number") {
                return { type: "number", value: (leftValue as NumberValue).value + (rightValue as NumberValue).value } as NumberValue;
            } else if (leftValue.type === "text") {
                return { type: "text", value: (leftValue as TextValue).value + (rightValue as TextValue).value } as TextValue;
            }
            break;
        case "-":
            if (leftValue.type === "number") {
                return { type: "number", value: (leftValue as NumberValue).value - (rightValue as NumberValue).value } as NumberValue;
            }
            break;
        case "*":
            if (leftValue.type === "number") {
                return { type: "number", value: (leftValue as NumberValue).value * (rightValue as NumberValue).value } as NumberValue;
            }
            break;
        case "/":
            if (leftValue.type === "number") {
                return { type: "number", value: (leftValue as NumberValue).value / (rightValue as NumberValue).value } as NumberValue;
            }
            break;
        case "^":
            if (leftValue.type === "number") {
                return { type: "number", value: Math.pow((leftValue as NumberValue).value, (rightValue as NumberValue).value) } as NumberValue;
            }
            break;
        default:
            throw new Error(`Unsupported operator in binary expression: ${astNode.operator}`);
    }

    throw new Error(`Unsupported binary expression with types: ${leftValue.type} and ${rightValue.type}`);
}

function evaluateMeasurementBinaryExpression(astNode: BinaryExpression): MeasurementValue {
    const leftValue = evaluateStatement(astNode.left);
    const rightValue = evaluateStatement(astNode.right);

    if (leftValue.type === "measurement" && rightValue.type === "number") {
        const leftMeasurement = leftValue as MeasurementValue;
        const rightMeasurement = rightValue as NumberValue;

        switch (astNode.operator) {
            case "+":
                throw new Error(`Cannot add a measurement and a number directly. Consider converting the number to a measurement first.`);
            case "-":
                throw new Error(`Cannot subtract a number from a measurement directly. Consider converting the number to a measurement first.`);
            case "*":
                return { type: "measurement", value: leftMeasurement.value * rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            case "/":
                return { type: "measurement", value: leftMeasurement.value / rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            default:
                throw new Error(`Unsupported operator in measurement binary expression: ${astNode.operator}`);
        }
    } else if (leftValue.type === "number" && rightValue.type === "measurement") {
        const leftMeasurement = leftValue as NumberValue;
        const rightMeasurement = rightValue as MeasurementValue;

        switch (astNode.operator) {
            case "+":
                throw new Error(`Cannot add a number and a measurement directly. Consider converting the number to a measurement first.`);
            case "-":
                throw new Error(`Cannot subtract a measurement from a number directly. Consider converting the number to a measurement first.`);
            case "*":
                return { type: "measurement", value: leftMeasurement.value * rightMeasurement.value, unit: rightMeasurement.unit } as MeasurementValue;
            case "/":
                throw new Error(`Cannot divide a number by a measurement directly. Consider converting the number to a measurement first.`);
            default:
                throw new Error(`Unsupported operator in measurement binary expression: ${astNode.operator}`);
        }
    } else if (leftValue.type === "measurement" && rightValue.type === "measurement") {

        const leftMeasurement = leftValue as MeasurementValue;
        const rightMeasurement = rightValue as MeasurementValue;

        if (leftMeasurement.unit !== rightMeasurement.unit) {
            throw new Error(`Unit mismatch in measurement binary expression: ${leftMeasurement.unit} and ${rightMeasurement.unit}`);
        }

        switch (astNode.operator) {
            case "+":
                return { type: "measurement", value: leftMeasurement.value + rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            case "-":
                return { type: "measurement", value: leftMeasurement.value - rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            case "*":
                return { type: "measurement", value: leftMeasurement.value * rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            case "/":
                return { type: "measurement", value: leftMeasurement.value / rightMeasurement.value, unit: leftMeasurement.unit } as MeasurementValue;
            default:
                throw new Error(`Unsupported operator in measurement binary expression: ${astNode.operator}`);
        }
    }

    throw new Error(`Type mismatch in binary expression: ${leftValue.type} and ${rightValue.type}`);
}