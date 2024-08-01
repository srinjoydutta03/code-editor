import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";

export function CodeEditor({ file, onContentChange }){
  const editorRef = useRef();
  const [language, setLanguage] = useState("plaintext");

  useEffect(() => {
    if (file) {
      const extension = file.path.split('.').pop().toLowerCase();
      const languageMap = {
        'js': 'javascript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'c' : 'c',
        'cpp': 'c++'
      };
      setLanguage(languageMap[extension] || 'plaintext');
    }
  }, [file]);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="code-editor">
      <Editor
        options={{
          minimap: { enabled: false },
        }}
        height="100%"
        theme="vs-dark"
        language={language}
        value={file ? file.content : ''}
        onMount={onMount}
        onChange={(value) => onContentChange(value)}
      />
    </div>
  );
};

export default CodeEditor;