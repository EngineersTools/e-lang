import { TypirServices } from "typir";
import { TypirLangiumSpecifics } from "typir-langium";
import { ELangAstType } from "../generated/ast.js";
import { DimensionFactoryService } from "./kinds/dimension-kind.js";

export interface ELangSpecifics extends TypirLangiumSpecifics {
  AstTypes: ELangAstType;
}

export type AdditionalElangTypeServices = {
  factory: {
    readonly Dimensions: DimensionFactoryService<ELangSpecifics>;
  };
};

export type ELangTypirServices = TypirServices<ELangSpecifics> &
  AdditionalElangTypeServices;
