/**
 * Professional color palettes for charts
 */

export const PALETTES = {
  default: [
    '#3b82f6', '#22d3ee', '#34d399', '#fbbf24', '#f472b6',
    '#a78bfa', '#fb923c', '#f87171', '#38bdf8', '#4ade80',
    '#e879f9', '#facc15', '#2dd4bf', '#818cf8', '#fb7185',
    '#c084fc', '#f97316', '#06b6d4', '#10b981', '#eab308',
  ],
  tableau10: [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
    '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  ],
  pastel: [
    '#a8d8ea', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7',
    '#c7ceea', '#f7d6e0', '#d4e7c5', '#fde2e4', '#e8d5b7',
  ],
  vivid: [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#01a3a4', '#f368e0', '#ff6348', '#7bed9f',
  ],
  ocean: [
    '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a',
    '#0096c7', '#48cae4', '#ade8f4', '#03045e', '#0077b6',
  ],
  sunset: [
    '#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e',
    '#ff9f1c', '#ffbf69', '#cbf3f0', '#2ec4b6', '#e71d36',
  ],
};

export function getColor(index, palette = 'default') {
  const colors = PALETTES[palette] || PALETTES.default;
  return colors[index % colors.length];
}

export function getColors(count, palette = 'default') {
  const colors = PALETTES[palette] || PALETTES.default;
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

export function getColorWithOpacity(color, opacity) {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Sequential color scale for heatmaps and gradients
 */
export function getSequentialColor(value, min, max, startColor = '#1e293b', endColor = '#3b82f6') {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  const parseHex = (hex) => {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  };

  const start = parseHex(startColor);
  const end = parseHex(endColor);

  const r = Math.round(start.r + (end.r - start.r) * clampedRatio);
  const g = Math.round(start.g + (end.g - start.g) * clampedRatio);
  const b = Math.round(start.b + (end.b - start.b) * clampedRatio);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Diverging color scale for positive/negative values
 */
export function getDivergingColor(value, min, max) {
  if (value >= 0) {
    return getSequentialColor(value, 0, max, '#1e293b', '#34d399');
  } else {
    return getSequentialColor(Math.abs(value), 0, Math.abs(min), '#1e293b', '#f87171');
  }
}
