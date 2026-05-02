import { MultiplicityKind, MultiplicityKindName, MULTIPLICITY_UNLIMITED, Type } from "typir";
import {
  BooleanLiteral,
  NullLiteral,
  NumberLiteral,
  StringLiteral,
  ImaginaryNumber
} from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function getOrCreateTypeBool(typir: ELangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "boolean",
    }) ??
    typir.factory.Primitives.create({
      primitiveName: "boolean",
    })
      .inferenceRule({ languageKey: BooleanLiteral.$type })
      .finish()
  );
}

export function getOrCreateTypeNumber(typir: ELangTypirServices) {
  return (
    typir.factory.Primitives.get({ primitiveName: "number" }) ??
    typir.factory.Primitives.create({
      primitiveName: "number",
    })
      .inferenceRule({ languageKey: NumberLiteral.$type })
      .finish()
  );
}
export function getOrCreateTypeText(typir: ELangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "text",
    }) ??
    typir.factory.Primitives.create({
      primitiveName: "text",
    })
      .inferenceRule({ languageKey: StringLiteral.$type })
      .finish()
  );
}

export function getOrCreateTypeNull(typir: ELangTypirServices) {
  return (
    typir.factory.Primitives.get({
      primitiveName: "null",
    }) ??
    typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral.$type })
      .finish()
  );
}

export function getOrCreateTypeAny(typir: ELangTypirServices) {
  return typir.factory.Top.get({}) ?? typir.factory.Top.create({}).finish();
}

export function getOrCreateTypeList(elementType: Type, typir: ELangTypirServices) {
  const kind = typir.infrastructure.Kinds.getOrCreateKind(MultiplicityKindName, (s: any) => new MultiplicityKind(s));
  let listType = kind.getMultiplicityType({ constrainedType: elementType, lowerBound: 0, upperBound: MULTIPLICITY_UNLIMITED });
  if (!listType) {
      listType = kind.createMultiplicityType({ constrainedType: elementType, lowerBound: 0, upperBound: MULTIPLICITY_UNLIMITED });
  }
  return listType;
}

export function getOrCreateTypeComplex(typir: ELangTypirServices) {
  return (
    typir.factory.Primitives.get({ primitiveName: "complex" }) ??
    typir.factory.Primitives.create({
      primitiveName: "complex",
    })
      .inferenceRule({ languageKey: ImaginaryNumber.$type })
      .finish()
  );
}

export function declarePrimitiveConvertibilityToNull(
  typir: ELangTypirServices
) {
  // Null can be assigned to any type
  const typeNull = getOrCreateTypeNull(typir);
  const typeBool = getOrCreateTypeBool(typir);
  const typeNumber = getOrCreateTypeNumber(typir);
  const typeText = getOrCreateTypeText(typir);
  const typeComplex = getOrCreateTypeComplex(typir);

  typir.Conversion.markAsConvertible(typeNull, typeBool, "IMPLICIT_EXPLICIT");
  typir.Conversion.markAsConvertible(typeNull, typeNumber, "IMPLICIT_EXPLICIT");
  typir.Conversion.markAsConvertible(typeNull, typeText, "IMPLICIT_EXPLICIT");
  typir.Conversion.markAsConvertible(typeNull, typeComplex, "IMPLICIT_EXPLICIT");
}
