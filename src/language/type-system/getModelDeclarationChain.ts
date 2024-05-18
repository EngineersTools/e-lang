import { ModelDeclaration } from "../generated/ast.js";


export function getModelDeclarationChain(
  modelItem: ModelDeclaration
): ModelDeclaration[] {
  const set = new Set<ModelDeclaration>();

  let value: ModelDeclaration = modelItem;

  value.parentTypes.forEach((pt) => {
    while (pt.ref && value && !set.has(value)) {
      set.add(value);
      value = pt.ref;
    }
  });

  // Sets preserve insertion order
  return Array.from(set);
}
