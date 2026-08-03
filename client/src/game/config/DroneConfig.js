/**
 * Tunables for the remote-control drone family (recon drone is Phase 1).
 * Centralized so balance passes touch one file, not scattered literals.
 */
export const DroneConfig = {
  AP_PER_TILE: 0.5,
  CHARGE_PER_TILE: 0.5,
  DEPLOY_AP: 1,
  DEPLOY_CHARGE: 1,
  STOW_AP: 1,
  LAND_AP: 1,
  HOVER_CHARGE_PER_TURN: 1,
  PHONE_CHARGE_PER_TURN: 1,
  RECON_SIGHT_BONUS: 3,
  DRONE_HP: 8
};
