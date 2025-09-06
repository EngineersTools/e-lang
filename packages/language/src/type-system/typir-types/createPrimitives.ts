import {
  BooleanLiteral,
  NullLiteral,
  NumberLiteral,
  StringLiteral,
  TypeReference
} from "../../generated/ast.js";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function getOrCreateTypeBool(typir: ElangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "boolean",
    }) ??
    typir.factory.Primitives.create({
      primitiveName: "boolean",
    })
      .inferenceRule({ languageKey: BooleanLiteral.$type })
      .inferenceRule({
        languageKey: TypeReference.$type,
        matching: (node: TypeReference) => node.primitive === "boolean",
      })
      .finish()
  );
}

export function getOrCreateTypeNumber(typir: ElangTypirServices) {
  return (
    typir.factory.Primitives.get({ primitiveName: "number" }) ??
    typir.factory.Primitives.create({
      primitiveName: "number",
    })
      .inferenceRule({ languageKey: NumberLiteral.$type })
      .inferenceRule({
        languageKey: TypeReference.$type,
        matching: (node: TypeReference) => node.primitive === "number",
      })
      .finish()
  );
}
export function getOrCreateTypeText(typir: ElangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "text",
    }) ??
    typir.factory.Primitives.create({
      primitiveName: "text",
    })
      .inferenceRule({ languageKey: StringLiteral.$type })
      .inferenceRule({
        languageKey: TypeReference.$type,
        matching: (node: TypeReference) => node.primitive === "text",
      })
      .finish()
  );
}

export function getOrCreateTypeNull(typir: ElangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "null",
    }) ??
    typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral.$type })
      .finish()
  );
}

export function createTypeAny(typir: ElangTypirServices) {
  return typir.factory.Top.create({}).finish();
}

export function declarePrimitiveConvertibilityToNull(
  typir: ElangTypirServices
) {
  // Null can be assigned to any type
  const typeNull = getOrCreateTypeNull(typir);
  const typeBool = getOrCreateTypeBool(typir);
  const typeNumber = getOrCreateTypeNumber(typir);
  const typeText = getOrCreateTypeText(typir);

  typir.Conversion.markAsConvertible(typeNull, typeBool, "IMPLICIT_EXPLICIT");
  typir.Conversion.markAsConvertible(typeNull, typeNumber, "IMPLICIT_EXPLICIT");
  typir.Conversion.markAsConvertible(typeNull, typeText, "IMPLICIT_EXPLICIT");
}
