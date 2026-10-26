import { describe, expect, it } from 'vitest';

import { clamp, formatCount, joinLabels, pluralize } from './format.js';

describe('format helpers', () => {
  it('formats counts safely', () => {
    expect(formatCount(3)).toBe('3');
    expect(formatCount('4')).toBe('4');
    expect(formatCount(null)).toBe('0');
    expect(formatCount(undefined)).toBe('0');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'item')).toBe('item');
    expect(pluralize(2, 'item')).toBe('items');
    expect(pluralize(2, 'category', 'categories')).toBe('categories');
  });

  it('clamps numbers', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('joins labels', () => {
    expect(joinLabels(['a', 'b'])).toBe('a, b');
    expect(joinLabels([])).toBe('');
    expect(joinLabels(null)).toBe('');
  });
});
