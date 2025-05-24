import { Kind, TypirServices } from "typir";

export const DimensionKindName = "DimensionKind";

export interface ClassKindOptions {
    typing: 'Structural' | 'Nominal', // JS classes are nominal, TS structures are structural
    /** Will be used only internally as prefix for the unique identifiers for dimension type names. */
    identifierPrefix: string,
}

export interface DimensionFactoryService<LanguageType> {
  // create(typeDetails: ClassTypeDetails<LanguageType>): ClassConfigurationChain<LanguageType>;
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
  $name = DimensionKindName;

  constructor(services: TypirServices<LanguageType>, options?: Partial<ClassKindOptions>) {
        this.$name = DimensionKindName;
        // this.services = services;
        // this.services.infrastructure.Kinds.register(this);
        // this.options = this.collectOptions(options);
        // assertTrue(this.options.maximumNumberOfSuperClasses >= 0); // no negative values
    }
}
