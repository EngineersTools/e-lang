import {
  isAbsolute,
  isArcCosine,
  isArcSine,
  isArcTangent,
  isCeiling,
  isCosine,
  isFloor,
  isListValue,
  isLogarithmBaseTen,
  isMaximum,
  isMinimum,
  isNaturalLogarithm,
  isRoot,
  isRound,
  isSine,
  isSqisTangent,
  MathematicalFunction,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";
import { runExpression } from "./runExpression.js";
import { RunnerContext } from "./RunnerContext.js";
import { isTypeScriptNumber } from "./runProgram.js";

export function abs(value: number): number {
  return Math.abs(value);
}

export function cos(value: number): number {
  return Math.cos(value);
}

export function sin(value: number): number {
  return Math.sin(value);
}

export function tan(value: number): number {
  return Math.tan(value);
}

export function acos(value: number): number {
  return Math.acos(value);
}

export function asin(value: number): number {
  return Math.asin(value);
}

export function atan(value: number): number {
  return Math.atan(value);
}

export function round(value: number): number {
  return Math.round(value);
}

export function ceil(value: number): number {
  return Math.ceil(value);
}

export function floor(value: number): number {
  return Math.floor(value);
}

export function root(value: number, root: number): number {
  return Math.pow(value, 1 / root);
}

export function sqrt(value: number): number {
  return Math.sqrt(value);
}

export function log10(value: number): number {
  return Math.log10(value);
}

export function ln(value: number): number {
  return Math.log(value);
}

export function min(values: number[]): number {
  return Math.min(...values);
}

export function max(values: number[]): number {
  return Math.max(...values);
}

export async function runMathFunction(
  exp: MathematicalFunction,
  context: RunnerContext
): Promise<number> {
  const actualValue = await runExpression(exp.value, context);

  if (isListValue(actualValue)) {
    const array = await Promise.all(
      actualValue.items.map(
        async (v) => (await runExpression(v, context)) as number
      )
    );
    if (isMinimum(exp)) {
      return min(array);
    } else if (isMaximum(exp)) {
      return max(array);
    } else {
      throw new AstNodeError(
        exp,
        `Cannot apply math function ${exp.$type} to value '${actualValue}'`
      );
    }
  }

  if (!isTypeScriptNumber(actualValue)) {
    throw new AstNodeError(
      exp,
      `Cannot apply math function '${exp.$type}' to value '${actualValue}'`
    );
  }

  if (isAbsolute(exp)) return abs(actualValue);
  else if (isCosine(exp)) return cos(actualValue);
  else if (isSine(exp)) return sin(actualValue);
  else if (isTangent(exp)) return tan(actualValue);
  else if (isArcCosine(exp)) return acos(actualValue);
  else if (isArcSine(exp)) return asin(actualValue);
  else if (isArcTangent(exp)) return atan(actualValue);
  else if (isRound(exp)) return round(actualValue);
  else if (isCeiling(exp)) return ceil(actualValue);
  else if (isFloor(exp)) return floor(actualValue);
  else if (isRoot(exp))
    if (exp.root !== undefined) {
      return root(
        actualValue,
        (await runExpression(exp.root, context)) as number
      );
    } else {
      throw new AstNodeError(exp, "Expected root value in root function");
    }
  else if (isSuqareRoot(exp)) return sqrt(actualValue);
  else if (isLogarithmBaseTen(exp)) return log10(actualValue);
  else if (isNaturalLogarithm(exp)) return ln(actualValue);
  else {
    throw new AstNodeError(exp, "Unknown math function");
  }
}
