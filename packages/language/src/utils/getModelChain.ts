import { ModelDeclaration } from "../generated/ast.js";

/**
 * Build a transitive declaration chain for a model, including the model itself
 * and all parent model declarations reachable via parentTypes references.
 *
 * The returned array preserves insertion order: the provided modelItem is the
 * first element, then each parent's chain is appended in the order parents are
 * iterated. Shared ancestors are included only once (when first encountered).
 *
 * Traversal details:
 * - For each entry in modelItem.parentTypes the function follows pt.ref.reference?.ref
 *   to obtain the parent ModelDeclaration (if present) and recursively collects its chain.
 * - A Set is used to deduplicate and to prevent infinite recursion on cyclic
 *   parent relationships (membership is determined by reference equality).
 *
 * @param modelItem - The ModelDeclaration to start from. Must have a parentTypes
 *   iterable where each parent type may contain a `ref` pointing to another model.
 * @returns An array of ModelDeclaration objects containing modelItem and its
 *   transitive parent declarations, in traversal/insertion order with duplicates removed.
 */
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

/**
 * Collects the chain of parent ModelDeclaration objects referenced by a given model item.
 *
 * Traverses the modelItem.parentTypes and, for each parent type that has a `ref`, uses
 * the referenced model's declaration chain to accumulate unique parent declarations.
 * The original `modelItem` is excluded from the returned array.
 *
 * @param modelItem - The model declaration whose parent chain should be collected.
 * @returns An array of unique `ModelDeclaration` instances representing parents of `modelItem`.
 *          The array preserves the order in which parent declarations were discovered during traversal.
 *          Returns an empty array if no parent declarations are found.
 *
 * @remarks
 * - Parent types without a `ref` are ignored.
 * - Deduplication is performed via a Set to ensure each returned `ModelDeclaration` appears only once.
 * - The result excludes the input `modelItem` itself even though it is used as the starting point for traversal.
 */
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
