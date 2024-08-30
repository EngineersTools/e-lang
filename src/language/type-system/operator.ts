import { ELangType } from "./descriptions.js";

export function isLegalOperation(
  operator: string,
  left: ELangType,
  right?: ELangType
): boolean {
  if (operator === "+") {
    if (!right) {
      return left.$type === "number" || left.$type === "measurement";
    }
    return (
      (left.$type === "number" ||
        left.$type === "text" ||
        left.$type === "measurement") &&
      (right.$type === "number" ||
        right.$type === "text" ||
        right.$type === "measurement")
    );
  } else if (["-", "/", "*", "%", "<", "<=", ">", ">="].includes(operator)) {
    if (!right) {
      return left.$type === "number" || left.$type === "measurement";
    }
    return (
      (left.$type === "number" || left.$type === "measurement") &&
      (right.$type === "number" || right.$type === "measurement")
    );
  } else if (["and", "or"].includes(operator)) {
    return left.$type === "boolean" && right?.$type === "boolean";
  } else if (operator === "!") {
    return left.$type === "boolean";
  }
  return true;
}
