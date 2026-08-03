// Component registry, extracted from entities/Entity.js (CODE_QUALITY_ACTION_PLAN.md
// Wave 4). This module never imports Entity — defineAccessors takes the target
// class as a parameter, so any class can register accessors without a
// circular dependency back to Entity.js.

import { Position } from './Position.js';
import { Health } from './Health.js';
import { Renderable } from './Renderable.js';
import { Movable } from './Movable.js';
import { InventoryContainer } from './InventoryContainer.js';
import { AIBehavior } from './AIBehavior.js';
import { LightEmitter } from './LightEmitter.js';
import { MoveIntent } from './MoveIntent.js';
import { DamageIntent } from './DamageIntent.js';
import { DestroyIntent } from './DestroyIntent.js';
import { NoiseEvent } from './NoiseEvent.js';
import { Vision } from './Vision.js';
import { Inventory } from './Inventory.js';
import { Item } from './Item.js';
import { MeleeWeapon } from './MeleeWeapon.js';
import { Consumable } from './Consumable.js';
import { ActionPoints } from './ActionPoints.js';
import { SurvivalStats } from './SurvivalStats.js';
import { PlayerSkills } from './PlayerSkills.js';
import { PlayerWallet } from './PlayerWallet.js';
import { AIState } from './AIState.js';
import { Burnable } from './Burnable.js';
import { RpgStats } from './RpgStats.js';
import { EquippedArmor } from './EquippedArmor.js';

/**
 * Generate facade get/set accessors on TargetClass.prototype that read/write
 * through a lazily-created component instance. Any class (not just Entity)
 * can call this to register component-backed properties.
 */
export function defineAccessors(TargetClass, componentName, ComponentClass, props) {
  for (const [prop, defaultVal] of Object.entries(props)) {
    // T8/R13#3: never hand a mutable default out by reference. A caller pushing
    // into the shared literal (e.g. `entity.noiseBlacklist` on an entity with no
    // AIState component) would silently corrupt every other component-less
    // entity reading the same default. Return a fresh copy per read instead.
    const isMutableDefault = defaultVal !== null && typeof defaultVal === 'object';
    Object.defineProperty(TargetClass.prototype, prop, {
      get() {
        const comp = this.getComponent(componentName);
        if (comp) return comp[prop];
        return isMutableDefault ? structuredClone(defaultVal) : defaultVal;
      },
      set(val) {
        let comp = this.getComponent(componentName);
        if (!comp) {
          comp = new ComponentClass();
          this.addComponent(comp);
        }
        comp[prop] = val;
        this.notifyChange();
      }
    });
  }
}

// COMPONENT_CLASSES: Registry of components that can be attached to entities.
// Divided into Permanent Data Components and Intent/Action Tags.
export const COMPONENT_CLASSES = {
  // --- Permanent Data Components ---
  Position,
  Health,
  Renderable,
  Movable,
  InventoryContainer,
  AIBehavior,
  LightEmitter,
  Vision,
  Inventory,
  Item,
  MeleeWeapon,
  Consumable,
  ActionPoints,
  SurvivalStats,
  PlayerSkills,
  PlayerWallet,
  AIState,
  Burnable,
  RpgStats,
  EquippedArmor,

  // --- Intent / Action Tags (Temporary States) ---
  MoveIntent,
  DamageIntent,
  DestroyIntent,
  NoiseEvent
};

// Reverse lookup: component constructor -> stable registry name. Built once so
// addComponent can key components by constructor IDENTITY rather than
// constructor.name. Production minification mangles class names (Health -> "e"),
// which would store components under garbage keys and make getComponent('Health')
// return undefined — the hp getter would then read 0 and kill the player the
// instant a new game starts (a build-only bug invisible in unminified dev).
export const COMPONENT_NAME_BY_CTOR = new Map(
  Object.entries(COMPONENT_CLASSES).map(([name, ctor]) => [ctor, name])
);
