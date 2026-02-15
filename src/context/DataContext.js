import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { parseFile, aggregateData, filterData, sortData } from '../utils/dataParser';

const DataContext = createContext();

const initialState = {
  // Data sources
  datasets: [], // [{name, fileName, rows, columns, totalRows}]
  activeDatasetIndex: -1,

  // Visualization config
  chartType: 'bar',
  xAxis: null,       // column name
  yAxis: [],         // [{field, aggregation}]
  colorBy: null,     // column name for color encoding
  sizeBy: null,      // column name for size encoding
  labelBy: null,     // column name for labels
  tooltipFields: [], // additional tooltip fields

  // Data operations
  filters: [],       // [{field, operator, value}]
  sortConfig: [],    // [{field, direction}]
  limit: null,       // row limit

  // UI state
  showDataTable: false,
  showFilters: false,
  selectedPalette: 'default',
  chartTitle: '',
  showLegend: true,
  showGrid: true,

  // Dashboard
  dashboardMode: false,
  dashboardCharts: [],

  // History for undo
  history: [],
  historyIndex: -1,

  // Loading/error
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'ADD_DATASET': {
      const datasets = [...state.datasets, action.payload];
      return {
        ...state,
        datasets,
        activeDatasetIndex: datasets.length - 1,
        isLoading: false,
        error: null,
        // Reset viz config
        xAxis: null,
        yAxis: [],
        colorBy: null,
        sizeBy: null,
        filters: [],
        sortConfig: [],
        chartTitle: action.payload.name,
      };
    }

    case 'REMOVE_DATASET': {
      const datasets = state.datasets.filter((_, i) => i !== action.payload);
      let activeIdx = state.activeDatasetIndex;
      if (action.payload <= activeIdx) {
        activeIdx = Math.max(0, activeIdx - 1);
      }
      if (datasets.length === 0) activeIdx = -1;
      return { ...state, datasets, activeDatasetIndex: activeIdx };
    }

    case 'SET_ACTIVE_DATASET':
      return {
        ...state,
        activeDatasetIndex: action.payload,
        xAxis: null,
        yAxis: [],
        colorBy: null,
        sizeBy: null,
        filters: [],
        sortConfig: [],
      };

    case 'SET_CHART_TYPE':
      return { ...state, chartType: action.payload };

    case 'SET_X_AXIS':
      return { ...state, xAxis: action.payload };

    case 'SET_Y_AXIS':
      return { ...state, yAxis: action.payload };

    case 'ADD_Y_AXIS': {
      const exists = state.yAxis.find((y) => y.field === action.payload.field);
      if (exists) return state;
      return { ...state, yAxis: [...state.yAxis, action.payload] };
    }

    case 'REMOVE_Y_AXIS':
      return { ...state, yAxis: state.yAxis.filter((_, i) => i !== action.payload) };

    case 'UPDATE_Y_AXIS_AGG': {
      const yAxis = [...state.yAxis];
      yAxis[action.payload.index] = {
        ...yAxis[action.payload.index],
        aggregation: action.payload.aggregation,
      };
      return { ...state, yAxis };
    }

    case 'SET_COLOR_BY':
      return { ...state, colorBy: action.payload };

    case 'SET_SIZE_BY':
      return { ...state, sizeBy: action.payload };

    case 'SET_LABEL_BY':
      return { ...state, labelBy: action.payload };

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };

    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.payload] };

    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((_, i) => i !== action.payload) };

    case 'UPDATE_FILTER': {
      const filters = [...state.filters];
      filters[action.payload.index] = action.payload.filter;
      return { ...state, filters };
    }

    case 'SET_SORT':
      return { ...state, sortConfig: action.payload };

    case 'SET_LIMIT':
      return { ...state, limit: action.payload };

    case 'TOGGLE_DATA_TABLE':
      return { ...state, showDataTable: !state.showDataTable };

    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters };

    case 'SET_PALETTE':
      return { ...state, selectedPalette: action.payload };

    case 'SET_CHART_TITLE':
      return { ...state, chartTitle: action.payload };

    case 'TOGGLE_LEGEND':
      return { ...state, showLegend: !state.showLegend };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'TOGGLE_DASHBOARD':
      return { ...state, dashboardMode: !state.dashboardMode };

    case 'ADD_DASHBOARD_CHART':
      return {
        ...state,
        dashboardCharts: [...state.dashboardCharts, action.payload],
      };

    case 'REMOVE_DASHBOARD_CHART':
      return {
        ...state,
        dashboardCharts: state.dashboardCharts.filter((_, i) => i !== action.payload),
      };

    case 'UPDATE_DASHBOARD_CHART': {
      const charts = [...state.dashboardCharts];
      charts[action.payload.index] = action.payload.chart;
      return { ...state, dashboardCharts: charts };
    }

    case 'RESET_VIZ':
      return {
        ...state,
        chartType: 'bar',
        xAxis: null,
        yAxis: [],
        colorBy: null,
        sizeBy: null,
        labelBy: null,
        filters: [],
        sortConfig: [],
        limit: null,
        chartTitle: '',
      };

    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadFile = useCallback(async (filePath) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      let fileResult;
      if (window.electronAPI) {
        fileResult = await window.electronAPI.readFile(filePath);
      } else {
        throw new Error('Electron API not available');
      }
      const dataset = await parseFile(fileResult);
      dispatch({ type: 'ADD_DATASET', payload: dataset });
      return dataset;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const loadFileFromDrop = useCallback(async (file) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const reader = new FileReader();
      const result = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const ext = file.name.split('.').pop().toLowerCase();
          if (ext === 'xlsx' || ext === 'xls') {
            resolve({
              type: 'excel',
              data: btoa(
                new Uint8Array(e.target.result).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  ''
                )
              ),
              name: file.name,
            });
          } else if (ext === 'json') {
            resolve({ type: 'json', data: e.target.result, name: file.name });
          } else {
            resolve({ type: 'csv', data: e.target.result, name: file.name });
          }
        };
        reader.onerror = reject;
        if (file.name.match(/\.(xlsx|xls)$/i)) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      });
      const dataset = await parseFile(result);
      dispatch({ type: 'ADD_DATASET', payload: dataset });
      return dataset;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  // Get processed data (filtered, sorted, aggregated)
  const getProcessedData = useCallback(() => {
    if (state.activeDatasetIndex < 0 || !state.datasets[state.activeDatasetIndex]) {
      return [];
    }

    let rows = [...state.datasets[state.activeDatasetIndex].rows];

    // Apply filters
    rows = filterData(rows, state.filters);

    // Apply sorting
    rows = sortData(rows, state.sortConfig);

    // Apply limit
    if (state.limit && state.limit > 0) {
      rows = rows.slice(0, state.limit);
    }

    // Apply aggregation if we have grouping
    if (state.xAxis && state.yAxis.length > 0) {
      const groupBy = [state.xAxis];
      if (state.colorBy) groupBy.push(state.colorBy);
      rows = aggregateData(rows, groupBy, state.yAxis);

      // Sort by x-axis for chart readability
      rows = sortData(rows, [{ field: state.xAxis, direction: 'asc' }]);
    }

    return rows;
  }, [state]);

  const activeDataset = state.activeDatasetIndex >= 0
    ? state.datasets[state.activeDatasetIndex]
    : null;

  const value = {
    ...state,
    activeDataset,
    dispatch,
    loadFile,
    loadFileFromDrop,
    getProcessedData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
