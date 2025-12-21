import type { LangiumServices } from "langium/lsp";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "./type-system/ELangSpecifics.interface.js";

/**
 * Declaration of custom services
 */

export type ELangAddedServices = {
  validation: {
    // ELangValidator: ELangValidator;
  };
  typir: TypirLangiumServices<ELangSpecifics>;
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */

export type ELangServices = LangiumServices & ELangAddedServices;

