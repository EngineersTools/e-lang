import { Module, inject } from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from "langium/lsp";
import { ElangScopeComputation, ElangScopeProvider } from "./elang-scope.js";
import { ElangValidationRegistry, ElangValidator } from "./elang-validator.js";
import {
  ElangGeneratedModule,
  ElangGeneratedSharedModule,
} from "./generated/module.js";
import { ElangHoverProvider } from "./lsp/hover-provider.js";

export type ElangAddedServices = {
  validation: {
    ElangValidator: ElangValidator;
  };
};

export type ElangServices = LangiumServices & ElangAddedServices;

export const ElangModule: Module<
  ElangServices,
  PartialLangiumServices & ElangAddedServices
> = {
  validation: {
    ValidationRegistry: (services) => new ElangValidationRegistry(services),
    ElangValidator: () => new ElangValidator(),
  },
  references: {
    ScopeComputation: (services) => new ElangScopeComputation(services),
    ScopeProvider: (services) => new ElangScopeProvider(services),
  },
  lsp: {
    HoverProvider: (services) => new ElangHoverProvider(services),
  },
};

export function createElangServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  Elang: ElangServices;
} {
  const shared = inject(
    createDefaultSharedModule(context),
    ElangGeneratedSharedModule
  );
  const Elang = inject(
    createDefaultModule({ shared }),
    ElangGeneratedModule,
    ElangModule
  );

  shared.ServiceRegistry.register(Elang);

  return { shared, Elang };
}
