import { TypirLangiumSpecifics } from "typir-langium";
import { ELangAstType } from "../index.js";

export interface ELangSpecifics extends TypirLangiumSpecifics {
  AstTypes: ELangAstType;
}
