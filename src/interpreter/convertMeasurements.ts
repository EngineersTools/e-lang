import {
  Expression,
  MeasurementLiteral,
  isExpression,
  isLambdaDeclaration,
  isMeasurementLiteral,
} from "../language/generated/ast.js";
import { RunnerContext } from "./RunnerContext.js";
import { getConversion } from "./getConversion.js";
import { runElangStatement } from "./runElangStatement.js";
import { runExpression } from "./runExpression.js";

export async function convertMeasurements(
  left: MeasurementLiteral,
  right: MeasurementLiteral,
  context: RunnerContext,
  args?: Expression[]
): Promise<{ left: MeasurementLiteral; right: MeasurementLiteral }> {
  if (left.unit.ref?.name !== right.unit.ref?.name) {
    // By convention, the right term has precedence for unit conversion
    // Find the conversion
    const conversion = getConversion(left, right);

    let convertedMeasurement;

    if (isLambdaDeclaration(conversion)) {
      const inputArgument = await runExpression(left, context);

      context.variables.enter();
      const names = conversion.parameters.map((e) => e.name);
      context.variables.push(names[0], inputArgument);

      if (args && args.length > 0) {
        for (let i = 0; i < args.length; i++) {
          const argValue = await runExpression(args[i], context);
          context.variables.push(names[i + 1], argValue);
        }
      }

      if (isExpression(conversion.body)) {
        convertedMeasurement = await runExpression(conversion.body, context);
        if (isMeasurementLiteral(convertedMeasurement)) {
          convertedMeasurement.unit = right.unit;
        }
      } else {
        await runElangStatement(conversion.body, context, (val) => {
          convertedMeasurement = val;
        });
      }

      context.variables.leave();
    }
    // else if (isFormulaDeclaration(conversion)) {
    //   const inputArgument = await runExpression(left, context);

    //   context.variables.enter();
    //   const names = conversion.parameters.map((e) => e.name);
    //   context.variables.push(names[0], inputArgument);
    //   const returnFn: ReturnFunction = (returnValue) => {
    //     convertedMeasurement = returnValue;
    //   };
    //   await runElangStatement(conversion.body, context, returnFn);
    //   context.variables.leave();
    // }

    return {
      left: convertedMeasurement as MeasurementLiteral,
      right,
    };
  } else {
    return { left, right };
  }
}
