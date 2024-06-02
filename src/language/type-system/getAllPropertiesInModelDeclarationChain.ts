import { ModelDeclaration, PropertyDeclaration } from "../generated/ast.js";
import { getModelDeclarationChain } from "./getModelDeclarationChain.js";

export function getAllPropertiesInModelDeclarationChain(
  modelDeclaration: ModelDeclaration
): PropertyDeclaration[] {
  return getModelDeclarationChain(modelDeclaration).flatMap(
    (m) => m.properties
  );
}

export function getParentPropertiesInModelDeclarationChain(
  modelDeclaration: ModelDeclaration
): PropertyDeclaration[] {
  const chain = getModelDeclarationChain(modelDeclaration);

  return chain.length > 1
    ? chain.slice(1, chain.length).flatMap((m) => m.properties)
    : [];
}
