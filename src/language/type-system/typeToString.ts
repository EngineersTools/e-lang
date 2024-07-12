import { TypeReference } from "../generated/ast.js";
import { TypeDescription } from "./descriptions.js";

// TO STRING

export function typeToString(item: TypeDescription | TypeReference): string {
  // if (isModelType(item)) {
  //   return (
  //     item.declaration?.name ??
  //     JSON.stringify(item.value, getCircularReplacer())
  //   );
  // } else if (
  //   isFormulaType(item) ||
  //   isProcedureType(item) ||
  //   isLambdaType(item)
  // ) {
  //   if (item.parameterTypes) {
  //     const params = item.parameterTypes
  //       .map((e) => {
  //         if (e.type) return `${e.name}: ${e.$type}`;
  //         else return `${e.name}`;
  //       })
  //       .join(", ");

  //     if (item.returnType)
  //       return `(${params}) => ${typeToString(item.returnType)}`;
  //     else return `(${params})`;
  //   }
  // }

  return item.$type;
}
