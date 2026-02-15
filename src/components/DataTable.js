import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatNumber, formatColumnName } from '../utils/formatters';

export default function DataTable() {
  const { showDataTable, activeDataset, dispatch } = useData();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [height, setHeight] = useState(280);

  if (!showDataTable || !activeDataset) return null;

  const columns = activeDataset.columns.map((c) => c.name);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  let rows = activeDataset.rows;

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((row) =>
      columns.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }

  if (sortCol) {
    rows = [...rows].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const displayRows = rows.slice(0, 200);

  const handleResizeStart = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev) => {
      const diff = startY - ev.clientY;
      setHeight(Math.max(100, Math.min(600, startH + diff)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <>
      <style>{`
        .dt-container { background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; }
        .dt-resize-handle { height: 4px; cursor: ns-resize; background: var(--border-color); transition: background 0.12s; }
        .dt-resize-handle:hover { background: var(--accent-blue); }
        .dt-header { display: flex; align-items: center; gap: 10px; padding: 6px 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
        .dt-title { font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
        .dt-search { padding: 3px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 11px; outline: none; width: 180px; }
        .dt-search:focus { border-color: var(--accent-blue); }
        .dt-meta { font-size: 10px; color: var(--text-muted); margin-left: auto; }
        .dt-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; padding: 0 4px; }
        .dt-close:hover { color: var(--text-primary); }
        .dt-scroll { flex: 1; overflow: auto; }
        .dt-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .dt-table th { padding: 6px 12px; text-align: left; color: var(--text-primary); font-weight: 600; font-size: 10px; border-bottom: 2px solid var(--border-color); background: var(--bg-secondary); position: sticky; top: 0; cursor: pointer; white-space: nowrap; user-select: none; }
        .dt-table th:hover { background: var(--bg-tertiary); }
        .dt-table td { padding: 4px 12px; color: var(--text-secondary); white-space: nowrap; max-width: 300px; overflow: hidden; text-overflow: ellipsis; height: 24px; }
        .dt-table tr:nth-child(even) { background: rgba(30,41,59,0.3); }
        .dt-table tr:hover td { background: rgba(59,130,246,0.05); }
      `}</style>

      <div className="dt-container" style={{ height }}>
        <div className="dt-resize-handle" onMouseDown={handleResizeStart} />
        <div className="dt-header">
          <span className="dt-title">Data</span>
          <input className="dt-search" type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="dt-meta">Showing {displayRows.length} of {rows.length} rows</span>
          <button className="dt-close" onClick={() => dispatch({ type: 'TOGGLE_DATA_TABLE' })}>×</button>
        </div>
        <div className="dt-scroll">
          <table className="dt-table">
            <thead>
              <tr>{columns.map((col) => (
                <th key={col} onClick={() => handleSort(col)}>
                  {formatColumnName(col)}
                  {sortCol === col && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}</tr>
            </thead>
            <tbody>
              {displayRows.map((row, ri) => (
                <tr key={ri}>{columns.map((col) => (
                  <td key={col}>{row[col] == null ? '' : typeof row[col] === 'number' ? formatNumber(row[col]) : String(row[col])}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
