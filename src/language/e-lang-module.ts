import {
  inject,
  LangiumSharedCoreServices,
  Module,
  PartialLangiumCoreServices,
} from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  PartialLangiumLSPServices,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
} from "langium/lsp";
import { createTypirLangiumServicesWithAdditionalServices } from "typir-langium";
import { ELangHoverProvider } from "./e-lang-hover-provider.js";
import { ELangScopeComputation, ELangScopeProvider } from "./e-lang-scope.js";
import { ELangTypeSystem } from "./e-lang-type-checking.js";
import { ELangValidationRegistry, ELangValidator } from "./e-lang-validator.js";
import { reflection } from "./generated/ast.js";
import {
  ELangGeneratedModule,
  ELangGeneratedSharedModule,
} from "./generated/module.js";
import { ELangTypirServices } from "./type-system/e-lang-type-services.js";

export type ELangAddedServices = {
  validation: {
    ELangValidator: ELangValidator;
  };
  typir: ELangTypirServices;
};

export type ELangServices = LangiumServices & ELangAddedServices;

export function createELangModule(
  shared: LangiumSharedCoreServices
): Module<
  ELangServices,
  PartialLangiumCoreServices & PartialLangiumLSPServices & ELangAddedServices
> {
  return {
    validation: {
      ValidationRegistry: (services) => new ELangValidationRegistry(services),
      ELangValidator: () => new ELangValidator(),
    },
    typir: (services) =>
      createTypirLangiumServicesWithAdditionalServices(
        shared,
        reflection,
        new ELangTypeSystem(),
        {
          factory: {},
        }
      ),
    // typir: () =>
    //   createTypirLangiumServices(shared, reflection, new ELangTypeSystem(), {
    //     factory: {
    //       Unit: (services: ELangTypirServices<UnitDeclaration>) =>
    //         createUnitFactory(services),
    //       Dimensions: (services: ELangTypirServices<ELangAstType>) =>
    //         services.infrastructure.Kinds.getOrCreateKind(
    //           DimensionKindName,
    //           (services) => new DimensionKind(services)
    //         ) as DimensionFactoryService<ELangAstType>,
    //     },
    //   } as Module<PartialTypirLangiumServices<ELangAstType>>),
    lsp: {
      HoverProvider: (services) => new ELangHoverProvider(services),
    },
    references: {
      ScopeProvider: (services) => new ELangScopeProvider(services),
      ScopeComputation: (services) => new ELangScopeComputation(services),
    },
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

  // initializeLangiumTypirServices(ELang, ELang.typir);

  return { shared, ELang };
}
