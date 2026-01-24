import {
    Expression,
    isBinaryExpression,
    isBooleanLiteral,
    isListExpression,
    isLogicalNotExpression,
    isMeasurement,
    isModelExpression,
    isNegativeNumericExpression,
    isNullLiteral,
    isNumberLiteral,
    isPostUnaryExpression,
    isStringLiteral
} from "e-lang-language";
import { RunnerContext } from "./RunnerContext.js";
import { runBinaryExpression } from "./runBinaryExpression.js";

// Helper type guard
// function isAssignment(expr: Expression): boolean {
//   return isBinaryExpression(expr) && expr.operator === "=";
// }

export async function runExpression(
  expression: Expression,
  context: RunnerContext,
): Promise<any> {
  if (
    isNumberLiteral(expression) ||
    isBooleanLiteral(expression) ||
    isStringLiteral(expression) ||
    isNullLiteral(expression)
  ) {
    return expression.value;
  } else if (isListExpression(expression)) {
    const elements = [];

    for (const elemExpr of expression.elements) {
      const elemValue = await runExpression(elemExpr, context);
      elements.push(elemValue);
    }

    return elements;
  } else if (isModelExpression(expression)) {
    const model: Record<string, any> = {};

    for (const member of expression.members) {
      const memberValue = await runExpression(member.value, context);
      model[member.property] = memberValue;
    }

    return model;
  } else if (isBinaryExpression(expression)) {
    return runBinaryExpression(expression, context);
  } else if (isLogicalNotExpression(expression)) {
    const value = await runExpression(expression.value, context);
    if (typeof value !== "boolean")
      throw new Error("Type Error: 'not' requires boolean operand");
    return !value;
  } else if (isNegativeNumericExpression(expression)) {
    const value = await runExpression(expression.value, context);
    if (typeof value !== "number")
      throw new Error("Type Error: unary '-' requires number operand");
    return -value;
  } else if(isPostUnaryExpression(expression)) {
    const value = await runExpression(expression.value, context);
    const op = expression.operator;
    switch(op) {
      case "++":
        if (typeof value !== "number")
          throw new Error("Type Error: '++' requires number operand");
        return value + 1;
      case "--":
        if (typeof value !== "number")
          throw new Error("Type Error: '--' requires number operand");
        return value - 1;
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  } else if(isMeasurement(expression)) {
    const value = await runExpression(expression.value, context);
    return { value, unit: expression.unit.ref };
  }



//   } else if (isPreUnaryExpression(expression)) {
//     const value = await runExpression(expression.value, context);
//     const op = expression.operator;
//     switch (op) {
//       case "not":
//         if (typeof value !== "boolean")
//           throw new Error(
//             "Type Error: 'not' requires boolean operand",
//           );
//         return !value;
//       case "-":
//         if (typeof value !== "number")
//           throw new Error(
//             "Type Error: unary '-' requires number operand",
//           );
//         return -value;
//       default:
//         throw new Error(`Unknown unary operator: ${op}`);
//     }
//   }

  //   else if (isAssignment(expression)) {
  //     if (isBinaryExpression(expression)) {
  //       const rightVal = await runExpression(expression.right, context);
  //       if (isReferenceExpression(expression.left)) {
  //         const decl = expression.left.element.ref;
  //         if (!decl)
  //           throw new AstNodeError(expression, "Unresolved assignment target");
  //         // We need context.variables.set to take AstNode for error reporting
  //         // My Variables implementation takes (node, name, value).
  //         // I should verify Variables class again.
  //         // Variables.set(node: AstNode, name: string, value: unknown)
  //         context.variables.set(expression, decl.name, rightVal);
  //         return rightVal;
  //       }
  //       throw new AstNodeError(expression, "Invalid assignment target");
  //     }
  //   } else if (isPreUnaryExpression(expression)) {
  //     const value = await runExpression(expression.value, context);
  //     const op = expression.operator;
  //     switch (op) {
  //       case "not":
  //         if (typeof value !== "boolean")
  //           throw new AstNodeError(
  //             expression,
  //             "Type Error: 'not' requires boolean operand",
  //           );
  //         return !value;
  //       case "-":
  //         if (typeof value !== "number")
  //           throw new AstNodeError(
  //             expression,
  //             "Type Error: unary '-' requires number operand",
  //           );
  //         return -value;
  //       default:
  //         throw new AstNodeError(expression, `Unknown unary operator: ${op}`);
  //     }
  //   } else if (isReferenceExpression(expression)) {
  //     const decl = expression.element.ref;
  //     if (!decl)
  //       throw new AstNodeError(
  //         expression,
  //         `Unresolved reference to ${expression.element.$refText}`,
  //       );
  //     return context.variables.get(expression, decl.name);
  //   } else if (isCallExpression(expression)) {
  //     return runMemberCall(expression, context);
  //   }

  return undefined;
}
