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
import { TypirServices } from "typir";
import {
  createTypirLangiumServices,
  initializeLangiumTypirServices,
  PartialTypirLangiumServices,
  TypirLangiumServices,
} from "typir-langium";
import { ELangHoverProvider } from "./e-lang-hover-provider.js";
import { ELangTypeSystem } from "./e-lang-type-checking.js";
import { ELangValidationRegistry, ELangValidator } from "./e-lang-validator.js";
import { ELangAstType, reflection } from "./generated/ast.js";
import {
  ELangGeneratedModule,
  ELangGeneratedSharedModule,
} from "./generated/module.js";
import {
  DimensionKind,
  DimensionKindName,
} from "./type-system/kinds/dimension-kind.js";

export type ELangAddedServices = {
  validation: {
    ELangValidator: ELangValidator;
  };
  typir: TypirLangiumServices<ELangAstType>;
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
    typir: () =>
      createTypirLangiumServices(shared, reflection, new ELangTypeSystem(), {
        factory: {
          Dimensions: (services: TypirServices<ELangAstType>) =>
            services.infrastructure.Kinds.getOrCreateKind(
              DimensionKindName,
              (services) => new DimensionKind(services)
            ),
        },
      } as Module<PartialTypirLangiumServices<ELangAstType>>),
    lsp: {
      HoverProvider: (services) => new ELangHoverProvider(services),
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

  initializeLangiumTypirServices(ELang, ELang.typir);

  return { shared, ELang };
}
