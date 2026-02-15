import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse a file based on its type and return structured data
 */
export async function parseFile(fileResult) {
  const { type, data, name } = fileResult;

  switch (type) {
    case 'csv':
      return parseCSV(data, name);
    case 'excel':
      return parseExcel(data, name);
    case 'json':
      return parseJSON(data, name);
    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
}

function parseCSV(csvString, name) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = analyzeColumns(results.data, results.meta.fields);
        resolve({
          name: name.replace(/\.\w+$/, ''),
          fileName: name,
          rows: results.data,
          columns,
          totalRows: results.data.length,
          errors: results.errors,
        });
      },
      error: (err) => reject(err),
    });
  });
}

function parseExcel(base64Data, name) {
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const workbook = XLSX.read(bytes, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const fields = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  const columns = analyzeColumns(jsonData, fields);

  return {
    name: name.replace(/\.\w+$/, ''),
    fileName: name,
    rows: jsonData,
    columns,
    totalRows: jsonData.length,
    sheetNames: workbook.SheetNames,
    activeSheet: sheetName,
    errors: [],
  };
}

function parseJSON(jsonString, name) {
  let data = JSON.parse(jsonString);

  // Handle nested JSON - try to flatten
  if (!Array.isArray(data)) {
    // Check if there's a top-level array key
    const arrayKeys = Object.keys(data).filter((k) => Array.isArray(data[k]));
    if (arrayKeys.length > 0) {
      data = data[arrayKeys[0]];
    } else {
      data = [data];
    }
  }

  const fields = data.length > 0 ? Object.keys(data[0]) : [];
  const columns = analyzeColumns(data, fields);

  return {
    name: name.replace(/\.\w+$/, ''),
    fileName: name,
    rows: data,
    columns,
    totalRows: data.length,
    errors: [],
  };
}

/**
 * Analyze columns to determine types and statistics
 */
function analyzeColumns(rows, fields) {
  if (!fields || fields.length === 0) return [];

  return fields.map((field) => {
    const values = rows.map((r) => r[field]).filter((v) => v != null && v !== '');
    const totalValues = values.length;
    const nullCount = rows.length - totalValues;

    // Determine type
    const typeInfo = detectColumnType(values);

    // Basic stats
    const col = {
      name: field,
      type: typeInfo.type,
      role: typeInfo.role, // 'dimension' or 'measure'
      nullCount,
      uniqueCount: new Set(values.map(String)).size,
      totalCount: rows.length,
      sampleValues: values.slice(0, 5),
    };

    // Numeric stats
    if (typeInfo.type === 'number') {
      const nums = values.filter((v) => typeof v === 'number' && !isNaN(v));
      if (nums.length > 0) {
        col.min = Math.min(...nums);
        col.max = Math.max(...nums);
        col.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        col.sum = nums.reduce((a, b) => a + b, 0);
      }
    }

    // Date stats
    if (typeInfo.type === 'date') {
      col.role = 'dimension';
    }

    return col;
  });
}

function detectColumnType(values) {
  if (values.length === 0) return { type: 'string', role: 'dimension' };

  const sample = values.slice(0, 100);

  // Check numeric
  const numericCount = sample.filter(
    (v) => typeof v === 'number' || (!isNaN(Number(v)) && v !== '' && v !== null && v !== true && v !== false)
  ).length;
  if (numericCount / sample.length > 0.8) {
    return { type: 'number', role: 'measure' };
  }

  // Check boolean
  const boolCount = sample.filter(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false'
  ).length;
  if (boolCount / sample.length > 0.8) {
    return { type: 'boolean', role: 'dimension' };
  }

  // Check date
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US
    /^\d{1,2}-\d{1,2}-\d{2,4}/, // EU
    /^\w+ \d{1,2},? \d{4}/, // Month Day, Year
  ];
  const dateCount = sample.filter((v) => {
    if (typeof v !== 'string') return false;
    return datePatterns.some((p) => p.test(v)) || !isNaN(Date.parse(v));
  }).length;
  if (dateCount / sample.length > 0.7) {
    return { type: 'date', role: 'dimension' };
  }

  // Check if it's a low-cardinality categorical
  const uniqueRatio = new Set(sample.map(String)).size / sample.length;
  if (uniqueRatio < 0.05 && values.length > 20) {
    return { type: 'string', role: 'dimension' };
  }

  return { type: 'string', role: 'dimension' };
}

/**
 * Aggregate data based on group-by columns and measures
 */
export function aggregateData(rows, groupByColumns, measures) {
  if (!groupByColumns || groupByColumns.length === 0) {
    // No grouping - just return measures
    const result = {};
    measures.forEach((m) => {
      const values = rows.map((r) => Number(r[m.field])).filter((v) => !isNaN(v));
      result[m.field] = applyAggregation(values, m.aggregation || 'sum');
    });
    return [result];
  }

  // Group rows
  const groups = {};
  rows.forEach((row) => {
    const key = groupByColumns.map((c) => row[c] ?? '(null)').join('|||');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  // Aggregate each group
  return Object.entries(groups).map(([key, groupRows]) => {
    const result = {};
    const keyParts = key.split('|||');
    groupByColumns.forEach((col, i) => {
      result[col] = keyParts[i];
    });

    measures.forEach((m) => {
      const values = groupRows.map((r) => Number(r[m.field])).filter((v) => !isNaN(v));
      const aggField = `${m.aggregation || 'sum'}_${m.field}`;
      result[aggField] = applyAggregation(values, m.aggregation || 'sum');
      result[m.field] = result[aggField]; // Also store with original name for simple access
    });

    result._count = groupRows.length;
    return result;
  });
}

function applyAggregation(values, type) {
  if (values.length === 0) return 0;
  switch (type) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
    case 'mean':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'countd':
      return new Set(values).size;
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'stddev': {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sqDiffs = values.map((v) => Math.pow(v - mean, 2));
      return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
    }
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/**
 * Filter rows based on filter conditions
 */
export function filterData(rows, filters) {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.field];
      switch (filter.operator) {
        case 'equals':
          return String(value) === String(filter.value);
        case 'not_equals':
          return String(value) !== String(filter.value);
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'not_contains':
          return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(filter.value);
        case 'less_than':
          return Number(value) < Number(filter.value);
        case 'greater_equal':
          return Number(value) >= Number(filter.value);
        case 'less_equal':
          return Number(value) <= Number(filter.value);
        case 'between':
          return Number(value) >= Number(filter.min) && Number(value) <= Number(filter.max);
        case 'in':
          return filter.values && filter.values.includes(String(value));
        case 'not_in':
          return filter.values && !filter.values.includes(String(value));
        case 'is_null':
          return value == null || value === '';
        case 'is_not_null':
          return value != null && value !== '';
        default:
          return true;
      }
    });
  });
}

/**
 * Sort data by columns
 */
export function sortData(rows, sortConfig) {
  if (!sortConfig || sortConfig.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of sortConfig) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      const direction = sort.direction === 'desc' ? -1 : 1;

      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1 * direction;
      if (bVal == null) return -1 * direction;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal !== bVal) return (aVal - bVal) * direction;
      } else {
        const cmp = String(aVal).localeCompare(String(bVal));
        if (cmp !== 0) return cmp * direction;
      }
    }
    return 0;
  });
}
