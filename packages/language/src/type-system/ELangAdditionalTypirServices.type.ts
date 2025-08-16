import { CustomKind, TypirServices } from "typir";
import { DimensionType } from "./custom-types/dimension/Dimension.type.js";
import { UnitType } from "./custom-types/unit/Unit.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";

export type ELangAdditionalTypirServices = {
  readonly factory: {
    readonly Unit: CustomKind<UnitType, ELangSpecifics>;
    readonly Dimension: CustomKind<DimensionType, ELangSpecifics>;
  };
};

export type ElangTypirServices = TypirServices<ELangSpecifics> &
  ELangAdditionalTypirServices;
