/**
 * Categorical palette shared by the visualizations.
 * Keep these values in sync with design-system.md; they are intentionally the
 * only raw chart colors in the component source.
 */
export const CATEGORICAL_PALETTE = [
  '#e60049',
  '#0bb4ff',
  '#50e991',
  '#e6d800',
  '#9b19f5',
  '#ffa300',
  '#dc0ab4',
  '#b3d4ff',
  '#00bfa0',
  '#97421d'
];

/**
 * @param {number} index
 * @param {number} [size]
 */
export function colorForIndex(index, size = CATEGORICAL_PALETTE.length) {
  const safeSize = Math.max(1, size || CATEGORICAL_PALETTE.length);
  return CATEGORICAL_PALETTE[index % Math.min(safeSize, CATEGORICAL_PALETTE.length)];
}
