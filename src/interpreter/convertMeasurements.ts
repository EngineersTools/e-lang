import {
  Expression,
  MeasurementLiteral,
  isExpression,
  isFormulaDeclaration,
  isLambdaDeclaration,
  isMeasurementLiteral,
} from "../language/generated/ast.js";
import { RunnerContext } from "./RunnerContext.js";
import { getConversion } from "./getConversion.js";
import { runELangStatement } from "./runELangStatement.js";
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
        await runELangStatement(conversion.body, context, (val) => {
          convertedMeasurement = val;
        });
      }

      context.variables.leave();
    }
    else if (isFormulaDeclaration(conversion.ref)) {
      const inputArgument = await runExpression(left, context);

      context.variables.enter();
      const names = conversion.ref.parameters.map((e) => e.name);
      context.variables.push(names[0], inputArgument);

      if (args && args.length > 0) {
        for (let i = 0; i < args.length; i++) {
          const argValue = await runExpression(args[i], context);
          context.variables.push(names[i + 1], argValue);
        }
      }

      if (isExpression(conversion.ref.body)) {
        convertedMeasurement = await runExpression(conversion.ref.body, context);
        if (isMeasurementLiteral(convertedMeasurement)) {
          convertedMeasurement.unit = right.unit;
        }
      } else {
        await runELangStatement(conversion.ref.body, context, (val) => {
          convertedMeasurement = val;
        });
      }
      
      context.variables.leave();
    }

    (convertedMeasurement as MeasurementLiteral).unit = right.unit

    return {
      left: convertedMeasurement as MeasurementLiteral,
      right,
    };
  } else {
    return { left, right };
  }
}
