## God-objects (managed decomposition)

Before adding logic to a god-object file — `entities/Entity.js`, `map/GameMap.js`, `inventory/InventoryManager.js`, `inventory/Item.js`, `map/LootGenerator.js`, `managers/SimulationManager.js` — see AGENTS.md §6. Do not grow them: put new behavior in a system/module operating on components, and extract the nearest seam when you touch one. Targets are in `CODE_QUALITY_ACTION_PLAN.md` (Wave 4).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
