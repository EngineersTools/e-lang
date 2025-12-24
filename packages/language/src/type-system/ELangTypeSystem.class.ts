import { LangiumTypeSystemDefinition } from "typir-langium";
import { DimensionCalculator } from "../dimension-calculator.js";
import { isModelDeclaration, isUnitDeclaration } from "../generated/ast.js";
import { createModelType } from "./custom-types/model/createModelType.js";
import { createUnitType } from "./custom-types/unit/createUnitType.js";
import { ElangTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
import { createBinaryOperationInferenceRules } from "./inference-rules/createBinaryOperationInferenceRules.js";
import { createConstantDeclarationInferenceRules } from "./inference-rules/createConstantDeclarationInferenceRules.js";
import { createMeasurementInferenceRules } from "./inference-rules/createMeasuremenInferenceRules.js";
import { createMeasurementBinaryOperationInferenceRules } from "./inference-rules/createMeasurementBinaryOperationInferenceRules.js";
import { createMutableDeclarationInferenceRules } from "./inference-rules/createMutableDeclarationInferenceRules.js";
import { createReferenceExpressionInferenceRules } from "./inference-rules/createReferenceExpressionInferenceRules.js";
import {
  declarePrimitiveConvertibilityToNull,
  getOrCreateTypeBool,
  getOrCreateTypeNull,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
} from "./typir-types/createPrimitives.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics>
{
  private calculator = new DimensionCalculator();

  onInitialize(typir: ElangTypirServices): void {
    getOrCreateTypeBool(typir);
    getOrCreateTypeNumber(typir);
    getOrCreateTypeText(typir);
    getOrCreateTypeNull(typir);
    declarePrimitiveConvertibilityToNull(typir);
    createMeasurementInferenceRules(typir);
    createConstantDeclarationInferenceRules(typir);
    createMutableDeclarationInferenceRules(typir);
    createReferenceExpressionInferenceRules(typir);
    createBinaryOperationInferenceRules(typir);
    createMeasurementBinaryOperationInferenceRules(typir);
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: ElangTypirServices
  ): void {
    if (isUnitDeclaration(languageNode)) {
      createUnitType(languageNode, typir, this.calculator);
    } else if (isModelDeclaration(languageNode)) {
      createModelType(languageNode, typir);
    }
  }
}
