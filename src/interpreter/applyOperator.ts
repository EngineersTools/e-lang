import {
  BinaryExpression,
  isListValue,
  isModelValue,
  MeasurementLiteral,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { convertMeasurements } from "./convertMeasurements.js";
import { getBinaryQuadrant } from "./getBinaryQuadrant.js";
import { serialiseExpression } from "./serialiseExpression.js";

/**
 * Applies the operation of a {@link BinaryExpression} and returns
 * the resulting value
 * @param node the node containing the {@link BinaryExpression}
 * @param operator the operator of the expression
 * @param left the left hand side term
 * @param right the right hand side term
 * @param check a function to check whether the operator can be applied
 *              to this expression
 */

export async function applyOperator(
  node: BinaryExpression,
  operator: string,
  left: unknown,
  right: unknown,
  context: RunnerContext,
  check?: (value: unknown) => boolean
): Promise<unknown> {
  if (check && (!check(left) || !check(right))) {
    throw new AstNodeError(
      node,
      `Cannot apply operator '${operator}' to values of type '${left}' and '${right}'`
    );
  }

  const anyLeft = left as any;
  const anyRight = right as any;
  const binaryQuadrant = getBinaryQuadrant(anyLeft, anyRight);

  if (operator === "+") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return {
        ...right,
        value: left.value + right.value,
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return {
        ...(anyLeft as MeasurementLiteral),
        value: (anyLeft as MeasurementLiteral).value + (right as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return {
        ...(anyRight as MeasurementLiteral),
        value: (anyRight as MeasurementLiteral).value + (left as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftStringRightMeasurement") {
      return anyLeft + (await serialiseExpression(anyRight, context));
    } else if (binaryQuadrant == "LeftMeasurementRightString") {
      return (await serialiseExpression(anyLeft, context)) + anyRight;
    } else if (isListValue(anyRight) || isModelValue(anyRight)) {
      return anyLeft + (await serialiseExpression(anyRight, context));
    }

    if (anyLeft === null || anyLeft === undefined) {
      return `null${anyRight}`;
    } else if (anyRight === null || anyRight === undefined) {
      return `${anyLeft}null`;
    } else {
      return `${anyLeft}${anyRight}`;
    }
  } else if (operator === "-") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return {
        ...right,
        value: left.value - right.value,
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return {
        ...(anyLeft as MeasurementLiteral),
        value: (anyLeft as MeasurementLiteral).value - (right as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return {
        ...(anyRight as MeasurementLiteral),
        value: (left as number) - (anyRight as MeasurementLiteral).value,
      } as MeasurementLiteral;
    }
    return anyLeft - anyRight;
  } else if (operator === "*") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return {
        ...right,
        value: left.value * right.value,
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return {
        ...(anyLeft as MeasurementLiteral),
        value: (anyLeft as MeasurementLiteral).value * (right as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return {
        ...(anyRight as MeasurementLiteral),
        value: (left as number) * (anyRight as MeasurementLiteral).value,
      } as MeasurementLiteral;
    }
    return anyLeft * anyRight;
  } else if (operator === "/") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return {
        ...right,
        value: left.value / right.value,
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return {
        ...(anyLeft as MeasurementLiteral),
        value: (anyLeft as MeasurementLiteral).value / (right as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return {
        ...(anyRight as MeasurementLiteral),
        value: (left as number) / (anyRight as MeasurementLiteral).value,
      } as MeasurementLiteral;
    }
    return anyLeft / anyRight;
  } else if (operator === "^") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return {
        ...right,
        value: left.value ** right.value,
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return {
        ...(anyLeft as MeasurementLiteral),
        value: (anyLeft as MeasurementLiteral).value ** (right as number),
      } as MeasurementLiteral;
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return {
        ...(anyRight as MeasurementLiteral),
        value: (left as number) ** (anyRight as MeasurementLiteral).value,
      } as MeasurementLiteral;
    }
    return anyLeft ** anyRight;
  } else if (operator === "and") {
    return anyLeft && anyRight;
  } else if (operator === "or") {
    return anyLeft || anyRight;
  } else if (operator === "<") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value < right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value < (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) < (anyRight as MeasurementLiteral).value;
    }
    return anyLeft < anyRight;
  } else if (operator === "<=") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value <= right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value <= (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) <= (anyRight as MeasurementLiteral).value;
    }
    return anyLeft <= anyRight;
  } else if (operator === ">") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value > right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value > (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) > (anyRight as MeasurementLiteral).value;
    }
    return anyLeft > anyRight;
  } else if (operator === ">=") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value >= right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value >= (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) >= (anyRight as MeasurementLiteral).value;
    }
    return anyLeft >= anyRight;
  } else if (operator === "==") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value === right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value === (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) === (anyRight as MeasurementLiteral).value;
    }
    return anyLeft === anyRight;
  } else if (operator === "!=") {
    if (binaryQuadrant == "LeftMeasurementRightMeasurement") {
      const { left, right } = await convertMeasurements(
        anyLeft,
        anyRight,
        context
      );
      return left.value !== right.value;
    } else if (binaryQuadrant == "LeftMeasurementRightNumber") {
      return (anyLeft as MeasurementLiteral).value !== (right as number);
    } else if (binaryQuadrant == "LeftNumberRightMeasurement") {
      return (left as number) !== (anyRight as MeasurementLiteral).value;
    }
    return anyLeft !== anyRight;
  } else {
    throw new AstNodeError(
      node,
      `Invalid Operator: operator ${operator} is unknown`
    );
  }
}
