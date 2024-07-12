import { Module, inject } from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from "langium/lsp";
import { ELangScopeComputation, ELangScopeProvider } from "./e-lang-scope.js";
import { ELangValidationRegistry, ELangValidator } from "./e-lang-validator.js";
import {
  ELangGeneratedModule,
  ELangGeneratedSharedModule,
} from "./generated/module.js";
import { ELangHoverProvider } from "./lsp/hover-provider.js";

export type ELangAddedServices = {
  validation: {
    ELangValidator: ELangValidator;
  };
};

export type ELangServices = LangiumServices & ELangAddedServices;

export const ELangModule: Module<
  ELangServices,
  PartialLangiumServices & ELangAddedServices
> = {
  validation: {
    ValidationRegistry: (services) => new ELangValidationRegistry(services),
    ELangValidator: () => new ELangValidator(),
  },
  references: {
    ScopeComputation: (services) => new ELangScopeComputation(services),
    ScopeProvider: (services) => new ELangScopeProvider(services),
  },
  lsp: {
    HoverProvider: (services) => new ELangHoverProvider(services),
  },
};

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
    ELangModule
  );

  shared.ServiceRegistry.register(ELang);

  return { shared, ELang };
}
