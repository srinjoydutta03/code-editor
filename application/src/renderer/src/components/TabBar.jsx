import React from 'react';

function TabBar({ files, activeFile, onTabChange }) {
  return (
    <div className="tab-bar">
      {files.map((file, index) => (
        <div
          key={index}
          className={`tab ${file === activeFile ? 'active' : ''}`}
          onClick={() => onTabChange(file)}
        >
          {file.path.split('/').pop()}
        </div>
      ))}
    </div>
  );
}

export default TabBar;