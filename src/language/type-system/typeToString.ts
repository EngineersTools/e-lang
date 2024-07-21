import { TypeReference } from "../generated/ast.js";
import { TypeDescription } from "./descriptions.js";
import { inferType } from "./infer.js";
import { TypeEnvironment } from "./TypeEnvironment.class.js";

export function typeToString(item: TypeDescription | TypeReference): string {
  const typeDesc = inferType(item, new TypeEnvironment());
  return typeDesc.$type;
}
