import { CustomKind } from "typir";
import { Dimension } from "./custom-types/dimension/Dimension.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";

export type ELangAdditionalTypirServices = {
  readonly factory: {
    readonly Dimension: CustomKind<Dimension, ELangSpecifics>;
  };
};
