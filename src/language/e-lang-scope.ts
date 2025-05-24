import {
  AstNode,
  AstNodeDescription,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  interruptAndCheck,
  LangiumDocument,
  LangiumDocuments,
  MultiMap,
  PrecomputedScopes,
} from "langium";
import { TypirLangiumServices } from "typir-langium";
import { CancellationToken } from "vscode-languageserver";
import { ELangServices } from "./e-lang-module.js";
import {
  ELangAstType,
  ELangProgram,
  isUnitDeclaration,
} from "./generated/ast.js";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly typir: TypirLangiumServices<ELangAstType>;

  constructor(services: ELangServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.typir = services.typir;
  }
}

export class ELangScopeComputation extends DefaultScopeComputation {
  constructor(services: ELangServices) {
    super(services);
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

  // protected override exportNode(
  //   node: AstNode,
  //   exports: AstNodeDescription[],
  //   document: LangiumDocument
  // ): void {
  //   // this function is called in order to export nodes to the GLOBAL scope
  //   if (isExportable(node) && node.export === true) {
  //     super.exportNode(node, exports, document);
  //     if (isDimensionDeclaration(node)) {
  //       node.units.forEach((unit) => {
  //         super.exportNode(unit, exports, document);
  //       });
  //       node.conversions.forEach((conversion) => {
  //         super.exportNode(conversion, exports, document);
  //       });
  //     }
  //   }
  // }
}
