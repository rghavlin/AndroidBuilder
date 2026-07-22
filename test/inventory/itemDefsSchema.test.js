import { describe, it, expect } from 'vitest';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../../client/src/game/inventory/CraftingRecipes.js';
import { ItemCategory, ItemTrait } from '../../client/src/game/inventory/traits.js';

describe('ItemDefs & CraftingRecipes Schema Audit', () => {
  describe('ItemDefs Structural Verification', () => {
    it('has key matching defId for every entry in ItemDefs', () => {
      for (const [key, def] of Object.entries(ItemDefs)) {
        const id = def.id || def.defId;
        expect(id, `Item key ${key} must specify id or defId`).toBeDefined();
        expect(id, `Item key ${key} should match def.id`).toBe(key);
      }
    });

    it('has valid string name and positive dimensions for every item', () => {
      for (const [key, def] of Object.entries(ItemDefs)) {
        expect(typeof def.name, `Item ${key} must have a string name`).toBe('string');
        expect(def.name.length, `Item ${key} name cannot be empty`).toBeGreaterThan(0);

        if (def.width !== undefined) {
          expect(Number.isInteger(def.width) && def.width > 0, `Item ${key} width must be positive integer`).toBe(true);
        }
        if (def.height !== undefined) {
          expect(Number.isInteger(def.height) && def.height > 0, `Item ${key} height must be positive integer`).toBe(true);
        }
      }
    });

    it('has valid categories if specified', () => {
      for (const [key, def] of Object.entries(ItemDefs)) {
        if (def.categories) {
          expect(Array.isArray(def.categories), `Item ${key} categories must be an array`).toBe(true);
          for (const cat of def.categories) {
            if (cat) {
              expect(typeof cat, `Item ${key} category ${cat} should be a string`).toBe('string');
            }
          }
        }
      }
    });
  });

  describe('CraftingRecipes Reference Resolution', () => {
    const validCategoriesAndTraits = new Set([
      ...Object.values(ItemCategory),
      ...Object.values(ItemTrait)
    ]);

    it('has unique IDs for every recipe', () => {
      const ids = new Set();
      for (const recipe of CraftingRecipes) {
        expect(ids.has(recipe.id), `Duplicate recipe ID: ${recipe.id}`).toBe(false);
        ids.add(recipe.id);
      }
    });

    it('resolves every resultItem to an existing defId in ItemDefs', () => {
      for (const recipe of CraftingRecipes) {
        expect(
          ItemDefs[recipe.resultItem],
          `Recipe ${recipe.id} resultItem "${recipe.resultItem}" does not exist in ItemDefs`
        ).toBeDefined();
      }
    });

    it('resolves all ingredient requirements to valid ItemDefs or Categories/Traits', () => {
      for (const recipe of CraftingRecipes) {
        for (const req of recipe.ingredients) {
          if (req.id) {
            expect(
              ItemDefs[req.id],
              `Recipe ${recipe.id} ingredient id "${req.id}" does not exist in ItemDefs`
            ).toBeDefined();
          } else if (req.category) {
            expect(
              validCategoriesAndTraits.has(req.category),
              `Recipe ${recipe.id} ingredient category "${req.category}" is invalid`
            ).toBe(true);
          } else if (req.either) {
            for (const eitherId of req.either) {
              const resolvesAsItem = !!ItemDefs[eitherId];
              const resolvesAsCategory = validCategoriesAndTraits.has(eitherId);
              expect(
                resolvesAsItem || resolvesAsCategory,
                `Recipe ${recipe.id} ingredient either element "${eitherId}" does not exist in ItemDefs or Categories`
              ).toBe(true);
            }
          } else {
            expect.fail(`Recipe ${recipe.id} ingredient requirement missing id, category, or either`);
          }
        }
      }
    });

    it('resolves all tool requirements to valid ItemDefs or Categories/Traits', () => {
      for (const recipe of CraftingRecipes) {
        for (const toolReq of recipe.tools) {
          if (toolReq.id) {
            expect(
              ItemDefs[toolReq.id],
              `Recipe ${recipe.id} tool id "${toolReq.id}" does not exist in ItemDefs`
            ).toBeDefined();
          } else if (toolReq.category) {
            expect(
              validCategoriesAndTraits.has(toolReq.category),
              `Recipe ${recipe.id} tool category "${toolReq.category}" is invalid`
            ).toBe(true);
          } else if (toolReq.either) {
            for (const eitherId of toolReq.either) {
              const resolvesAsItem = !!ItemDefs[eitherId];
              const resolvesAsCategory = validCategoriesAndTraits.has(eitherId);
              expect(
                resolvesAsItem || resolvesAsCategory,
                `Recipe ${recipe.id} tool either element "${eitherId}" does not exist in ItemDefs or Categories`
              ).toBe(true);
            }
          }
        }
      }
    });
  });
});
