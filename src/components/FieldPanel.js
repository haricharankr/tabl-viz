import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatColumnName } from '../utils/formatters';

const AGG_OPTIONS = ['sum', 'avg', 'min', 'max', 'count', 'countd', 'median', 'stddev'];

export default function FieldPanel() {
  const {
    activeDataset,
    xAxis,
    yAxis,
    colorBy,
    sizeBy,
    labelBy,
    dispatch,
  } = useData();

  const [dragOverShelf, setDragOverShelf] = useState(null);

  const columns = activeDataset ? activeDataset.columns : [];
  const dimensions = columns.filter((c) => c.role === 'dimension');
  const measures = columns.filter((c) => c.role === 'measure');

  const handleDragStart = (e, col) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      field: col.name,
      type: col.type,
      role: col.role,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e, shelf) => {
    e.preventDefault();
    setDragOverShelf(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      switch (shelf) {
        case 'x':
          dispatch({ type: 'SET_X_AXIS', payload: data.field });
          break;
        case 'y':
          dispatch({ type: 'ADD_Y_AXIS', payload: { field: data.field, aggregation: 'sum' } });
          break;
        case 'color':
          dispatch({ type: 'SET_COLOR_BY', payload: data.field });
          break;
        case 'size':
          dispatch({ type: 'SET_SIZE_BY', payload: data.field });
          break;
        case 'label':
          dispatch({ type: 'SET_LABEL_BY', payload: data.field });
          break;
        default:
          break;
      }
    } catch (err) { /* ignore */ }
  };

  const handleFieldClick = (col) => {
    if (col.role === 'measure') {
      dispatch({ type: 'ADD_Y_AXIS', payload: { field: col.name, aggregation: 'sum' } });
    } else if (!xAxis) {
      dispatch({ type: 'SET_X_AXIS', payload: col.name });
    } else if (!colorBy) {
      dispatch({ type: 'SET_COLOR_BY', payload: col.name });
    }
  };

  const typeBadge = (col) => {
    if (col.role === 'measure') return <span className="fp-badge fp-badge-num">#</span>;
    if (col.type === 'date') return <span className="fp-badge fp-badge-date">D</span>;
    return <span className="fp-badge fp-badge-str">Abc</span>;
  };

  const shelfDropProps = (name) => ({
    onDragOver: (e) => { e.preventDefault(); setDragOverShelf(name); },
    onDragLeave: () => setDragOverShelf(null),
    onDrop: (e) => handleDrop(e, name),
  });

  if (!activeDataset) {
    return (
      <>
        <style>{fieldPanelCSS}</style>
        <div className="fp">
          <div className="fp-empty">
            <p>Load a dataset to see available fields</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{fieldPanelCSS}</style>
      <div className="fp">
        {/* Available Fields */}
        <div className="fp-section fp-fields-section">
          <div className="fp-section-title">Fields</div>

          {dimensions.length > 0 && (
            <>
              <div className="fp-group-label">Dimensions</div>
              {dimensions.map((col) => (
                <div
                  key={col.name}
                  className="fp-field"
                  draggable
                  onDragStart={(e) => handleDragStart(e, col)}
                  onClick={() => handleFieldClick(col)}
                  title={`${col.name} (${col.type}) - ${col.uniqueCount} unique values`}
                >
                  {typeBadge(col)}
                  <span className="fp-field-name">{formatColumnName(col.name)}</span>
                </div>
              ))}
            </>
          )}

          {measures.length > 0 && (
            <>
              <div className="fp-group-label">Measures</div>
              {measures.map((col) => (
                <div
                  key={col.name}
                  className="fp-field fp-field-measure"
                  draggable
                  onDragStart={(e) => handleDragStart(e, col)}
                  onClick={() => handleFieldClick(col)}
                  title={`${col.name} - min: ${col.min}, max: ${col.max}, avg: ${col.mean?.toFixed(2)}`}
                >
                  {typeBadge(col)}
                  <span className="fp-field-name">{formatColumnName(col.name)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Encoding Shelves */}
        <div className="fp-section fp-shelves-section">
          <div className="fp-section-title">Encoding</div>

          {/* X Axis */}
          <div className="fp-shelf-label">X Axis (Columns)</div>
          <div
            className={`fp-shelf ${dragOverShelf === 'x' ? 'fp-shelf-over' : ''}`}
            {...shelfDropProps('x')}
          >
            {xAxis ? (
              <div className="fp-shelf-item">
                <span>{formatColumnName(xAxis)}</span>
                <button className="fp-remove" onClick={() => dispatch({ type: 'SET_X_AXIS', payload: null })}>×</button>
              </div>
            ) : (
              <span className="fp-shelf-hint">Drop dimension here</span>
            )}
          </div>

          {/* Y Axis */}
          <div className="fp-shelf-label">Y Axis (Rows)</div>
          <div
            className={`fp-shelf ${dragOverShelf === 'y' ? 'fp-shelf-over' : ''}`}
            {...shelfDropProps('y')}
          >
            {yAxis.length > 0 ? (
              yAxis.map((y, i) => (
                <div key={y.field + i} className="fp-shelf-item">
                  <select
                    className="fp-agg-select"
                    value={y.aggregation}
                    onChange={(e) => dispatch({ type: 'UPDATE_Y_AXIS_AGG', payload: { index: i, aggregation: e.target.value } })}
                  >
                    {AGG_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a.toUpperCase()}</option>
                    ))}
                  </select>
                  <span className="fp-shelf-item-name">{formatColumnName(y.field)}</span>
                  <button className="fp-remove" onClick={() => dispatch({ type: 'REMOVE_Y_AXIS', payload: i })}>×</button>
                </div>
              ))
            ) : (
              <span className="fp-shelf-hint">Drop measure here</span>
            )}
          </div>

          {/* Color */}
          <div className="fp-shelf-label">Color</div>
          <div
            className={`fp-shelf fp-shelf-sm ${dragOverShelf === 'color' ? 'fp-shelf-over' : ''}`}
            {...shelfDropProps('color')}
          >
            {colorBy ? (
              <div className="fp-shelf-item">
                <span>{formatColumnName(colorBy)}</span>
                <button className="fp-remove" onClick={() => dispatch({ type: 'SET_COLOR_BY', payload: null })}>×</button>
              </div>
            ) : (
              <span className="fp-shelf-hint">Drop field here</span>
            )}
          </div>

          {/* Size */}
          <div className="fp-shelf-label">Size</div>
          <div
            className={`fp-shelf fp-shelf-sm ${dragOverShelf === 'size' ? 'fp-shelf-over' : ''}`}
            {...shelfDropProps('size')}
          >
            {sizeBy ? (
              <div className="fp-shelf-item">
                <span>{formatColumnName(sizeBy)}</span>
                <button className="fp-remove" onClick={() => dispatch({ type: 'SET_SIZE_BY', payload: null })}>×</button>
              </div>
            ) : (
              <span className="fp-shelf-hint">Drop field here</span>
            )}
          </div>

          {/* Label */}
          <div className="fp-shelf-label">Label</div>
          <div
            className={`fp-shelf fp-shelf-sm ${dragOverShelf === 'label' ? 'fp-shelf-over' : ''}`}
            {...shelfDropProps('label')}
          >
            {labelBy ? (
              <div className="fp-shelf-item">
                <span>{formatColumnName(labelBy)}</span>
                <button className="fp-remove" onClick={() => dispatch({ type: 'SET_LABEL_BY', payload: null })}>×</button>
              </div>
            ) : (
              <span className="fp-shelf-hint">Drop field here</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const fieldPanelCSS = `
  .fp {
    width: var(--field-panel-width);
    min-width: var(--field-panel-width);
    background: var(--bg-elevated);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    user-select: none;
  }
  .fp-empty {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
  }
  .fp-section {
    border-bottom: 1px solid var(--border-color);
    padding: 10px 12px;
  }
  .fp-fields-section {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
  .fp-shelves-section {
    max-height: 45%;
    overflow-y: auto;
  }
  .fp-section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .fp-group-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin: 8px 0 4px;
    padding-left: 2px;
  }
  .fp-field {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    cursor: grab;
    transition: background 0.12s;
    margin-bottom: 1px;
    font-size: 12px;
    color: var(--text-primary);
  }
  .fp-field:hover {
    background: var(--bg-hover);
  }
  .fp-field:active {
    cursor: grabbing;
    opacity: 0.7;
  }
  .fp-field-measure {
    color: var(--accent-blue-light);
  }
  .fp-field-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .fp-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 16px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .fp-badge-num {
    background: rgba(59, 130, 246, 0.2);
    color: var(--accent-blue-light);
  }
  .fp-badge-str {
    background: rgba(52, 211, 153, 0.2);
    color: var(--accent-green);
  }
  .fp-badge-date {
    background: rgba(251, 146, 60, 0.2);
    color: var(--accent-orange);
  }
  .fp-shelf-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    margin: 6px 0 3px;
  }
  .fp-shelf {
    min-height: 32px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-sm);
    padding: 4px 6px;
    transition: all 0.15s;
    margin-bottom: 4px;
  }
  .fp-shelf-sm {
    min-height: 28px;
  }
  .fp-shelf-over {
    border-color: var(--accent-cyan);
    background: rgba(34, 211, 238, 0.06);
    box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.1);
  }
  .fp-shelf-hint {
    font-size: 10px;
    color: var(--text-muted);
    font-style: italic;
    line-height: 24px;
    padding-left: 4px;
  }
  .fp-shelf-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-primary);
    margin-bottom: 2px;
  }
  .fp-shelf-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fp-agg-select {
    padding: 1px 2px;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    background: var(--bg-primary);
    color: var(--accent-blue-light);
    font-size: 9px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
    min-width: 44px;
  }
  .fp-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.12s;
  }
  .fp-remove:hover {
    color: var(--accent-red);
  }
`;
