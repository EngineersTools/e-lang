import {
  AstNode,
  AstNodeDescription,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  LangiumDocument,
  MultiMap,
  PrecomputedScopes,
  ReferenceInfo,
  Scope,
  ScopeOptions,
  StreamScope,
  interruptAndCheck,
  stream,
} from "langium";
import { LangiumServices } from "langium/lsp";
import { CancellationToken } from "vscode-jsonrpc";
import {
  ElangProgram,
  ModelDeclaration,
  ModelValue,
  isConstantDeclaration,
  isModelMemberAssignment,
  isModelMemberCall,
  isMutableDeclaration,
  isUnitDeclaration,
} from "./generated/ast.js";
import { Types } from "./type-system/Types.js";
import { isModelType } from "./type-system/descriptions.js";
import { getModelDeclarationChain, inferType } from "./type-system/infer.js";

export class ElangScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
    this.types = new Types();
  }

  private types: Types;

  override getScope(context: ReferenceInfo): Scope {
    if (
      context.property === "element" &&
      isModelMemberCall(context.container)
    ) {
      const memberCall = context.container;
      const previous = memberCall.previous;

      if (!previous) {
        return super.getScope(context);
      }

      const previousType = inferType(previous, this.types);

      if (
        isModelType(previousType) &&
        (previousType.declaration || previousType.value)
      ) {
        return previousType.declaration !== undefined
          ? this.scopeModelDeclarationMembers(previousType.declaration)
          : previousType.value !== undefined
          ? this.scopeModelValueMembers(previousType.value)
          : super.getScope(context);
      }
      return EMPTY_SCOPE;
    }

    return super.getScope(context);
  }

  private scopeModelDeclarationMembers(modelItem: ModelDeclaration): Scope {
    const allMembers = getModelDeclarationChain(modelItem).flatMap(
      (e) => e.properties
    );
    return this.createScopeForNodes(allMembers);
  }

  private scopeModelValueMembers(modelItem: ModelValue): Scope {
    return this.createScopeForNodes(modelItem.members);
  }

  override createScopeForNodes(
    elements: Iterable<AstNode>,
    outerScope?: Scope | undefined,
    options?: ScopeOptions | undefined
  ): Scope {
    const s = stream(elements)
      .map((e) => {
        const name = isModelMemberAssignment(e)
          ? e.property
          : this.nameProvider.getName(e);

        if (name) {
          return this.descriptions.createDescription(e, name);
        }

        return undefined;
      })
      .nonNullable();

    return new StreamScope(s, outerScope, options);
  }
}

export class ElangScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumServices) {
    super(services);
  }

  override async computeExports(
    document: LangiumDocument,
    cancelToken = CancellationToken.None
  ): Promise<AstNodeDescription[]> {
    const exportedDescriptions: AstNodeDescription[] = [];

    // for (const node of streamAllContents(document.parseResult.value)) {
    //   // if (isNodeExported(node)) {
    //   //   console.log(getNodeChain(node).map((n) => n.$type));
    //   //   if (isUnitFamilyDeclaration(node)) {
    //   //     node.units.forEach((u) => {
    //   //       console.log(getNodeChain(u).map((n) => n.$type));
    //   //     });
    //   //   }
    //   // }
    //   // exportedDescriptions.push(
    //   //   ...(await this.computeExportsForNode(
    //   //     node,
    //   //     document,
    //   //     undefined,
    //   //     cancelToken
    //   //   ))
    //   // );
    // }

    return exportedDescriptions;
  }

  override async computeLocalScopes(
    document: LangiumDocument,
    cancelToken = CancellationToken.None
  ): Promise<PrecomputedScopes> {
    const scopes = new MultiMap<AstNode, AstNodeDescription>();

    for (const node of AstUtils.streamAllContents(
      document.parseResult.value as ElangProgram
    )) {
      await interruptAndCheck(cancelToken);

      if (isConstantDeclaration(node) || isMutableDeclaration(node)) {
        // if (node.assignment && isModelValue(node.value)) {
        //   node.value.members.forEach((m) => {
        //     const fullyQualifiedName = getQualifiedName(node, m.property); // `${node.name}.${m.property}`;

        //     scopes.add(
        //       node.$container,
        //       this.descriptions.createDescription(
        //         node,
        //         fullyQualifiedName,
        //         document
        //       )
        //     );
        //   });
        // }
        this.processNode(node, document, scopes);
      } else if (isUnitDeclaration(node)) {
        scopes.add(
          document.parseResult.value,
          this.descriptions.createDescription(node, node.name, document)
        );
      } else {
        this.processNode(node, document, scopes);
      }
    }

    return scopes;
  }
}
