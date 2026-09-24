/**
 * Clothing the player starts in when a scenario doesn't author a loadout.
 * Shared by GameInitializationManager (which equips it) and the map editor
 * (which pre-fills the player loadout with it so it can be removed — an
 * authored empty loadout starts the player with nothing on).
 */
export const DEFAULT_PLAYER_CLOTHING = ['clothing.pocket_t', 'clothing.sweatpants'];

/** The default clothing as editor loadout rows ({ defId }). */
export const defaultPlayerLoadout = () => DEFAULT_PLAYER_CLOTHING.map(defId => ({ defId }));
