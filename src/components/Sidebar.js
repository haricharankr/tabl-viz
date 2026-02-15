import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const CHART_TYPES = [
  'Bar', 'Column', 'Line', 'Area', 'Scatter', 'Pie', 'Donut',
  'Heatmap', 'Histogram', 'Box', 'Treemap', 'Bubble', 'Radar',
  'Funnel', 'Waterfall', 'Table',
];

const PALETTES = [
  { id: 'default', label: 'Default' },
  { id: 'tableau10', label: 'Tableau 10' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
];

export default function Sidebar() {
  const {
    datasets,
    activeDatasetIndex,
    chartType,
    selectedPalette,
    showLegend,
    showGrid,
    dispatch,
    loadFile,
    loadFileFromDrop,
  } = useData();

  const [dragOver, setDragOver] = useState(false);

  const handleOpenFile = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        for (const path of result.filePaths) {
          await loadFile(path);
        }
      }
    }
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['csv', 'tsv', 'xlsx', 'xls', 'json'].includes(ext)) {
        await loadFileFromDrop(file);
      }
    }
  };

  return (
    <>
      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          user-select: none;
        }
        .sidebar-section {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color);
        }
        .sidebar-section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .open-btn {
          width: 100%;
          padding: 8px 12px;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--accent-blue);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .open-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--accent-blue);
        }
        .open-btn.drag-over {
          background: rgba(34, 211, 238, 0.1);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        .dataset-item {
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.12s;
          margin-bottom: 2px;
        }
        .dataset-item:hover {
          background: var(--bg-hover);
        }
        .dataset-item.active {
          background: rgba(59, 130, 246, 0.15);
        }
        .dataset-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dataset-meta {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .chart-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }
        .chart-type-btn {
          padding: 5px 4px;
          border: none;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          transition: all 0.12s;
          text-align: center;
        }
        .chart-type-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .chart-type-btn.active {
          background: var(--accent-blue);
          color: white;
        }
        .palette-select {
          width: 100%;
          padding: 5px 8px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
          cursor: pointer;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
        }
        .toggle-label {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .toggle-switch {
          width: 32px;
          height: 18px;
          border-radius: 9px;
          background: var(--bg-tertiary);
          cursor: pointer;
          position: relative;
          border: none;
          transition: background 0.15s;
        }
        .toggle-switch.on {
          background: var(--accent-blue);
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          transition: transform 0.15s;
        }
        .toggle-switch.on::after {
          transform: translateX(14px);
        }
        .action-btn {
          width: 100%;
          padding: 6px 10px;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.12s;
          margin-bottom: 4px;
          text-align: left;
        }
        .action-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
      `}</style>

      <div className="sidebar">
        {/* Data Sources */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Data Sources</div>
          {datasets.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              <button
                className={`open-btn ${dragOver ? 'drag-over' : ''}`}
                onClick={handleOpenFile}
              >
                + Open File or Drop Here
              </button>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>
                Supports CSV, Excel, JSON
              </p>
            </div>
          ) : (
            <>
              {datasets.map((ds, i) => (
                <div
                  key={i}
                  className={`dataset-item ${i === activeDatasetIndex ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_ACTIVE_DATASET', payload: i })}
                >
                  <div className="dataset-name">{ds.name}</div>
                  <div className="dataset-meta">
                    {ds.totalRows.toLocaleString()} rows · {ds.columns.length} cols
                  </div>
                </div>
              ))}
              <button className="open-btn" onClick={handleOpenFile} style={{ marginTop: 6 }}>
                + Add Dataset
              </button>
            </>
          )}
        </div>

        {/* Chart Type */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Chart Type</div>
          <div className="chart-type-grid">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct}
                className={`chart-type-btn ${chartType === ct.toLowerCase() ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_CHART_TYPE', payload: ct.toLowerCase() })}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Color Palette</div>
          <select
            className="palette-select"
            value={selectedPalette}
            onChange={(e) => dispatch({ type: 'SET_PALETTE', payload: e.target.value })}
          >
            {PALETTES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Chart Options */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Chart Options</div>
          <div className="toggle-row">
            <span className="toggle-label">Show Legend</span>
            <button
              className={`toggle-switch ${showLegend ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_LEGEND' })}
            />
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Show Grid</span>
            <button
              className={`toggle-switch ${showGrid ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Actions</div>
          <button className="action-btn" onClick={() => dispatch({ type: 'RESET_VIZ' })}>
            Reset Visualization
          </button>
          <button className="action-btn" onClick={() => dispatch({ type: 'TOGGLE_DATA_TABLE' })}>
            Toggle Data Table
          </button>
          <button className="action-btn" onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}>
            Toggle Filters
          </button>
        </div>
      </div>
    </>
  );
}
