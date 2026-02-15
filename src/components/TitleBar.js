import React from 'react';
import { useData } from '../context/DataContext';

const TitleBar = () => {
  const { activeDataset } = useData();

  return (
    <div className="titlebar-drag titlebar-container">
      <style>{`
        .titlebar-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--titlebar-height, 38px);
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          user-select: none;
          -webkit-app-region: drag;
        }

        .titlebar-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .titlebar-app-name {
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .titlebar-dataset {
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 400;
          opacity: 0.85;
        }
      `}</style>

      <div className="titlebar-content">
        <div className="titlebar-app-name">Tabl Viz</div>
        {activeDataset && (
          <div className="titlebar-dataset">{activeDataset.name}</div>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
