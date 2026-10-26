/**
 * Small formatting helpers. Keep these display-neutral: components decide
 * where and how to render the result.
 */

export function formatCount(count) {
  return Number.isFinite(Number(count)) ? String(Number(count)) : '0';
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function joinLabels(labels, separator = ', ') {
  return Array.isArray(labels) ? labels.join(separator) : '';
}
