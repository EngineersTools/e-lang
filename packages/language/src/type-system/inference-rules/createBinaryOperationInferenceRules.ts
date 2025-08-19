import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createBinaryOperationInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  const typeAny = typir.factory.Top.create({}).finish();

  typir.factory.Operators.createBinary({
    name: "=",
    signature: {
      left: typeAny,
      right: typeAny,
      return: typeAny,
    },
  });
}
