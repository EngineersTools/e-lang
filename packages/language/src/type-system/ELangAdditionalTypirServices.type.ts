import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { DimensionType } from "./custom-types/dimension/Dimension.type.js";
import { ModelType } from "./custom-types/model/Model.type.js";
import { UnitType } from "./custom-types/unit/Unit.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";

export type ELangAdditionalTypirServices = {
  readonly factory: {
    readonly Unit: CustomKind<UnitType, ELangSpecifics>;
    readonly Dimension: CustomKind<DimensionType, ELangSpecifics>;
    readonly Model: CustomKind<ModelType, ELangSpecifics>;
  };
};

export type ELangTypirServices = TypirLangiumServices<ELangSpecifics> &
  ELangAdditionalTypirServices;
