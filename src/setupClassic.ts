import {
    MonacoEditorLanguageClientWrapper,
    WrapperConfig,
} from "monaco-editor-wrapper";

export const setupConfigClassic = (): WrapperConfig => {
  return {
    $type: "classic",
    // serviceConfig: defineUserServices(),
    editorAppConfig: {
      //   languageId: "e-lang",
      //   code: `// e-lang is running in the web!`,
      useDiffEditor: false,
      //   languageExtensionConfig: { id: "langium" },
      //   languageDef: monarchSyntax,
      editorOptions: {
        "semanticHighlighting.enabled": true,
        theme: "vs-dark",
      },
    },
    // languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (htmlElement: HTMLElement) => {
  const userConfig = setupConfigClassic();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig);
};
