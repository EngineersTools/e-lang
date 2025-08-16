import {
  ClassType,
  FunctionType,
  Kind,
  TypeDetails,
  TypeInitializer,
  TypeSelector,
  TypirServices,
} from "typir";
import { UnitType } from "./unit-type.js";
import { DimensionType } from "./dimension-type.js";

export const DimensionKindName = "DimensionKind";

export interface DimensionKindOptions {
  typing: "Structural" | "Nominal"; // JS classes are nominal, TS structures are structural
  /** Will be used only internally as prefix for the unique identifiers for dimension type names. */
  identifierPrefix: string;
}

export interface CreateUnitDetails<LanguageType> {
  name: string;
  type: TypeSelector<UnitType, LanguageType>;
}

export interface CreateConversionDetails<LanguageType> {
  type: TypeSelector<FunctionType, LanguageType>;
}

export interface DimensionTypeDetails<LanguageType>
  extends TypeDetails<LanguageType> {
  dimensionName: string;
  units: Array<CreateUnitDetails<LanguageType>>;
  conversions: Array<CreateConversionDetails<LanguageType>>;
}

export interface CreateDimensionTypeDetails<LanguageType>
  extends DimensionTypeDetails<LanguageType> {
  // inference rules for the Dimension
  // inferenceRulesForDimensionDeclaration: Array<InferCurrentTypeRule<DimensionType, LanguageType>>;
  // inferenceRulesForDimensionLiterals: Array<InferDimensionLiteral<LanguageType>>; // e.g. Constructor calls, References
  // inference rules for its Fields
  // inferenceRulesForFieldAccess: Array<InferDimensionFieldAccess<LanguageType>>;
}

export interface DimensionConfigurationChain<LanguageType> {
  // inferenceRuleForClassDeclaration<T extends LanguageType>(rule: InferCurrentTypeRule<DimensionType, LanguageType, T>): DimensionConfigurationChain<LanguageType>;
  // inferenceRuleForClassLiterals<T extends LanguageType>(rule: InferClassLiteral<LanguageType, T>): DimensionConfigurationChain<LanguageType>;

  // inferenceRuleForFieldAccess<T extends LanguageType>(rule: InferClassFieldAccess<LanguageType, T>): DimensionConfigurationChain<LanguageType>;

  finish(): TypeInitializer<ClassType, LanguageType>;
}

export interface DimensionFactoryService<LanguageType> {
  create(
    typeDetails: DimensionTypeDetails<LanguageType>
  ): DimensionConfigurationChain<LanguageType>;
  // get(typeDetails: ClassTypeDetails<LanguageType> | string): TypeReference<ClassType, LanguageType>;
  // some predefined validations:
  // createUniqueClassValidation(options: RegistrationOptions): UniqueClassValidation<LanguageType>;
  // createUniqueMethodValidation<T extends LanguageType>(options: UniqueMethodValidationOptions<LanguageType, T> & RegistrationOptions): ValidationRule<LanguageType>;
  // createNoSuperClassCyclesValidation(options: NoSuperClassCyclesValidationOptions<LanguageType> & RegistrationOptions): ValidationRule<LanguageType>;
  // benefits of this design decision: the returned rule is easier to exchange, users can use the known factory API with auto-completion (no need to remember the names of the validations)
}

export class DimensionKind<LanguageType>
  implements Kind, DimensionFactoryService<LanguageType>
{
  readonly $name: "DimensionKind";
  readonly services: TypirServices<LanguageType>;
  readonly options: Readonly<DimensionKindOptions>;

  constructor(
    services: TypirServices<LanguageType>,
    options?: Partial<DimensionKindOptions>
  ) {
    this.$name = DimensionKindName;
    this.services = services;
    this.services.infrastructure.Kinds.register(this);
    this.options = this.collectOptions(options);
  }
  create(
    typeDetails: DimensionTypeDetails<LanguageType>
  ): DimensionConfigurationChain<LanguageType> {
    return new DimensionConfigurationChainImpl<LanguageType>(
      this.services,
      this,
      typeDetails
    );
  }

  protected collectOptions(
    options?: Partial<DimensionKindOptions>
  ): DimensionKindOptions {
    return {
      // the default values:
      typing: "Nominal",
      identifierPrefix: "dimension",
      // the actually overriden values:
      ...options,
    };
  }
}

class DimensionConfigurationChainImpl<LanguageType>
  implements DimensionConfigurationChain<LanguageType>
{
  protected readonly services: TypirServices<LanguageType>;
  protected readonly kind: DimensionKind<LanguageType>;
  protected readonly typeDetails: CreateDimensionTypeDetails<LanguageType>;

  constructor(
    services: TypirServices<LanguageType>,
    kind: DimensionKind<LanguageType>,
    typeDetails: DimensionTypeDetails<LanguageType>
  ) {
    this.services = services;
    this.kind = kind;
    this.typeDetails = {
      ...typeDetails,
    //   inferenceRulesForDimensionDeclaration: [],
    //   inferenceRulesForDimensionLiterals: [],
    //   inferenceRulesForFieldAccess: [],
    };
  }

  //   inferenceRuleForDimensionDeclaration<T extends LanguageType>(
  //     rule: InferCurrentTypeRule<DimensionType, LanguageType, T>
  //   ): DimensionConfigurationChain<LanguageType> {
  //     this.typeDetails.inferenceRulesForDimensionDeclaration.push(
  //       rule as unknown as InferCurrentTypeRule<DimensionType, LanguageType>
  //     );
  //     return this;
  //   }

  //   inferenceRuleForDimensionLiterals<T extends LanguageType>(
  //     rule: InferDimensionLiteral<LanguageType, T>
  //   ): DimensionConfigurationChain<LanguageType> {
  //     this.typeDetails.inferenceRulesForDimensionLiterals.push(
  //       rule as unknown as InferDimensionLiteral<LanguageType>
  //     );
  //     return this;
  //   }

  //   inferenceRuleForFieldAccess<T extends LanguageType>(
  //     rule: InferDimensionFieldAccess<LanguageType, T>
  //   ): DimensionConfigurationChain<LanguageType> {
  //     this.typeDetails.inferenceRulesForFieldAccess.push(
  //       rule as unknown as InferDimensionFieldAccess<LanguageType>
  //     );
  //     return this;
  //   }

  finish(): TypeInitializer<DimensionType, LanguageType> {
    return new DimensionTypeInitializer<LanguageType>(
      this.services,
      this.kind,
      this.typeDetails
    );
  }
}
