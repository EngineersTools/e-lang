import {
  inject,
  LangiumSharedCoreServices,
  Module,
  PartialLangiumCoreServices,
} from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
} from "langium/lsp";
import {
  createTypirLangiumServices,
  initializeLangiumTypirServices,
  TypirLangiumServices,
} from "typir-langium";
import { ELangTypeSystem } from "./e-lang-type-checking.js";
import { ELangAstType, reflection } from "./generated/ast.js";
import {
  ELangGeneratedModule,
  ELangGeneratedSharedModule,
} from "./generated/module.js";

export type ELangAddedServices = {
  typir: TypirLangiumServices<ELangAstType>;
};

export type ELangServices = LangiumServices & ELangAddedServices;

export function createELangModule(
  shared: LangiumSharedCoreServices
): Module<ELangServices, PartialLangiumCoreServices & ELangAddedServices> {
  return {
    typir: () =>
      createTypirLangiumServices(shared, reflection, new ELangTypeSystem(), {
        /* customize Typir services here */
      }),
  };
}

export function createELangServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  ELang: ELangServices;
} {

  console.log("Creating ELang shared services");

  const shared = inject(
    createDefaultSharedModule(context),
    ELangGeneratedSharedModule
  );

  console.log("Creating ELang services");

  const ELang = inject(
    createDefaultModule({ shared }),
    ELangGeneratedModule,
    createELangModule(shared)
  );

  console.log("Registering ELang services");

  shared.ServiceRegistry.register(ELang);

  console.log("Registering ELang language services");

  initializeLangiumTypirServices(ELang, ELang.typir);

  return { shared, ELang };
}
