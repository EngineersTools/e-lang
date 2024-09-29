import {
  ParameterType,
  ELangType,
  isEmptyListType,
  isFormulaType,
  isListType,
  isMeasurementType,
  isModelMemberType,
  isModelType,
  isNullType,
  isParameterType,
  isUnionType,
} from "./descriptions.js";

export type IsAssignableResult =
  | {
      result: true;
    }
  | {
      result: false;
      reason: string;
      typeDesc: ELangType;
    };

export function isAssignable(
  from: ELangType,
  to: ELangType
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
    return isAssignable(from.typeDesc, to.typeDesc).result
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
      return isAssignable(from.returnType, to);
    } else if (!isAssignable(from.returnType, to.returnType).result) {
      return createNonAssignableResult(from, to);
    } else if (
      from.parameterTypes &&
      to.parameterTypes &&
      from.parameterTypes.length !== to.parameterTypes.length
    ) {
      return createNonAssignableResult(from, to);
    } else if (from.parameterTypes && to.parameterTypes) {
      const messages: string[] = [];

      const result = from.parameterTypes.every((param, i) => {
        const result = isAssignable(
          param,
          (to.parameterTypes as ParameterType[])[i]
        );

        if (!result.result) {
          messages.push(result.reason);
        }

        return result.result;
      });

      return result
        ? createAssignableResult()
        : createNonAssignableResult(from, to, messages.join("\n"));
    }
  } else if (isListType(from) && isListType(to)) {
    let isAssignableResult;

    if (isListType(from.itemType)) {
      isAssignableResult = isAssignable(from.itemType.itemType, to.itemType);
    } else if (isListType(to.itemType)) {
      isAssignableResult = isAssignable(from.itemType, to.itemType.itemType);
    } else {
      isAssignableResult = isAssignable(from.itemType, to.itemType);
    }

    if (from.$type === to.$type && isAssignableResult.result) {
      return createAssignableResult();
    } else if (!isAssignableResult.result) {
      return createNonAssignableResult(
        from,
        to,
        isAssignableResult.reason ??
          `Type mismatch: '${from.itemType.$type}' is not assignable to '${to.itemType.$type}'`
      );
    }
  } else if (isListType(to)) {
    if (isListType(from)) {
      return isAssignable(from.itemType, to.itemType);
    } else if (isEmptyListType(from)) {
      return createAssignableResult();
    } else {
      return isAssignable(from, to.itemType);
    }
  } else if (isListType(from)) {
    if (isEmptyListType(from)) {
      return createAssignableResult();
    } else {
      return isAssignable(from.itemType, to);
    }
  } else if (isUnionType(to) && isUnionType(from)) {
    // If both are union types, check that all times in 'from'
    // are contained in 'to'
    const allFromIncluded = from.types
      .map((t) => t.$type)
      .every((t) => to.types.map((t) => t.$type).includes(t));

    return allFromIncluded
      ? createAssignableResult()
      : createNonAssignableResult(
          from,
          to,
          `Type mismatch: '${from.types
            .map((t) => (isModelType(t) ? t.modelName : t.$type))
            .join(" or ")}' is not assignable to '${to.types
            .map((t) => (isModelType(t) ? t.modelName : t.$type))
            .join(" or ")}'`
        );
  } else if (isUnionType(to)) {
    const someIncluded = to.types.some((t) => t.$type === from.$type);
    return someIncluded
      ? createAssignableResult()
      : createNonAssignableResult(
          from,
          to,
          `Type mismatch: '${
            isModelType(from) ? from.modelName : from.$type
          }' is not assignable to '${to.types
            .map((t) => (isModelType(t) ? t.modelName : t.$type))
            .join(" or ")}'`
        );
  } else if (isUnionType(from)) {
    const allIncluded = from.types.every((t) => t.$type === from.$type);
    return allIncluded
      ? createAssignableResult()
      : createNonAssignableResult(
          from,
          to,
          `Type mismatch: '${from.types
            .map((t) => (isModelType(t) ? t.modelName : t.$type))
            .join(" or ")}' is not assignable to '${
            isModelType(to) ? to.modelName : to.$type
          }'`
        );
  } else if (isMeasurementType(from) && isMeasurementType(to)) {
    return from.unitFamilyType.name === to.unitFamilyType.name
      ? createAssignableResult()
      : createNonAssignableResult(
          from,
          to,
          `Type mismatch: Measurement units of family '${to.unitFamilyType.name}' are not assignable to Unit Family '${from.unitFamilyType.name}'`
        );
  } else if (isParameterType(from)) {
    return isAssignable(from.typeDescription, to).result
      ? createAssignableResult()
      : createNonAssignableResult(
          from.typeDescription,
          to,
          `Type mismatch: '${from.name}: ${from.typeDescription.$type}' is not assignable to '${to.$type}'`
        );
  }

  return from.$type === to.$type
    ? createAssignableResult()
    : createNonAssignableResult(from, to);
}

function createAssignableResult(): IsAssignableResult {
  return { result: true };
}

function createNonAssignableResult(
  from: ELangType,
  to: ELangType,
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
