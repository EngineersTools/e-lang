import {
  TypeDescription,
  isFormulaType,
  isListType,
  isModelMemberType,
  isModelType,
  isNullType,
} from "./descriptions.js";

export type IsAssignableResult =
  | {
      result: true;
    }
  | {
      result: false;
      reason: string;
      typeDesc: TypeDescription;
    };

export function isAssignable(
  from: TypeDescription,
  to: TypeDescription
): IsAssignableResult {
  if (isModelType(from) && isModelType(to)) {
    if (from.$source === "declaration") {
      const messages: string[] = [];

      const result = from.memberTypes.every((member) => {
        const toMember = to.memberTypes.find((m) => m.name === member.name);
        if (!toMember) {
          return member.optional ?? false;
        }

        const result = isAssignable(member, toMember);

        if (!result.result) {
          messages.push(result.reason);
        }

        return result.result;
      });

      return result
        ? createAssignableResult()
        : createNonAssignableResult(from, to, messages.join("\n"));
    }
  } else if (isModelMemberType(from) && isModelMemberType(to)) {
    return from.$type === to.$type &&
      isAssignable(from.typeDesc, to.typeDesc).result
      ? createAssignableResult()
      : createNonAssignableResult(
          from,
          to,
          `Type mismatch on property ${from.name}: '${to.typeDesc.$type}' is not assignable to '${from.typeDesc.$type}'`
        );
  } else if (isNullType(from)) {
    return isModelType(to)
      ? createAssignableResult()
      : createNonAssignableResult(from, to);
  } else if (isFormulaType(from)) {
    if (!isFormulaType(to)) {
      return createNonAssignableResult(from, to);
    }
    if (!isAssignable(from.returnType, to.returnType).result) {
      return createNonAssignableResult(from, to);
    }
    if (
      from.parameterTypes &&
      to.parameterTypes &&
      from.parameterTypes.length !== to.parameterTypes.length
    ) {
      return createNonAssignableResult(from, to);
    }
    if (from.parameterTypes)
      for (let i = 0; i < from.parameterTypes.length; i++) {
        // const fromParam = from.parameters[i];
        // const toParam = to.parameters[i];
        // if (!isAssignable(fromParam.type, toParam.type)) {
        //   return false;
        // }
      }
    return createAssignableResult();
  } else if (isListType(from) && isListType(to)) {
    return from.$type === to.$type &&
      isAssignable(from.itemType, to.itemType).result
      ? createAssignableResult()
      : createNonAssignableResult(from, to);
  }

  return from.$type === to.$type
    ? createAssignableResult()
    : createNonAssignableResult(from, to);
}

function createAssignableResult(): IsAssignableResult {
  return { result: true };
}

function createNonAssignableResult(
  from: TypeDescription,
  to: TypeDescription,
  reason?: string
): IsAssignableResult {
  return {
    result: false,
    reason:
      reason ??
      `Type mismatch: '${from.$type}' is not assignable to '${to.$type}'`,
    typeDesc: to,
  };
}
