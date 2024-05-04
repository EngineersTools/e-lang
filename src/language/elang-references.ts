import { DefaultReferences } from "langium";
import { LangiumServices } from "langium/lsp";

export class ElangReferences extends DefaultReferences {
  constructor(services: LangiumServices) {
    super(services);
  }

  //  override findDeclaration(sourceCstNode: CstNode): AstNode | undefined {
  //     const nodeElem = sourceCstNode.astNode;
  //     const assignment = findAssignment(sourceCstNode);
  //     if (assignment && assignment.feature === 'feature') {
  //         // Only search for a special declaration if the cst node is the feature property of the action/assignment
  //         if (isAssignment(nodeElem)) {
  //             return this.findAssignmentDeclaration(nodeElem);
  //         } else if (isAction(nodeElem)) {
  //             return this.findActionDeclaration(nodeElem);
  //         }
  //     }
  //     return super.findDeclaration(sourceCstNode);
  // }
}
