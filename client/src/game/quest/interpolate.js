/**
 * Text interpolation for authored event copy (dialog / speech-bubble lines).
 *
 * Substitutes [name] tokens with the current value of the matching global
 * variable — or flag — from QuestState, so an authored line like
 *   "How are you today, [playerName]?"
 * renders with the live value at display time.
 *
 * Rules:
 *  - Only names that actually exist as a var or flag are substituted. Any other
 *    bracketed text (e.g. "[see the note]") is left exactly as written, so a
 *    typo'd token shows up in-game rather than silently vanishing.
 *  - Variables take precedence over flags if a name exists as both.
 *  - Surrounding whitespace inside the brackets is ignored: "[ playerName ]"
 *    resolves the same as "[playerName]".
 *  - Numbers/booleans are stringified ("3", "true"); string vars pass through.
 */
const TOKEN_RE = /\[([^\][]+)\]/g;

export function interpolateText(text, questState) {
  if (typeof text !== 'string' || text.indexOf('[') === -1 || !questState) return text;
  const vars = questState.vars || {};
  const flags = questState.flags || {};
  return text.replace(TOKEN_RE, (match, raw) => {
    const name = raw.trim();
    if (Object.prototype.hasOwnProperty.call(vars, name)) return String(vars[name]);
    if (Object.prototype.hasOwnProperty.call(flags, name)) return String(flags[name]);
    return match;
  });
}
