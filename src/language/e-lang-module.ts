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
import { ELangValidationRegistry, ELangValidator } from "./e-lang-validator.js";
import { ELangAstType, reflection } from "./generated/ast.js";
import {
  ELangGeneratedModule,
  ELangGeneratedSharedModule,
} from "./generated/module.js";

export type ELangAddedServices = {
  validation: {
    ELangValidator: ELangValidator;
  };
  typir: TypirLangiumServices<ELangAstType>;
};

export type ELangServices = LangiumServices & ELangAddedServices;

export function createELangModule(
  shared: LangiumSharedCoreServices
): Module<ELangServices, PartialLangiumCoreServices & ELangAddedServices> {
  return {
    validation: {
      ValidationRegistry: (services) => new ELangValidationRegistry(services),
      ELangValidator: () => new ELangValidator(),
    },
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
  const shared = inject(
    createDefaultSharedModule(context),
    ELangGeneratedSharedModule
  );

  const ELang = inject(
    createDefaultModule({ shared }),
    ELangGeneratedModule,
    createELangModule(shared)
  );

  shared.ServiceRegistry.register(ELang);

  initializeLangiumTypirServices(ELang, ELang.typir);

  return { shared, ELang };
}
