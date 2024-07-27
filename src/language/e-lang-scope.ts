import {
  AstNode,
  AstNodeDescription,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  interruptAndCheck,
  LangiumDocument,
  LangiumDocuments,
  MultiMap,
  PrecomputedScopes,
  ReferenceInfo,
  Scope,
  stream,
  StreamScope,
  URI,
  UriUtils,
} from "langium";
import { LangiumServices } from "langium/lsp";
import { CancellationToken } from "vscode-languageserver";
import {
  ELangProgram,
  Import,
  isELangProgram,
  isExportable,
  isModelMemberCall,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
  ModelDeclaration,
  ModelValue,
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import {
  isListType,
  isModelMemberType,
  isModelType,
} from "./type-system/descriptions.js";
import { getModelDeclarationChain } from "./type-system/getModelDeclarationChain.js";
import { inferType } from "./type-system/infer.js";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly types: TypeEnvironment;
  protected readonly langiumDocuments: LangiumDocuments;

  constructor(services: LangiumServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.types = new TypeEnvironment();
  }

  override getScope(context: ReferenceInfo): Scope {
    if (
      context.property === "element" &&
      isModelMemberCall(context.container)
    ) {
      if (!context.container.previous) {
        return super.getScope(context);
      }

      const previousType = inferType(context.container.previous, this.types);

      if (isModelType(previousType) && previousType.modelDeclaration) {
        return this.scopeModelProperties(previousType.modelDeclaration);
      } else if (isModelMemberType(previousType)) {
        if (
          isModelType(previousType.typeDesc) &&
          previousType.typeDesc.modelDeclaration
        ) {
          return this.scopeModelProperties(
            previousType.typeDesc.modelDeclaration
          );
        } else if (
          isListType(previousType.typeDesc) &&
          context.container.previous.accessElement
        ) {
          if (
            isModelType(previousType.typeDesc.itemType) &&
            previousType.typeDesc.itemType.modelDeclaration
          ) {
            return this.scopeModelProperties(
              previousType.typeDesc.itemType.modelDeclaration
            );
          }
        }
      } else if (
        isModelType(previousType) &&
        previousType.$source === "value" &&
        isModelMemberCall(context.container.previous)
      ) {
        // @ts-expect-error
        const modelValue = context.container.previous.element.ref.value;
        return this.scopeModelValueMembers(modelValue);
      }

      return EMPTY_SCOPE;
    }

    return super.getScope(context);
  }

  protected override getGlobalScope(
    referenceType: string,
    context: ReferenceInfo
  ): Scope {
    const elangProgram = getContainerOfType(context.container, isELangProgram);

    if (!elangProgram) {
      return EMPTY_SCOPE;
    }

    const importedUris = new Set<string>();

    this.gatherImports(elangProgram, importedUris);

    let importedElements = this.indexManager.allElements(
      referenceType,
      importedUris
    );

    return new StreamScope(importedElements);
  }

  private scopeModelProperties(model: ModelDeclaration): Scope {
    const allMembers = getModelDeclarationChain(model).flatMap(
      (e) => e.properties
    );
    return this.createScopeForNodes(allMembers);
  }

  private scopeModelValueMembers(modelValue: ModelValue): Scope {
    const s = stream(modelValue.members)
      .map((e) => {
        if (e.property) {
          return this.descriptions.createDescription(e, e.property);
        }
        return undefined;
      })
      .nonNullable();
    return new StreamScope(s);
  }

  private gatherImports(
    elangProgram: ELangProgram,
    importedUris: Set<string>
  ): void {
    for (const imp0rt of elangProgram.imports) {
      const uri = resolveImportUri(imp0rt);
      if (uri && !importedUris.has(uri.toString())) {
        importedUris.add(uri.toString());

        const importedDocument = this.langiumDocuments.getDocument(uri);

        if (importedDocument) {
          const rootNode = importedDocument.parseResult.value;
          if (isELangProgram(rootNode)) {
            this.gatherImports(rootNode, importedUris);
          }
        }
      }
    }
  }
}

export class ELangScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumServices) {
    super(services);
  }

  protected override exportNode(
    node: AstNode,
    exports: AstNodeDescription[],
    document: LangiumDocument
  ): void {
    // this function is called in order to export nodes to the GLOBAL scope
    if (isExportable(node) && node.export === true) {
      super.exportNode(node, exports, document);

      if (isUnitFamilyDeclaration(node)) {
        node.units.forEach((unit) => {
          super.exportNode(unit, exports, document);
        });
        node.conversions.forEach((conversion) => {
          super.exportNode(conversion, exports, document);
        });
      }
    }
  }

  override async computeLocalScopes(
    document: LangiumDocument,
    cancelToken = CancellationToken.None
  ): Promise<PrecomputedScopes> {
    const scopes = new MultiMap<AstNode, AstNodeDescription>();

    for (const node of AstUtils.streamAllContents(
      document.parseResult.value as ELangProgram
    )) {
      await interruptAndCheck(cancelToken);

      if (isUnitDeclaration(node)) {
        scopes.add(
          document.parseResult.value,
          this.descriptions.createDescription(node, node.name, document)
        );
      } else {
        super.processNode(node, document, scopes);
      }
    }

    return scopes;
  }
}

/**
 * Walk along the hierarchy of containers from the given AST node to the root and return the first
 * node that matches the type predicate. If the start node itself matches, it is returned.
 * If no container matches, `undefined` is returned.
 */
export function getContainerOfType<T extends AstNode>(
  node: AstNode | undefined,
  typePredicate: (n: AstNode) => n is T
): T | undefined {
  let item = node;
  while (item) {
    if (typePredicate(item)) {
      return item;
    }
    item = item.$container;
  }
  return undefined;
}

export function resolveImportUri(imp: Import): URI | undefined {
  if (imp.importSource === undefined || imp.importSource.length === 0) {
    return undefined;
  }

  const dirUri = UriUtils.dirname(getDocument(imp).uri);
  let importPath = imp.importSource;

  if (!importPath.endsWith(".el")) {
    importPath += ".el";
  }

  return URI.file(UriUtils.resolvePath(dirUri, importPath).path);
}

/**
 * Retrieve the document in which the given AST node is contained. A reference to the document is
 * usually held by the root node of the AST.
 *
 * @throws an error if the node is not contained in a document.
 */
export function getDocument<T extends AstNode = AstNode>(
  node: AstNode
): LangiumDocument<T> {
  const rootNode = findRootNode(node);
  const result = rootNode.$document;
  if (!result) {
    throw new Error("AST node has no document.");
  }
  return result as LangiumDocument<T>;
}

/**
 * Returns the root node of the given AST node by following the `$container` references.
 */
export function findRootNode(node: AstNode): AstNode {
  while (node.$container) {
    node = node.$container;
  }
  return node;
}
