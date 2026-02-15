/**
 * Number and value formatting utilities
 */

export function formatNumber(value, options = {}) {
  if (value == null || isNaN(value)) return '–';

  const {
    decimals = 'auto',
    compact = false,
    prefix = '',
    suffix = '',
    percent = false,
  } = options;

  let num = Number(value);

  if (percent) {
    num = num * 100;
  }

  if (compact && Math.abs(num) >= 1000) {
    return prefix + compactNumber(num) + suffix + (percent ? '%' : '');
  }

  let decimalPlaces;
  if (decimals === 'auto') {
    if (Number.isInteger(num)) {
      decimalPlaces = 0;
    } else if (Math.abs(num) < 1) {
      decimalPlaces = 4;
    } else if (Math.abs(num) < 100) {
      decimalPlaces = 2;
    } else {
      decimalPlaces = 1;
    }
  } else {
    decimalPlaces = decimals;
  }

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return prefix + formatted + (percent ? '%' : '') + suffix;
}

function compactNumber(num) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e12) return sign + (absNum / 1e12).toFixed(1) + 'T';
  if (absNum >= 1e9) return sign + (absNum / 1e9).toFixed(1) + 'B';
  if (absNum >= 1e6) return sign + (absNum / 1e6).toFixed(1) + 'M';
  if (absNum >= 1e3) return sign + (absNum / 1e3).toFixed(1) + 'K';
  return sign + absNum.toFixed(0);
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatColumnName(name) {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function truncateText(text, maxLength = 30) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}
