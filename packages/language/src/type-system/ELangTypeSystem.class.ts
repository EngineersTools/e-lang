import { LangiumTypeSystemDefinition } from "typir-langium";
import { ElangTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
// import { createDimensionTypeFromDeclaration } from "./custom-types/dimension/createDimensionType.js";
// import { createDimensionDeclarationValidationRules } from "./validation-rules/createDimensionDeclarationValidationRules.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics>
{
  // private calculator = new DimensionCalculator();

  onInitialize(typir: ElangTypirServices): void {
    // getOrCreateTypeBool(typir);
    // getOrCreateTypeNumber(typir);
    // getOrCreateTypeText(typir);
    // getOrCreateTypeNull(typir);
    // declarePrimitiveConvertibilityToNull(typir);
    // createConstantDeclarationInferenceRules(typir);
    // createMutableDeclarationInferenceRules(typir);
    // createReferenceExpressionInferenceRules(typir);
    // createMeasurementBinaryOperationInferenceRules(typir);
    // createBinaryOperationInferenceRules(typir);
    // createTypeReferenceInferenceRules(typir);
    // createDimensionDeclarationValidationRules(typir); // Legacy validation
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: ElangTypirServices
  ): void {
    // if (isUnitDeclaration(languageNode)) {
    //   createUnitType(languageNode, typir, this.calculator);
    // } else if (isMeasurementLiteral(languageNode)) {
    //   createMeasurementType(languageNode, typir, this.calculator);
    // } else if (isModelDeclaration(languageNode)) {
    //   createModelType(languageNode, typir);
    // }
    // DimensionDeclaration is no longer creating a runtime type
  }
}
