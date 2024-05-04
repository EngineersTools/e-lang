import { AstNode, LangiumDocument, URI } from "langium";
import {
  Domain,
  Import,
  isDomain,
  isExportable,
  isModelDeclaration,
} from "../language/generated/ast.js";

export function getNodeDomain(node?: AstNode): AstNode | undefined {
  let container: AstNode | undefined = node?.$container;

  while (container && !isDomain(container)) {
    container = getNodeDomain(node?.$container);
  }

  return container;
}

export function getNodeChain(node: AstNode): AstNode[] {
  const set = new Set<AstNode>();

  set.add(node);

  let parent: AstNode | undefined = node.$container;

  while (parent !== undefined) {
    set.add(parent);
    parent = parent.$container;
  }

  return Array.from(set).reverse();
}

export function getQualifiedName(node: AstNode, name: string): string {
  let parent: AstNode | undefined = node.$container;
  while (isModelDeclaration(parent)) {
    name = `${parent.name}.${name}`;
    parent = parent.$container;
  }
  return name;
}

export function getDomainDocument(node: Domain): LangiumDocument | undefined {
  return node.$document;
}

export function isNodeExported(node: AstNode): boolean {
  return isExportable(node) && node.export === true;
}

export function isDocumentImported(
  resolvedImports: Import[],
  documentUri: URI
): boolean {
  return resolvedImports.map((i) => i.importSource).includes(documentUri.path);
}
