import { TypeReference } from "../generated/ast.js";
import { ELangType } from "./descriptions.js";
import { inferType } from "./infer.js";
import { TypeEnvironment } from "./TypeEnvironment.js";

export function typeToString(item: ELangType | TypeReference): string {
  const typeDesc = inferType(item, new TypeEnvironment());
  return typeDesc.$type;
}
