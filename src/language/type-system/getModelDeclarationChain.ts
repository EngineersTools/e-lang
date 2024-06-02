import { ModelDeclaration } from "../generated/ast.js";

export function getModelDeclarationChain(
  modelItem: ModelDeclaration
): ModelDeclaration[] {
  const set = new Set<ModelDeclaration>();

  set.add(modelItem);

  modelItem.parentTypes.forEach((pt) => {
    if (pt.ref && !set.has(pt.ref)) {
      getModelDeclarationChain(pt.ref).forEach((m) => set.add(m));
    }
  });

  // Sets preserve insertion order
  return Array.from(set);
}

export function getModelDeclarationParentsChain(
  modelItem: ModelDeclaration
): ModelDeclaration[] {
  const set = new Set<ModelDeclaration>();

  set.add(modelItem);

  modelItem.parentTypes.forEach((pt) => {
    if (pt.ref && !set.has(pt.ref)) {
      getModelDeclarationChain(pt.ref).forEach((m) => set.add(m));
    }
  });

  // Sets preserve insertion order
  return set.size > 1 ? Array.from(set).slice(1, set.size) : [];
}
