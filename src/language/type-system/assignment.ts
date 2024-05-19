import {
  TypeDescription,
  isFormulaType,
  isModelType,
  isNullType,
} from "./descriptions.js";

export function isAssignable(
  from: TypeDescription,
  to: TypeDescription
): boolean {
  if (isModelType(from)) {
    if (!isModelType(to)) {
      return false;
    }

    // if (from.declaration) {
    //   const fromChain = getModelDeclarationChain(from.declaration);
    //   const propNames = fromChain.flatMap((m) =>
    //     m.properties.filter((p) => !p.isOptional).map((p) => p.name)
    //   );

    //   if (isModelType(to) && to.declaration) {
    //     const memberNames = to.declaration.properties
    //       .filter((p) => !p.isOptional)
    //       .map((p) => p.name);
    //     return propNames.every((p) => memberNames.includes(p));
    //   } else if (to.value) {
    //     const memberNames = to.value.members.map((p) => p.property);
    //     return propNames.every((p) => memberNames.includes(p));
    //   }
    // } else {
    //   return to.value == from.value;
    // }

    return false;
  }

  if (isNullType(from)) {
    return isModelType(to);
  }

  if (isFormulaType(from)) {
    if (!isFormulaType(to)) {
      return false;
    }
    if (!isAssignable(from.returnType, to.returnType)) {
      return false;
    }
    if (
      from.parameterTypes &&
      to.parameterTypes &&
      from.parameterTypes.length !== to.parameterTypes.length
    ) {
      return false;
    }
    if (from.parameterTypes)
      for (let i = 0; i < from.parameterTypes.length; i++) {
        // const fromParam = from.parameters[i];
        // const toParam = to.parameters[i];
        // if (!isAssignable(fromParam.type, toParam.type)) {
        //   return false;
        // }
      }
    return true;
  }

  return from.$type === to.$type;
}
