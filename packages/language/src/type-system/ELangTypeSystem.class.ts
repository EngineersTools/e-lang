import { LangiumTypeSystemDefinition } from "typir-langium";
import { isDimensionDeclaration, isModelDeclaration, isUnitDeclaration } from "../generated/ast.js";
import { createDimensionType } from "./custom-types/dimension/createDimensionType.js";
import { createModelType } from "./custom-types/model/createModelType.js";
import { createUnitType } from "./custom-types/unit/createUnitType.js";
import { ElangTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
import { createConstantDeclarationInferenceRules } from "./inference-rules/createConstantDeclarationInferenceRules.js";
import { createMeasurementInferenceRules } from "./inference-rules/createMeasurementInferenceRules.js";
import { createMutableDeclarationInferenceRules } from "./inference-rules/createMutableDeclarationInferenceRules.js";
import { createTypeReferenceInferenceRules } from "./inference-rules/createTypeReferenceInferenceRule.js";
import {
  declarePrimitiveConvertibilityToNull,
  getOrCreateTypeBool,
  getOrCreateTypeNull,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
} from "./typir-types/createPrimitives.js";
import { DimensionCalculator } from "./utils/dimension-calculator.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics> {
  private calculator = new DimensionCalculator();

  onInitialize(typir: ElangTypirServices): void {
    getOrCreateTypeBool(typir);
    getOrCreateTypeNumber(typir);
    getOrCreateTypeText(typir);
    getOrCreateTypeNull(typir);
    declarePrimitiveConvertibilityToNull(typir);
    createTypeReferenceInferenceRules(typir);
    createMeasurementInferenceRules(typir);
    createConstantDeclarationInferenceRules(typir);
    createMutableDeclarationInferenceRules(typir);
    // createReferenceExpressionInferenceRules(typir);
    // createBinaryOperationInferenceRules(typir);
    // createMeasurementBinaryOperationInferenceRules(typir);
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: ElangTypirServices
  ): void {
    if (isDimensionDeclaration(languageNode)) {
      createDimensionType(languageNode, typir, this.calculator);
    } else if (isUnitDeclaration(languageNode)) {
      createUnitType(languageNode, typir, this.calculator);
    } else if (isModelDeclaration(languageNode)) {
      createModelType(languageNode, typir);
    }
  }
}
