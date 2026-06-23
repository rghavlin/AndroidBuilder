/**
 * Helper function to check if coordinates (x, y) lie inside a compound's fence bounds.
 * @param {Object} compound - The compound metadata (e.g. townSquareCompound)
 * @param {number} x - The x-coordinate
 * @param {number} y - The y-coordinate
 * @returns {boolean} True if inside the compound bounds, false otherwise.
 */
export function isInsideCompound(compound, x, y) {
  if (!compound || !compound.fenceBounds) return false;
  const { x1, x2, y1, y2 } = compound.fenceBounds;
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}
