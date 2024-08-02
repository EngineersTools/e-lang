import { AstNode, interruptAndCheck } from "langium";
import {
  Expression,
  isConstantDeclaration,
  isExpression,
  isFormulaDeclaration,
  isLambdaDeclaration,
  isListValue,
  isModelMemberAssignment,
  isModelValue,
  isMutableDeclaration,
  isParameterDeclaration,
  isProcedureDeclaration,
  isPropertyDeclaration,
  ModelMemberAssignment,
  ModelMemberCall,
  NamedElement,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { ReturnFunction, runELangStatement } from "./runELangStatement.js";
import { runExpression } from "./runExpression.js";

export async function runMemberCall(
  memberCall: ModelMemberCall,
  context: RunnerContext
): Promise<unknown> {
  await interruptAndCheck(context.cancellationToken);

  let previous: unknown = undefined;

  if (memberCall.previous) {
    previous = await runExpression(memberCall.previous, context);
  }

  const ref = memberCall.element?.ref;
  let value: unknown;

  if (
    isFormulaDeclaration(ref) ||
    isProcedureDeclaration(ref) ||
    isLambdaDeclaration(ref)
  ) {
    value = ref;
  } else if (
    isConstantDeclaration(ref) ||
    isMutableDeclaration(ref) ||
    isParameterDeclaration(ref)
  ) {
    value = context.variables.get(memberCall, ref.name) ?? null;
  } else if (isModelValue(previous)) {
    if (isPropertyDeclaration(ref))
      value = previous.members.find((e) => e.property == ref.name) ?? null;
    else if (isModelMemberAssignment(ref))
      value =
        previous.members.find(
          (e) => e.property == (ref as ModelMemberAssignment).property
        ) ?? null;
  } else if (
    isModelMemberAssignment(previous) &&
    isModelValue(previous.value)
  ) {
    if (isPropertyDeclaration(ref))
      value =
        previous.value.members.find((e) => e.property == ref.name) ?? null;
    if (isModelMemberAssignment(ref))
      value =
        previous.value.members.find(
          (e) => e.property == (ref as ModelMemberAssignment).property
        ) ?? null;
  } else {
    value = previous;
  }

  // List access
  if (
    memberCall.accessElement == true &&
    memberCall.index !== undefined &&
    ref !== undefined
  ) {
    if (isModelMemberAssignment(value)) {
      if (isListValue(value.value)) {
        return await getListElement(
          memberCall,
          memberCall.index,
          context,
          ref,
          value.value
        );
      } else {
        return await getListElement(memberCall, memberCall.index, context, ref);
      }
    } else if (isListValue(value)) {
      return await getListElement(
        memberCall,
        memberCall.index,
        context,
        ref,
        value
      );
    }
  }

  // Call a formula, a procedure or a lambda
  if (memberCall.explicitOperationCall) {
    if (
      isFormulaDeclaration(ref) ||
      isProcedureDeclaration(ref) ||
      isLambdaDeclaration(ref)
    ) {
      const args = await Promise.all(
        memberCall.arguments.map((e) => runExpression(e, context))
      );
      context.variables.enter();
      const names = ref.parameters.map((e) => e.name);
      for (let i = 0; i < args.length; i++) {
        context.variables.push(names[i], args[i]);
      }
      let functionValue: unknown;
      const returnFn: ReturnFunction = (returnValue) => {
        functionValue = returnValue;
      };
      await runELangStatement(ref.body, context, returnFn);
      context.variables.leave();
      return functionValue;
    } else if (isFormulaDeclaration(value) || isLambdaDeclaration(value)) {
      const args = await Promise.all(
        memberCall.arguments.map((e) => runExpression(e, context))
      );
      context.variables.enter();
      const names = value.parameters.map((e) => e.name);
      for (let i = 0; i < args.length; i++) {
        context.variables.push(names[i], args[i]);
      }
      let functionValue: unknown;
      const returnFn: ReturnFunction = (returnValue) => {
        functionValue = returnValue;
      };
      await runELangStatement(value.body, context, returnFn);
      context.variables.leave();
      return functionValue;
    } else if (
      isModelMemberAssignment(value) &&
      isLambdaDeclaration(value.value)
    ) {
      const args = await Promise.all(
        memberCall.arguments.map((e) => runExpression(e, context))
      );
      context.variables.enter();
      const names = value.value.parameters.map((e) => e.name);
      for (let i = 0; i < args.length; i++) {
        context.variables.push(names[i], args[i]);
      }
      let functionValue: unknown;
      const returnFn: ReturnFunction = (returnValue) => {
        functionValue = returnValue;
      };
      await runELangStatement(value.value.body, context, returnFn);
      context.variables.leave();
      return functionValue;
    } else {
      throw new AstNodeError(
        memberCall,
        "Cannot call an expression that is not a formula, a procedure or a lambda."
      );
    }
  }

  if (value == undefined) {
    throw new AstNodeError(
      memberCall,
      `Variable '${memberCall.element.$refText}' not found.`
    );
  }

  if (isModelMemberAssignment(value) && isExpression(value.value)) {
    value = await runExpression(value.value, context);
  }

  return value;
}

async function getListElement(
  memberCall: ModelMemberCall,
  indexExp: Expression | number,
  context: RunnerContext,
  ref: AstNode & NamedElement,
  val?: AstNode
) {
  let index = 0;

  if (isExpression(indexExp)) {
    index = (await runExpression(indexExp, context)) as number;
  } else {
    index = indexExp;
  }

  // ELang is a 1 based indexing language.
  // Items in a list are indexed from 1 to the
  // length of the list
  index--;

  if(index < 0) {
    throw new AstNodeError(
      memberCall,
      `Index out of range. The index must be greater than 0.`
    );
  }

  const value = val ?? context.variables.get(ref, ref.name);

  if (isListValue(value) && index < value.items.length && index >= 0) {
    return await runExpression(value.items[index], context);
  } else {
    throw new AstNodeError(
      memberCall,
      `Index out of range. The list '${
        memberCall.element.$refText
      }' has less than ${indexExp} elements`
    );
  }
}
