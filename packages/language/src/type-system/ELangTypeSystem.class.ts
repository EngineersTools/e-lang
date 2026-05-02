import { LangiumTypeSystemDefinition } from "typir-langium";
import {
  isDimensionDeclaration,
  isModelDeclaration,
  isModelExpression,
  isUnitDeclaration,
} from "../generated/ast.js";
import { createDimensionType } from "./custom-types/dimension/createDimensionType.js";
import { createModelType } from "./custom-types/model/createModelType.js";
import { createUnitType } from "./custom-types/unit/createUnitType.js";
import { ELangTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
import { createBinaryOperationInferenceRules } from "./inference-rules/createBinaryOperationInferenceRules.js";
import { createConstantDeclarationInferenceRules } from "./inference-rules/createConstantDeclarationInferenceRules.js";
import { createMeasurementBinaryOperationInferenceRules } from "./inference-rules/createMeasurementBinaryOperationInferenceRules.js";
import { createMeasurementInferenceRules } from "./inference-rules/createMeasurementInferenceRules.js";
import { createMutableDeclarationInferenceRules } from "./inference-rules/createMutableDeclarationInferenceRules.js";
import { createParameterDeclarationInferenceRules } from "./inference-rules/createParameterDeclarationInferenceRules.js";
import { createReferenceExpressionInferenceRules } from "./inference-rules/createReferenceExpressionInferenceRules.js";
import { createTypeReferenceInferenceRules } from "./inference-rules/createTypeReferenceInferenceRule.js";
import { createListExpressionInferenceRules } from "./inference-rules/createListExpressionInferenceRules.js";
import { createIndexedAccessInferenceRules } from "./inference-rules/createIndexedAccessInferenceRules.js";
import {
  declarePrimitiveConvertibilityToNull,
  getOrCreateTypeBool,
  getOrCreateTypeNull,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
  getOrCreateTypeComplex,
} from "./typir-types/createPrimitives.js";
import { DimensionCalculator } from "./utils/DimensionCalculator.js";
import { createUnitDeclarationValidationRules } from "./validation-rules/createUnitDeclarationValidationRules.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics>
{
  private calculator = new DimensionCalculator();

  onInitialize(typir: ELangTypirServices): void {
    getOrCreateTypeBool(typir);
    getOrCreateTypeNumber(typir);
    getOrCreateTypeText(typir);
    getOrCreateTypeNull(typir);
    getOrCreateTypeComplex(typir);
    declarePrimitiveConvertibilityToNull(typir);
    createTypeReferenceInferenceRules(typir);
    createMeasurementInferenceRules(typir);
    createConstantDeclarationInferenceRules(typir);
    createMutableDeclarationInferenceRules(typir);
    createReferenceExpressionInferenceRules(typir);
    createBinaryOperationInferenceRules(typir);
    createMeasurementBinaryOperationInferenceRules(typir);
    createParameterDeclarationInferenceRules(typir);
    createUnitDeclarationValidationRules(typir);
    createListExpressionInferenceRules(typir);
    createIndexedAccessInferenceRules(typir);
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: ELangTypirServices
  ): void {
    if (isDimensionDeclaration(languageNode)) {
      createDimensionType(languageNode, typir, this.calculator);
    } else if (isUnitDeclaration(languageNode)) {
      createUnitType(languageNode, typir, this.calculator);
    } else if (isModelDeclaration(languageNode)) {
      createModelType(languageNode, typir);
    } else if (isModelExpression(languageNode)) {
      createModelType(languageNode, typir);
    }
  }
}
