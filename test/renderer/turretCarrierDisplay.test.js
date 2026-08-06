// Who wins a tile's icon when a powered auto-turret is riding in a wagon.
//
// Default: the turret. It's the exposed, targetable object there — a wagon that
// shoots back should look like it shoots back, not like luggage.
//
// Exception: the wagon you are steering. Once the phone is linked to it, the
// wagon shows as itself and wears the cyan link ring, because "which wagon am I
// driving" is the question on screen at that moment. Reported as: "the turret
// shows instead of the wagon, even when the wagon is selected for movement."

import { describe, it, expect, beforeEach } from 'vitest';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import {
  showsAsPoweredTurret,
  getPoweredTurretForEntity
} from '../../client/src/game/renderer/EntityRenderer.js';
import { TURRET_DEF_ID } from '../../client/src/game/ai/TurretCombat.js';

const make = (defId) => new Item(createItemFromDef(defId));

function makeTurret({ on = true } = {}) {
  const turret = make(TURRET_DEF_ID);
  turret.isOn = on;
  return turret;
}

/** A wagon carrying a turret, as a raw on-map entity shape (JSON grid). */
function wagonCarrying(turret, { instanceId = 'wagon-1' } = {}) {
  return {
    type: 'item',
    instanceId,
    defId: 'vehicle.toy_wagon',
    containerGrid: { items: [turret] }
  };
}

/** Minimal stand-in for the engine: only activeDeviceId is read. */
const linkedTo = (instanceId) => ({ activeDeviceId: instanceId });

describe('showsAsPoweredTurret', () => {
  let turret;

  beforeEach(() => {
    turret = makeTurret();
  });

  it('a wagon carrying a powered turret shows as the turret', () => {
    const wagon = wagonCarrying(turret);
    expect(getPoweredTurretForEntity(wagon)).toBe(turret);
    expect(showsAsPoweredTurret(wagon, linkedTo(null))).toBe(true);
  });

  it('...but shows as itself once the phone is linked to it', () => {
    // The reported bug, stated as the rule.
    const wagon = wagonCarrying(turret);
    expect(showsAsPoweredTurret(wagon, linkedTo('wagon-1'))).toBe(false);
  });

  it('goes back to showing the turret when the link moves elsewhere', () => {
    // Only the linked wagon is exempt — a second wagon on the next tile still
    // advertises its turret.
    const wagon = wagonCarrying(turret);
    expect(showsAsPoweredTurret(wagon, linkedTo('some-other-device'))).toBe(true);
  });

  it('a wagon carrying an UNPOWERED turret always shows as itself', () => {
    const wagon = wagonCarrying(makeTurret({ on: false }));
    expect(showsAsPoweredTurret(wagon, linkedTo(null))).toBe(false);
    expect(showsAsPoweredTurret(wagon, linkedTo('wagon-1'))).toBe(false);
  });

  it('an empty wagon shows as itself whether linked or not', () => {
    const wagon = { type: 'item', instanceId: 'wagon-1', defId: 'vehicle.toy_wagon' };
    expect(showsAsPoweredTurret(wagon, linkedTo(null))).toBe(false);
    expect(showsAsPoweredTurret(wagon, linkedTo('wagon-1'))).toBe(false);
  });

  it('a standalone powered turret keeps its own icon unconditionally', () => {
    // A turret is not a controllable device, so it can never be "selected for
    // movement" — the exception must not reach it even if the ids collide.
    const standalone = { type: 'item', instanceId: 't-1', defId: TURRET_DEF_ID, isOn: true };
    expect(showsAsPoweredTurret(standalone, linkedTo(null))).toBe(true);
    expect(showsAsPoweredTurret(standalone, linkedTo('t-1'))).toBe(true);
  });

  it('a standalone powered-down turret does not claim the active look', () => {
    const off = { type: 'item', instanceId: 't-1', defId: TURRET_DEF_ID, isOn: false };
    expect(showsAsPoweredTurret(off, linkedTo(null))).toBe(false);
  });

  it('reads a real Item container, not just the serialized shape', () => {
    // On-map entities carry a JSON grid; a wagon at the player's feet is a real
    // Item with a Container. Both have to resolve.
    const wagon = make('vehicle.toy_wagon');
    wagon.getContainerGrid().addItem(turret, 0, 0);
    wagon.instanceId = 'wagon-real';

    expect(showsAsPoweredTurret(wagon, linkedTo(null))).toBe(true);
    expect(showsAsPoweredTurret(wagon, linkedTo('wagon-real'))).toBe(false);
  });

  it('accepts a pre-resolved turret so the render loop can avoid a second walk', () => {
    const wagon = wagonCarrying(turret);
    const resolved = getPoweredTurretForEntity(wagon);

    expect(showsAsPoweredTurret(wagon, linkedTo(null), resolved)).toBe(true);
    expect(showsAsPoweredTurret(wagon, linkedTo('wagon-1'), resolved)).toBe(false);
    // An explicit null means "already checked, there isn't one".
    expect(showsAsPoweredTurret(wagon, linkedTo(null), null)).toBe(false);
  });

  it('survives a missing engine or entity', () => {
    expect(showsAsPoweredTurret(null, linkedTo(null))).toBe(false);
    expect(showsAsPoweredTurret(wagonCarrying(turret), null)).toBe(true);
    expect(showsAsPoweredTurret(wagonCarrying(turret), undefined)).toBe(true);
  });
});
