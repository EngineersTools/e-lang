import { TypirLangiumServices } from "typir-langium";
import {
    BooleanLiteral,
    ELangAstType,
    NullLiteral,
    NumberLiteral,
    StringLiteral,
    TypeReference
} from "../generated/ast.js";

export const getOrCreateTypeBool = (
  typir: TypirLangiumServices<ELangAstType>
) => {
  return (
    typir.factory.Primitives.get({
      primitiveName: "boolean",
    }) ??
    typir.factory.Primitives.create({
      primitiveName: "boolean",
    })
      .inferenceRule({ languageKey: BooleanLiteral })
      .inferenceRule({
        languageKey: TypeReference,
        matching: (node: TypeReference) => node.primitive === "boolean",
      })
      .finish()
  );
};

export const createTypeNumber = (typir: TypirLangiumServices<ELangAstType>) =>
  typir.factory.Primitives.create({
    primitiveName: "number",
  })
    .inferenceRule({ languageKey: NumberLiteral })
    .inferenceRule({
      languageKey: TypeReference,
      matching: (node: TypeReference) => node.primitive === "number",
    })
    .finish();

export const createTypeText = (typir: TypirLangiumServices<ELangAstType>) =>
  typir.factory.Primitives.create({
    primitiveName: "text",
  })
    .inferenceRule({ languageKey: StringLiteral })
    .inferenceRule({
      languageKey: TypeReference,
      matching: (node: TypeReference) => node.primitive === "text",
    })
    .finish();

export const getOrCreateTypeNull = (
  typir: TypirLangiumServices<ELangAstType>
) => {
  return (
    typir.factory.Primitives.get({
      primitiveName: "null",
    }) ??
    typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral })
      .finish()
  );
};

export const createTypeAny = (typir: TypirLangiumServices<ELangAstType>) =>
  typir.factory.Top.create({}).finish();
