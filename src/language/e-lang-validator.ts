import {
  ValidationRegistry
} from "langium";
import { ELangServices } from "./e-lang-module.js";

export class ELangValidationRegistry extends ValidationRegistry {
  constructor(services: ELangServices) {
    super(services);
  }
}

/**
 * Implementation of custom validations.
 */
export class ELangValidator {

}
