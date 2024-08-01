import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import './assets/main.css';

console.log("App.jsx triggered")

function App() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [folderStructure, setFolderStructure] = useState(null);

  useEffect(() => {
    // Set up event listeners
    window.api.onFileOpened((filePath, content) => {
      const newFile = { path: filePath, content: content };
      setFiles(prevFiles => [...prevFiles, newFile]);
      setActiveFile(newFile);
    });

    window.api.onNewFile(() => {
      const newFile = { path: 'untitled', content: '' };
      setFiles(prevFiles => [...prevFiles, newFile]);
      setActiveFile(newFile);
    });

    window.api.onFileSaved((filePath) => {
      if (activeFile && activeFile.path === 'untitled') {
        setFiles(prevFiles => prevFiles.map(f => 
          f === activeFile ? { ...f, path: filePath } : f
        ));
        setActiveFile(prev => ({ ...prev, path: filePath }));
      }
    });

    window.api.onFolderOpened((structure) => {
      setFolderStructure(structure);
    });

    return () => {
      window.api.removeAllListeners('file:opened');
      window.api.removeAllListeners('file:new');
      window.api.removeAllListeners('file:saved');
      window.api.removeAllListeners('folder:opened');
    };
  }, []);


  const handleFileSelect = async (file) => {
    try {
      const content = await window.api.readFile(file.path);
      const newFile = { ...file, content };
      setFiles(prevFiles => {
        const fileExists = prevFiles.some(f => f.path === file.path);
        return fileExists ? prevFiles : [...prevFiles, newFile];
      });
      setActiveFile(newFile);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };
    

  const handleContentChange = (content) => {
    if (activeFile) {
      setFiles(prevFiles => prevFiles.map(f => 
        f === activeFile ? { ...f, content: content } : f
      ));
    }
  };

  const handleFileSave = () => {
    if (activeFile) {
      window.api.saveFile(activeFile.path, activeFile.content);
    }
  };

  const handleNewFile = () => {
    window.api.newFile();
  };

  const handleOpenFile = async () => {
    const result = await window.api.openFile();
    if (result) {
      const { filePath, content } = result;
      const newFile = { path: filePath, content: content };
      setFiles(prevFiles => [...prevFiles, newFile]);
      setActiveFile(newFile);
    }
  };

  const handleOpenFolder = async () => {
    const result = await window.api.openFolder();
    if (result) {
      setFolderStructure(result);
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="actions">
          <div className="action">
            <button onClick={handleNewFile}>New File</button>
          </div>
          <div className="action">
            <button onClick={handleOpenFile}>Open File</button>
          </div>
          <div className="action">
            <button onClick={handleOpenFolder}>Open Folder</button>
          </div>
        </div>
        <div className="folder-structure">
          <Sidebar 
            folderStructure={folderStructure} 
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>
      <div className="main-content">
        <TabBar 
          files={files} 
          activeFile={activeFile} 
          onTabChange={handleFileSelect} 
        />
        <div className="code-editor">
          {activeFile && (
            <CodeEditor 
              file={activeFile} 
              onContentChange={handleContentChange} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;