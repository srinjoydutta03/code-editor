import React from 'react';

const Sidebar = ({ folderStructure, onFileSelect }) => {
  const renderFolder = (folder) => {
    return (
      <div key={folder.name} className="folder-item">
        <span>{folder.name}</span>
        <div style={{ marginLeft: '10px' }}>
          {folder.children && folder.children.map(item => 
            item.children ? renderFolder(item) : renderFile(item)
          )}
        </div>
      </div>
    );
  };

  const renderFile = (file) => {
    return (
      <div key={file.path} className="file-item" onClick={() => onFileSelect(file)}>
        {file.name}
      </div>
    );
  };

  if (!folderStructure) {
    return <div className="sidebar-item">No folder opened</div>;
  }

  return (
    <div className="folder-structure">
      {renderFolder(folderStructure)}
    </div>
  );
};

export default Sidebar;