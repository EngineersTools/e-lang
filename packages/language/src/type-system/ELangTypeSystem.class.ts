import { AstNode } from "langium";
import {
  LangiumTypeSystemDefinition,
  TypirLangiumServices,
} from "typir-langium";
import { isDimensionDeclaration } from "../generated/ast.js";
import { ELangAdditionalTypirServices } from "./ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "./ELangSpecifics.interface.js";

export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangSpecifics>
{
  onInitialize(typir: TypirLangiumServices<ELangSpecifics>): void {
    // define constant types and rules for conversion, inference and validation here
  }

  onNewAstNode(
    languageNode: AstNode,
    typir: TypirLangiumServices<ELangSpecifics> & ELangAdditionalTypirServices
  ): void {
    // define types and their rules which depend on the current AST respectively the given AstNode (as parsed by Langium from programs written by users of your language) here
    if (isDimensionDeclaration(languageNode)) {
      typir.factory.Dimension.create({
        properties: {
          name: languageNode.name,
          description: languageNode.description,
          units: [],
        },
      }).finish();
    }
  }
}
