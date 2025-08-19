import { TypirLangiumServices } from "typir-langium";
import { UnitDeclaration } from "../../../generated/ast.js";
import { ELangAdditionalTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";

export function createUnitType(
  languageNode: UnitDeclaration,
  typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
) {
  return typir.factory.Unit.create({
    properties: {
      name: languageNode.name,
      longName: languageNode.longName ?? "",
      description: languageNode.description ?? "",
    },
  })
    .inferenceRule({
      languageKey: UnitDeclaration.$type,
      matching: (node: UnitDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
