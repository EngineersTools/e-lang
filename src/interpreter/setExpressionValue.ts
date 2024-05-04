import {
  Expression,
  isConstantDeclaration,
  isModelMemberCall,
  isModelValue,
  isMutableDeclaration,
  isParameterDeclaration,
  isPropertyDeclaration,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";
import { runMemberCall } from "./runMemberCall.js";

/**
 * Stores the value of an expression evaluation on the context
 * variables object
 * @param left the left term of the expression
 * @param right the right term of the expression
 * @param context the context in which this expression is evaluated
 * @returns A promise with the evaluation result
 */
export async function setExpressionValue<TValue>(
  left: Expression,
  right: TValue,
  context: RunnerContext
): Promise<unknown> {
  if (isModelMemberCall(left)) {
    if (left.explicitOperationCall) {
      await runMemberCall(left, context);
      return right;
    }

    let previous: unknown = undefined;
    if (left.previous) {
      previous = await runExpression(left.previous, context);
    }

    const ref = left.element?.ref;
    const name = ref?.name;

    if (!name) {
      throw new AstNodeError(left, "Cannot resolve name");
    }

    if (isConstantDeclaration(ref)) {
      throw new AstNodeError(
        left,
        `Cannot re-assign values to constant ${ref.name}`
      );
    }
    if (isPropertyDeclaration(ref) && isModelValue(previous)) {
      const member = previous.members.find(
        (m) => m //m.property.ref?.name == ref.name
      );

      if (member) {
        // member.value = right;
      }
    } else if (isMutableDeclaration(ref) || isParameterDeclaration(ref)) {
      context.variables.set(left, name, right);
    }
  } else {
    throw new AstNodeError(left, "Cannot re-assign values to constant");
  }

  return right;
}
