import React from 'react';
import Editor from '@monaco-editor/react';
import githubDark from 'monaco-themes/themes/GitHub Dark.json';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
}

export default function CodeEditor({
  code,
  onCodeChange,
  language
}: CodeEditorProps) {
  const options = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    wordWrap: 'on' as const,
    fontSize: 14,
    minimap: { enabled: false },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8
    },
    fontFamily:
      '"Fira Code", "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace',
    fontLigatures: true,
    formatOnPaste: false,
    formatOnType: false,
    quickSuggestions: false,
    contextmenu: false,
    links: false,
    folding: false,
    // Add the padding option here
    padding: { top: 5, bottom: 0 }
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      options={options}
      onChange={(value?: string) => {
        if (value !== undefined) {
          onCodeChange(value);
        }
      }}
      theme="github-dark"
      loading={<div>Loading editor...</div>}
      beforeMount={handleEditorWillMount}
    />
  );

  function handleEditorWillMount(monacoInstance: any) {
    monacoInstance.editor.defineTheme('github-dark', githubDark);

    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
      {
        noSemanticValidation: true,
        noSyntaxValidation: true
      }
    );

    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
      {
        noSemanticValidation: true,
        noSyntaxValidation: true
      }
    );

    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      noLib: true,
      allowNonTsExtensions: true,
      allowUnreachableCode: true
    });

    monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
      noLib: true,
      allowNonTsExtensions: true,
      allowUnreachableCode: true
    });

    monacoInstance.languages.registerHoverProvider(language, {
      provideHover: () => null
    });
  }
}
