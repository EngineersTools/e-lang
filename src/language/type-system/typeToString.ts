import { Statement, TypeReference } from "../generated/ast.js";
import { ELangType, getTypeName } from "./descriptions.js";
import { inferType } from "./infer.js";
import { TypeEnvironment } from "./TypeEnvironment.js";

export function typeToString(
  item: Statement | ELangType | TypeReference
): string {
  return getTypeName(inferType(item, new TypeEnvironment()));
}
