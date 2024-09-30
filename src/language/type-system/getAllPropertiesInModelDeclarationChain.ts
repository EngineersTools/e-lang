import { ModelDeclaration, PropertyDeclaration } from "../generated/ast.js";
import { getModelDeclarationParentsChain } from "./getModelDeclarationChain.js";

export function getAllPropertiesInModelDeclarationChain(
  modelDeclaration: ModelDeclaration
): PropertyDeclaration[] {
  const parentProperties = getModelDeclarationParentsChain(
    modelDeclaration
  ).flatMap((m) => m.properties);

  return modelDeclaration.properties.concat(
    parentProperties.filter((p) => {
      const modelPropertyContainedInParentChain =
        modelDeclaration.properties.find((mp) => mp.name === p.name);

      return (
        modelPropertyContainedInParentChain === undefined ||
        modelPropertyContainedInParentChain.override === false
      );
    })
  );
}
