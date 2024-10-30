import { AstNode, DefaultAsyncParser, ParseResult } from "langium";
import {
    ELangProgram,
    ForStatement,
    isBinaryUnitFamilyExpression,
    isELangProgram,
    isUnitFamilyDeclaration,
    StatementBlock,
    UnitDeclaration,
    UnitFamilyDeclaration,
} from "./generated/ast.js";

export class ELangParser extends DefaultAsyncParser {
  override parse<T extends AstNode>(text: string): Promise<ParseResult<T>> {
    // Do not parse the text if it contains the word "cells"
    if (text.search("cells") !== -1) {
      return Promise.resolve({
        parserErrors: [],
        lexerErrors: [],
        value: {} as T,
      });
    }

    const result = this.syncParser.parse<T>(text);

    console.log(text.search("cells"));
    result.parserErrors.forEach((error) => {
      console.error(error.token.image, error.name, error.message);
    });

    if (isELangProgram(result.value)) {
      for (let i = 0; i < result.value.statements.length; i++) {
        const statement = result.value.statements[i];

        if (isUnitFamilyDeclaration(statement) && statement.complexDefinition) {
          if (isBinaryUnitFamilyExpression(statement.complexDefinition)) {
            switch (statement.complexDefinition.operator) {
              case "*":
                break;
              case "/":
                break;
              case "^":
                // statement.units.push({
                //   $container: statement,F
                //   $type: "UnitDeclaration",
                //   name: "squared",
                //   longName: "squared",
                //   description: "squared",
                // });
                break;
            }
          }
        }
      }
    }

    return Promise.resolve(result);
  }
}

export function createUnitDeclaration(
  $container:
    | ELangProgram
    | ForStatement
    | StatementBlock
    | UnitFamilyDeclaration,
  name: string,
  longName?: string,
  description?: string
): UnitDeclaration {
  return {
    $container,
    $type: "UnitDeclaration",
    name,
    longName,
    description,
  };
}
