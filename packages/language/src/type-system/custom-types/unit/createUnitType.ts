import { UnitDeclaration } from "../../../generated/ast.js";
import {
  ElangTypirServices
} from "../../ELangAdditionalTypirServices.type.js";

export function createUnitType(
  languageNode: UnitDeclaration,
  typir: ElangTypirServices
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
