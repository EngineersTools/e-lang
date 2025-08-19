import {
  LangiumTypeSystemDefinition,
  TypirLangiumServices,
} from "typir-langium";
import {
  isDimensionDeclaration,
  isMeasurementLiteral,
  isUnitDeclaration,
} from "../generated/ast.js";
import { ELangAdditionalTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";
import { createDimensionType } from "./custom-types/dimension/createDimensionType.js";
import { createMeasurementType } from "./custom-types/measurement/createMeasurementType.js";
import { createUnitType } from "./custom-types/unit/createUnitType.js";
import { createConstantDeclarationInferenceRules } from "./inference-rules/createConstantDeclarationInferenceRules.js";
import { createMutableDeclarationInferenceRules } from "./inference-rules/createMutableDeclarationInferenceRules.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics>
{
  onInitialize(typir: TypirLangiumServices<ELangSpecifics>): void {
    createConstantDeclarationInferenceRules(typir);
    createMutableDeclarationInferenceRules(typir);
  }

  onNewAstNode(
    languageNode: ELangSpecifics["LanguageType"],
    typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
  ): void {
    if (isDimensionDeclaration(languageNode)) {
      createDimensionType(languageNode, typir);
    } else if (isUnitDeclaration(languageNode)) {
      createUnitType(languageNode, typir);
    } else if (isMeasurementLiteral(languageNode)) {
      createMeasurementType(languageNode, typir);
    }
  }
}
