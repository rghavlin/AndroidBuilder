import { Entity, EntityType } from './Entity.js';
import { SequencerAction } from '../managers/SequencerAction.js';
import { Item } from '../inventory/Item.js';
import { DroneConfig } from '../config/DroneConfig.js';
import engine from '../GameEngine.js';

/**
 * A remote-control device flown by the player — the recon drone is the first
 * of a planned family (bombers, RC ground wagons). Modeled on Rabbit.js: a
 * lightweight Entity subclass with its own click-to-move playAction, not
 * routed through the AI/turn-simulation systems in Phase 1 (direct player
 * control only; autonomous mode is a later phase).
 *
 * Deploy/land/stow state transforms live in remote/RemoteDeviceRegistry.js;
 * this class only models the airborne state.
 */
export class Drone extends Entity {
  constructor(id, x = 0, y = 0, deviceKind = 'recon') {
    super(id, EntityType.DRONE, x, y);
    this.blocksMovement = false; // flies over every entity, indoors and out
    this.blocksSight = false;

    this.deviceKind = deviceKind;
    // Drives EntityRenderer's sprite lookup (images/items/recondrone.png) so
    // the airborne token matches the item's own ground/stowed art.
    this.subtype = deviceKind === 'recon' ? 'recondrone' : deviceKind;

    // High ceilings everywhere in Phase 1 (see plan). 'ground' is reserved for
    // the future RC-wagon device; a future indoor 'low' tier would key off
    // GameMap.isSheltered rather than adding a new field later.
    this.altitude = 'high';
    this.factionId = 'player';
    // The player id operating this device — set by RemoteDeviceRegistry.deploy.
    this.operatorId = null;

    // Defaults from DroneConfig; a future device kind (bomber) would carry
    // different rates without needing a Drone subclass.
    this.apPerTile = DroneConfig.AP_PER_TILE;
    this.chargePerTile = DroneConfig.CHARGE_PER_TILE;
    // Added to the player's own effective sight range (day/night/weather
    // already folded in) when this device is airborne — see
    // GameEngine.recalculateFOV / remote/DroneVision.js.
    this.sightBonus = DroneConfig.RECON_SIGHT_BONUS;

    // R14#4: maxHp BEFORE hp — the hp setter clamps to the current Health.max.
    this.maxHp = DroneConfig.DRONE_HP;
    this.hp = DroneConfig.DRONE_HP;

    // The full tool.recon_drone item JSON (including its battery attachment),
    // stashed on deploy so land()/stow() can rehydrate the item losslessly.
    this.sourceItem = null;

    // Fractional flight charge, banked here rather than on the battery — see
    // remote/DronePower.js (mirrors Item.consumeScooterPower's
    // _powerAccumulator). Must survive land/relaunch or a player could dodge
    // fractional drain by cycling the device.
    this._powerAccumulator = 0;

    this.movementPath = [];
    this.isAnimating = false;
    this.animationProgress = 0;
    this.isActive = false;
  }

  isDead() {
    return this.hp <= 0;
  }

  /**
   * Single-step MOVE animation, for the TurnManager playback path (any entity
   * receiving a MOVE action must implement this — see TurnManager's MOVE case).
   * Autonomous mode will route drone movement through there.
   *
   * NOT used by direct player control: remote/DroneMovement.js runs one
   * continuous tween across the whole path instead, because stepping tile by
   * tile makes the camera jump a full tile at a time and reads as choppy.
   */
  async playAction(action, callbacks = {}) {
    const { type, data } = action;
    const { onImpact } = callbacks;

    if (type !== 'MOVE') return Promise.resolve();

    const from = data.from || { x: this.x, y: this.y };
    const to = data.to || from;
    if (from.x === to.x && from.y === to.y) return Promise.resolve();

    this.movementPath = [from, to];

    const camera = engine.camera;
    const isFromVisible = camera ? camera.isTileVisible(Math.round(from.x), Math.round(from.y)) : true;
    const isToVisible = camera ? camera.isTileVisible(Math.round(to.x), Math.round(to.y)) : true;
    if (!isFromVisible && !isToVisible) {
      this.renderX = to.x;
      this.renderY = to.y;
      this.x = to.x;
      this.y = to.y;
      this.movementPath = [];
      return Promise.resolve();
    }

    this.isAnimating = true;
    const duration = 150;
    const seq = new SequencerAction(this, duration, duration, onImpact);
    engine.registerAction(seq);

    return seq.promise.then(() => {
      this.renderX = to.x;
      this.renderY = to.y;
      this.x = to.x;
      this.y = to.y;
      this.movementPath = [];
      this.isAnimating = false;
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      deviceKind: this.deviceKind,
      altitude: this.altitude,
      operatorId: this.operatorId,
      apPerTile: this.apPerTile,
      chargePerTile: this.chargePerTile,
      sightBonus: this.sightBonus,
      // sourceItem is a live Item instance at runtime (so DronePower can drain
      // its battery through the normal charge path) — serialize to POJO here.
      sourceItem: this.sourceItem ? this.sourceItem.toJSON() : null,
      _powerAccumulator: this._powerAccumulator
    };
  }

  static fromJSON(data) {
    const drone = new Drone(data.id, data.x, data.y, data.deviceKind ?? 'recon');
    drone.altitude = data.altitude ?? 'high';
    drone.factionId = data.factionId ?? 'player';
    drone.operatorId = data.operatorId ?? null;
    drone.apPerTile = data.apPerTile ?? DroneConfig.AP_PER_TILE;
    drone.chargePerTile = data.chargePerTile ?? DroneConfig.CHARGE_PER_TILE;
    drone.sightBonus = data.sightBonus ?? DroneConfig.RECON_SIGHT_BONUS;

    // R14#4: maxHp before hp.
    drone.maxHp = data.maxHp ?? DroneConfig.DRONE_HP;
    drone.hp = data.hp ?? DroneConfig.DRONE_HP;

    drone.sourceItem = data.sourceItem ? Item.fromJSON(data.sourceItem) : null;
    drone._powerAccumulator = data._powerAccumulator ?? 0;

    drone.gridX = data.gridX !== undefined ? data.gridX : (data.logicalX !== undefined ? data.logicalX : data.x);
    drone.gridY = data.gridY !== undefined ? data.gridY : (data.logicalY !== undefined ? data.logicalY : data.y);
    drone.renderX = data.x;
    drone.renderY = data.y;
    drone.logicalX = drone.gridX;
    drone.logicalY = drone.gridY;

    return drone;
  }
}
