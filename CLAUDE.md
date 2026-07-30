## God-objects (managed decomposition)

Before adding logic to a god-object file — `entities/Entity.js`, `map/GameMap.js`, `inventory/InventoryManager.js`, `inventory/Item.js`, `map/LootGenerator.js`, `managers/SimulationManager.js`, `pages/editor.tsx` — see AGENTS.md §6. Do not grow them: put new behavior in a system/module operating on components (or, for `editor.tsx`, a panel component under `components/MapEditor/`), and extract the nearest seam when you touch one. Targets are in `CODE_QUALITY_ACTION_PLAN.md` (Wave 4).

Line budgets are enforced by `test/quality/godObjectBudget.test.js`, which runs as part of `npm test` and fails if any of these files grows past its recorded baseline. After extracting a seam, run `npm run budget:update` to ratchet the baseline down.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- Pick the command by question type (requires graphify-out/graph.json):
  - `graphify explain "<Symbol>"` — "how does X work", "what touches X", when you can name the module/class/function. Returns its file, line, and actual edges. Prefer this; it stays focused.
  - `graphify query "<question>"` — "where does this area live", orienting in an unfamiliar subsystem. It seeds on matching nodes then BFS-fans to depth 2, so results are *not* relevance-ranked: the top entries skew toward god-objects (Entity.js, GameMap.js, Item.js) regardless of the question. Read the `Start:` seed list — that is the trustworthy part — and treat the rest as a candidate set, not an answer.
  - `graphify path "<A>" "<B>"` — how two specific things connect.
- These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output. They orient you; they do not replace reading the file you land on.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
