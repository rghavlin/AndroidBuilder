## God-objects (managed decomposition)

Before adding logic to a god-object file — `entities/Entity.js`, `map/GameMap.js`, `inventory/InventoryManager.js`, `inventory/Item.js`, `map/LootGenerator.js`, `managers/SimulationManager.js`, `pages/editor.tsx` — see AGENTS.md §6. Do not grow them: put new behavior in a system/module operating on components (or, for `editor.tsx`, a panel component under `components/MapEditor/`), and extract the nearest seam when you touch one. Targets are in `CODE_QUALITY_ACTION_PLAN.md` (Wave 4).

Line budgets are enforced by `test/quality/godObjectBudget.test.js`, which runs as part of `npm test` and fails if any of these files grows past its recorded baseline. After extracting a seam, run `npm run budget:update` to ratchet the baseline down.
