import { AstNode } from "langium";
import {
  isModelDeclaration,
  isModelMemberAssignment
} from "../language/generated/ast.js";

/**
 * Calculates the full path of a nested model property
 * @param node The node that contains the property to be named
 * @param name The name of the property
 * @returns The qualified name (full path) of the property using
 *          a dot notation to separate each element.
 */

export function getQualifiedName(node: AstNode, name: string): string {
  let parent: AstNode | undefined = node.$container;
  while (isModelDeclaration(parent) || isModelMemberAssignment(node)) {
    name = isModelDeclaration(parent)
      ? `${parent.name}.${name}`
      : isModelMemberAssignment(node)
      ? `${node.property}.${name}`
      : `${name}`;

    parent = parent?.$container;
  }
  return name;
}
