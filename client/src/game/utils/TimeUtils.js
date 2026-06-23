/**
 * Converts a game turn number to the hour of the day (0-23).
 * Game starts at turn 1, corresponding to 6:00 AM.
 * @param {number} turn - The current game turn
 * @returns {number} The current hour of the day (0-23)
 */
export function getHourFromTurn(turn) {
  return (6 + (turn - 1)) % 24;
}
