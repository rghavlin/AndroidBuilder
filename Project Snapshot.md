Zombie Road — Inventory Project Snapshot (as of Oct 30, 2025)
Purpose

Integrate a single, trait-based inventory into the existing UI in small, low-risk phases. Keep layout stable; wire behavior incrementally.

Status by Phase

5A – Manager unification: One InventoryManager created during init; exposed via context; dev bridge added.

5B – Equipment (read-only): Seven canonical slots render from manager state.

5C – Backpack panel visibility: Equipped backpack reliably exposes its grid (sync/fallback creation).

5D – Specialty containers (read-only open): Floating containers render via portal with proper z-index; item images load from /images/items and stretch across multi-cell footprints; fallback fills footprint.

Next up: 5E (ground ↔ backpack moves), 5F (nested container moves), 5G (cursor-follow drag with rotate + right-click open).

Key Problems Encountered → Resolutions

Double init / start flicker: Hidden second init path raced the Start Menu.
→ Single initializeGame entry in Start Menu, idempotency/runId guards in init.

InventoryProvider mounting before manager: “No ground container” / null grids.
→ Mount provider only after manager exists; providers never block init.

Open-container state didn’t re-render: Mutated a Set in place.
→ Immutable updates for Sets/Maps in context.

Floating panel stacking/visibility: Panels hidden by stacking contexts.
→ React portal to document.body, stable z-index, removed double-portal.

Icons missing / not stretching: imageId mismatches and cache key mismatch.
→ Use ItemDefs imageId (no extension), preload images keyed by itemId, render one absolutely-positioned <img> spanning width × height, object-fit: contain, full-size fallback in GridSlot.

Dev console test items bypassed defs: Legacy spawn path omitted imageId.
→ Dev Console uses createItemFromDef(...) + new Item(...).

Build break: Wrong import path (ItemTrait.js).
→ Corrected to existing module.

Interaction mapping (temporary): Left-click opens containers (used during 5D).
→ Will switch to right-click open once drag model lands (see 5G).

Current Guardrails (do not violate)

One InventoryManager; one <InventoryProvider>; no auto-init side effects.

No layout churn: keep existing slot sizes/panels.

Immutable React state for Sets/Maps.

Testing via in-game Dev Console; browser console only for framework diagnostics.

Seven canonical equipment slots.

What’s Next (Implementation Notes & Acceptance)
5E — Minimal moves: Ground ↔ Backpack

Do: Implement moveItem(fromContainerId, toContainerId, itemId, x, y) path; hook basic drop handlers.

Accept when: Item moves between ground and equipped backpack; state persists; no UI/layout changes.

5F — Minimal moves: Nested specialty containers

Do: Same move flow into/out of open floating container panels.

Accept when: Items move between any open container and backpack/ground; panels stay in sync.

5G — Advanced drag interactions (new, documented)

Model:

Left-click = pick up (item sticks to cursor).

Right-click / R = rotate while dragging.

Left-click to place; if invalid, snap back.

Right-click (not dragging) on container item = open.

Architecture:

Add dragState + actions to InventoryContext: beginDrag, rotateDrag, cancelDrag, tryPlace, getPlacementPreview.

One DragPreviewLayer (portal) renders the cursor-follow image + green/red footprint.

Grids report coordinates/events; placement rules live in InventoryManager via validatePlacement/applyPlacement.

Accept when: Cursor-follow preview works across ground/backpack/floating containers; rotate works; invalid placement reverts; right-click opens when not dragging.

Touch Points (when you implement the next phases)

InventoryContext: add dragState & actions; continue immutable updates.

InventoryManager: add validatePlacement and applyPlacement; reuse existing container/grid math.

Grids (UniversalGrid et al.): left-down → beginDrag; move → update cursor; left-up → tryPlace; contextmenu → rotate or open (prevent default).

InventoryPanel: mount one DragPreviewLayer.

Testing & Dev Console

Keep using in-game commands (e.g., phase5e) and helpers (window.inventoryManager, window.inv) to spawn/open containers and exercise moves.

Verify logs for image loads, container open/close, and move success/failure reasons.