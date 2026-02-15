import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Treemap
} from 'recharts';
import { useData } from '../context/DataContext';
import { getColors, getColorWithOpacity } from '../utils/chartColors';
import { formatNumber, formatColumnName } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: 12, margin: '2px 0' }}>
          {formatColumnName(entry.name)}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

const ChartCanvas = () => {
  const chartContainerRef = useRef(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const {
    chartType,
    xAxis,
    yAxis,
    colorBy,
    sizeBy,
    chartTitle,
    showLegend,
    showGrid,
    selectedPalette,
    activeDataset,
    dispatch,
    getProcessedData,
  } = useData();

  const processedData = useMemo(() => {
    try {
      return getProcessedData() || [];
    } catch (error) {
      console.error('Error processing data:', error);
      return [];
    }
  }, [getProcessedData]);

  const yFields = useMemo(() => yAxis.map((y) => y.field), [yAxis]);

  const colors = useMemo(() => {
    return getColors(20, selectedPalette);
  }, [selectedPalette]);

  const handleTitleClick = useCallback(() => {
    setEditedTitle(chartTitle || 'Untitled Chart');
    setTitleEditing(true);
  }, [chartTitle]);

  const handleTitleBlur = useCallback(() => {
    setTitleEditing(false);
    if (editedTitle && editedTitle !== chartTitle) {
      dispatch({ type: 'SET_CHART_TITLE', payload: editedTitle });
    }
  }, [editedTitle, chartTitle, dispatch]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleTitleBlur();
    else if (e.key === 'Escape') setTitleEditing(false);
  }, [handleTitleBlur]);

  // Handle drop on empty state
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.role === 'dimension' && !xAxis) {
        dispatch({ type: 'SET_X_AXIS', payload: data.field });
      } else if (data.role === 'measure') {
        dispatch({ type: 'ADD_Y_AXIS', payload: { field: data.field, aggregation: 'sum' } });
      } else if (data.role === 'dimension') {
        dispatch({ type: 'SET_COLOR_BY', payload: data.field });
      }
    } catch (err) { /* ignore non-field drops */ }
  }, [dispatch, xAxis]);

  const computeHistogramBins = useCallback((values, binCount = 10) => {
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + (i * binSize) / binCount).toFixed(1)} - ${(min + ((i + 1) * binSize) / binCount).toFixed(1)}`,
      count: 0,
    }));
    values.forEach((v) => {
      const idx = Math.min(Math.floor(((v - min) / binSize) * binCount), binCount - 1);
      bins[idx].count += 1;
    });
    return bins;
  }, []);

  const renderEmptyState = () => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', color: 'var(--text-muted)',
        textAlign: 'center', padding: 40,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}>📊</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>
        Drop fields to create a visualization
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 400 }}>
        Drag dimensions to X Axis and measures to Y Axis,
        or click fields in the panel to auto-assign them.
      </p>
      {activeDataset && (
        <p style={{ fontSize: 12, marginTop: 12, color: 'var(--text-muted)' }}>
          Dataset loaded: {activeDataset.name} ({activeDataset.totalRows.toLocaleString()} rows)
        </p>
      )}
    </div>
  );

  const hasData = processedData.length > 0 && xAxis && yFields.length > 0;

  const axisStyle = { stroke: '#64748b', fontSize: 11, fill: '#94a3b8' };
  const gridProps = showGrid ? { strokeDasharray: '3 3', stroke: '#2d3a4d' } : { stroke: 'transparent' };

  const renderBarChart = () => {
    if (!hasData) return renderEmptyState();
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
          <CartesianGrid {...gridProps} />
          <RXAxis dataKey={xAxis} {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} interval={0} />
          <RYAxis {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#94a3b8' }} />}
          {yFields.map((field, idx) => (
            <Bar key={field} dataKey={field} name={formatColumnName(field)} fill={colors[idx]} radius={[4, 4, 0, 0]} animationDuration={600} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    if (!hasData) return renderEmptyState();
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
          <CartesianGrid {...gridProps} />
          <RXAxis dataKey={xAxis} {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} interval={0} />
          <RYAxis {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#94a3b8' }} />}
          {yFields.map((field, idx) => (
            <Line key={field} type="monotone" dataKey={field} name={formatColumnName(field)} stroke={colors[idx]} strokeWidth={2.5} dot={{ r: 3, fill: colors[idx] }} activeDot={{ r: 6 }} animationDuration={600} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    if (!hasData) return renderEmptyState();
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
          <defs>
            {yFields.map((field, idx) => (
              <linearGradient key={`grad-${field}`} id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={colors[idx]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <RXAxis dataKey={xAxis} {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} interval={0} />
          <RYAxis {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#94a3b8' }} />}
          {yFields.map((field, idx) => (
            <Area key={field} type="monotone" dataKey={field} name={formatColumnName(field)} fill={`url(#grad-${field})`} stroke={colors[idx]} strokeWidth={2} animationDuration={600} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderScatterChart = () => {
    if (!processedData.length || !xAxis || !yFields.length) return renderEmptyState();
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid {...gridProps} />
          <RXAxis dataKey={xAxis} name={formatColumnName(xAxis)} {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} type="category" />
          <RYAxis dataKey={yFields[0]} name={formatColumnName(yFields[0])} {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          {showLegend && <Legend />}
          <Scatter name={formatColumnName(yFields[0])} data={processedData} fill={colors[0]} animationDuration={600} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = (isDonut = false) => {
    if (!processedData.length || !xAxis || !yFields.length) return renderEmptyState();
    const yField = yFields[0];
    const total = processedData.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            dataKey={yField}
            nameKey={xAxis}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            innerRadius={isDonut ? '45%' : 0}
            label={({ name, value }) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${name} (${pct}%)`;
            }}
            labelLine={{ stroke: '#64748b' }}
            animationDuration={600}
          >
            {processedData.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#94a3b8' }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderRadarChart = () => {
    if (!processedData.length || !xAxis || !yFields.length) return renderEmptyState();
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={processedData}>
          <PolarGrid stroke="#2d3a4d" />
          <PolarAngleAxis dataKey={xAxis} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          {yFields.map((field, idx) => (
            <Radar key={field} name={formatColumnName(field)} dataKey={field} stroke={colors[idx]} fill={colors[idx]} fillOpacity={0.3} animationDuration={600} />
          ))}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderTreemap = () => {
    if (!processedData.length || !xAxis || !yFields.length) return renderEmptyState();
    const yField = yFields[0];
    const tData = processedData.map((item, idx) => ({
      name: String(item[xAxis] || ''),
      size: Math.abs(Number(item[yField]) || 0),
      fill: colors[idx % colors.length],
    }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={tData} dataKey="size" nameKey="name" stroke="#0f172a" animationDuration={600}>
          {tData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Treemap>
      </ResponsiveContainer>
    );
  };

  const renderHistogram = () => {
    if (!processedData.length || !yFields.length) return renderEmptyState();
    const yField = yFields[0];
    const values = processedData.map((item) => Number(item[yField])).filter((v) => !isNaN(v));
    if (!values.length) return renderEmptyState();
    const bins = computeHistogramBins(values);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
          <CartesianGrid {...gridProps} />
          <RXAxis dataKey="range" {...axisStyle} tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} interval={0} />
          <RYAxis {...axisStyle} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Frequency" fill={colors[0]} radius={[4, 4, 0, 0]} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderHeatmap = () => {
    if (!processedData.length || !xAxis || !yFields.length) return renderEmptyState();
    const yField = yFields[0];
    const values = processedData.map((item) => Number(item[yField]) || 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const cols = Math.ceil(Math.sqrt(processedData.length));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3, padding: 20, height: '100%', overflowY: 'auto', alignContent: 'start' }}>
        {processedData.map((item, idx) => {
          const v = Number(item[yField]) || 0;
          const norm = (v - minVal) / range;
          const bg = `hsl(210, 80%, ${20 + norm * 45}%)`;
          return (
            <div key={idx} style={{
              background: bg, padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', minHeight: 70, border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'default', transition: 'transform 0.15s',
            }}
              title={`${item[xAxis]}: ${formatNumber(v)}`}
            >
              <div style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 600, marginBottom: 2, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item[xAxis]}</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{formatNumber(v)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    if (!processedData.length) return renderEmptyState();
    const columns = Object.keys(processedData[0]).filter((k) => !k.startsWith('_'));
    return (
      <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%', padding: '10px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{columns.map((col) => (
              <th key={col} style={{ padding: '10px 14px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, borderBottom: '2px solid #334155', background: '#1e293b', position: 'sticky', top: 0, whiteSpace: 'nowrap' }}>
                {formatColumnName(col)}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {processedData.slice(0, 500).map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(30,41,59,0.5)', borderBottom: '1px solid #1e293b' }}>
                {columns.map((col) => (
                  <td key={col} style={{ padding: '8px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {typeof row[col] === 'number' ? formatNumber(row[col]) : String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {processedData.length > 500 && <p style={{ color: '#64748b', fontSize: 11, padding: '8px 14px' }}>Showing 500 of {processedData.length} rows</p>}
      </div>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar': case 'column': return renderBarChart();
      case 'line': return renderLineChart();
      case 'area': return renderAreaChart();
      case 'scatter': case 'bubble': return renderScatterChart();
      case 'pie': return renderPieChart(false);
      case 'donut': return renderPieChart(true);
      case 'radar': return renderRadarChart();
      case 'treemap': return renderTreemap();
      case 'histogram': case 'box': return renderHistogram();
      case 'heatmap': return renderHeatmap();
      case 'table': return renderTable();
      case 'funnel': case 'waterfall': return renderBarChart(); // fallback
      default: return renderEmptyState();
    }
  };

  return (
    <>
      <style>{`
        .chart-canvas-wrap {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: var(--bg-primary);
          overflow: hidden;
        }
        .chart-header {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chart-title-display {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .chart-title-display:hover { background: var(--bg-secondary); }
        .chart-title-input {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--accent-blue);
          border-radius: 6px;
          padding: 4px 8px;
          font-family: inherit;
          outline: none;
          min-width: 200px;
        }
        .chart-body {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .chart-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: auto;
        }
      `}</style>

      <div className="chart-canvas-wrap">
        <div className="chart-header">
          {titleEditing ? (
            <input
              className="chart-title-input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
            />
          ) : (
            <div className="chart-title-display" onClick={handleTitleClick}>
              {chartTitle || 'Untitled Chart'}
            </div>
          )}
          <div className="chart-meta">
            {activeDataset && `${processedData.length.toLocaleString()} rows`}
            {xAxis && ` · X: ${formatColumnName(xAxis)}`}
            {yFields.length > 0 && ` · Y: ${yFields.map(formatColumnName).join(', ')}`}
          </div>
        </div>
        <div className="chart-body" id="chart-canvas" ref={chartContainerRef}>
          {renderChart()}
        </div>
      </div>
    </>
  );
};

export default ChartCanvas;
