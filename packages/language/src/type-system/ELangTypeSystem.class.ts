import { LangiumTypeSystemDefinition } from "typir-langium";
import {
  isMeasurementLiteral,
  isModelDeclaration,
  isUnitDeclaration,
} from "../generated/ast.js";
import { ElangTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
import { DimensionCalculator } from "../dimension-calculator.js";
// import { createDimensionTypeFromDeclaration } from "./custom-types/dimension/createDimensionType.js";
import { createMeasurementType } from "./custom-types/measurement/createMeasurementType.js";
import { createModelType } from "./custom-types/model/createModelType.js";
import { createUnitType } from "./custom-types/unit/createUnitType.js";
import { createBinaryOperationInferenceRules } from "./inference-rules/createBinaryOperationInferenceRules.js";
import { createConstantDeclarationInferenceRules } from "./inference-rules/createConstantDeclarationInferenceRules.js";
import { createMeasurementBinaryOperationInferenceRules } from "./inference-rules/createMeasurementBinaryOperationInferenceRules.js";
import { createMeasurementLiteralInferenceRules } from "./inference-rules/createMeasurementLiteralInferenceRules.js";
import { createMutableDeclarationInferenceRules } from "./inference-rules/createMutableDeclarationInferenceRules.js";
import { createReferenceExpressionInferenceRules } from "./inference-rules/createReferenceExpressionInferenceRules.js";
import { createTypeReferenceInferenceRules } from "./inference-rules/createTypeReferenceInferenceRule.js";
import {
  declarePrimitiveConvertibilityToNull,
  getOrCreateTypeBool,
  getOrCreateTypeNull,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
} from "./typir-types/createPrimitives.js";
// import { createDimensionDeclarationValidationRules } from "./validation-rules/createDimensionDeclarationValidationRules.js";

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
    createMeasurementLiteralInferenceRules(typir);
    createConstantDeclarationInferenceRules(typir);
    createMutableDeclarationInferenceRules(typir);
    createReferenceExpressionInferenceRules(typir);
    createMeasurementBinaryOperationInferenceRules(typir);
    createBinaryOperationInferenceRules(typir);
    createTypeReferenceInferenceRules(typir);
    // createDimensionDeclarationValidationRules(typir); // Legacy validation
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: ElangTypirServices
  ): void {
    if (isUnitDeclaration(languageNode)) {
      createUnitType(languageNode, typir, this.calculator);
    } else if (isMeasurementLiteral(languageNode)) {
      createMeasurementType(languageNode, typir, this.calculator);
    } else if (isModelDeclaration(languageNode)) {
      createModelType(languageNode, typir);
    }
    // DimensionDeclaration is no longer creating a runtime type
  }
}
