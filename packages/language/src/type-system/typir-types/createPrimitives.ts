import { TypirLangiumServices } from "typir-langium";
import {
    BooleanLiteral,
    NullLiteral,
    NumberLiteral,
    StringLiteral,
    TypeReference,
} from "../../generated/ast.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function getOrCreateTypeBool(
  typir: TypirLangiumServices<ELangSpecifics>
) {
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

export function getOrCreateTypeNumber(
  typir: TypirLangiumServices<ELangSpecifics>
) {
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
export function getOrCreateTypeText(
  typir: TypirLangiumServices<ELangSpecifics>
) {
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

export function getOrCreateTypeNull(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "null",
    }) ??
    typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral.$type })
      .finish()
  );
}

export function createTypeAny(typir: TypirLangiumServices<ELangSpecifics>) {
  return typir.factory.Top.create({}).finish();
}
