import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";

export type ELangAddedServices = {
  typir: TypirLangiumServices<ELangSpecifics>;
};
