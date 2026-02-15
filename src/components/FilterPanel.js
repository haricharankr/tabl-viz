import React from 'react';
import { useData } from '../context/DataContext';

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '!=' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_equal', label: '>=' },
  { value: 'less_equal', label: '<=' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Not Null' },
  { value: 'in', label: 'In List' },
];

export default function FilterPanel() {
  const { showFilters, filters, activeDataset, dispatch } = useData();

  if (!showFilters) return null;

  const columns = activeDataset ? activeDataset.columns.map((c) => c.name) : [];

  const addFilter = () => {
    dispatch({
      type: 'ADD_FILTER',
      payload: { field: columns[0] || '', operator: 'equals', value: '' },
    });
  };

  const updateFilter = (index, updates) => {
    dispatch({
      type: 'UPDATE_FILTER',
      payload: { index, filter: { ...filters[index], ...updates } },
    });
  };

  const removeFilter = (index) => {
    dispatch({ type: 'REMOVE_FILTER', payload: index });
  };

  const noValueOps = ['is_null', 'is_not_null'];

  return (
    <>
      <style>{`
        .filter-panel {
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-color);
          padding: 10px 16px;
          animation: fpSlide 0.2s ease;
        }
        @keyframes fpSlide {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 300px; }
        }
        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .filter-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }
        .filter-add-btn {
          padding: 3px 10px;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--accent-blue);
          color: white;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s;
        }
        .filter-add-btn:hover { background: var(--accent-blue-light); }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .filter-select, .filter-input {
          padding: 4px 6px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
        }
        .filter-select:focus, .filter-input:focus {
          border-color: var(--accent-blue);
        }
        .filter-select { min-width: 100px; }
        .filter-input { flex: 1; min-width: 80px; }
        .filter-remove {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          transition: color 0.12s;
        }
        .filter-remove:hover { color: var(--accent-red); }
        .filter-empty {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
          padding: 4px 0;
        }
      `}</style>

      <div className="filter-panel">
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          <button className="filter-add-btn" onClick={addFilter} disabled={columns.length === 0}>
            + Add Filter
          </button>
        </div>

        {filters.length === 0 && (
          <div className="filter-empty">No filters applied. Click "Add Filter" to start.</div>
        )}

        {filters.map((f, i) => (
          <div key={i} className="filter-row">
            <select
              className="filter-select"
              value={f.field}
              onChange={(e) => updateFilter(i, { field: e.target.value })}
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={f.operator}
              onChange={(e) => updateFilter(i, { operator: e.target.value })}
              style={{ minWidth: 80 }}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {noValueOps.includes(f.operator) ? (
              <span style={{ flex: 1, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(no value needed)</span>
            ) : (
              <input
                className="filter-input"
                type="text"
                value={f.value || ''}
                onChange={(e) => updateFilter(i, { value: e.target.value })}
                placeholder={f.operator === 'in' ? 'comma separated values' : 'value'}
              />
            )}

            <button className="filter-remove" onClick={() => removeFilter(i)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
