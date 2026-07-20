# UI Theming Implementation Plan (Light/Dark Mode)

This document outlines the architectural roadmap for converting the current static dark-themed UI into a dynamically toggleable Light/Dark theme system.

## 1. CSS Variables & Base Styles (`client/src/index.css`)
Currently, both `:root` and `.dark` blocks in `index.css` define the same dark-mode color palette.
- **Action:** Generate a light-mode color palette (backgrounds, foregrounds, borders, accents) and assign it to the `:root` block. Keep the dark-mode colors in the `.dark` block.
- **Custom Classes:** Refactor skeuomorphic CSS classes (e.g., `.metal-panel`, `.equipment-slot-metal`, `.inset-slot`) that use hardcoded dark gradients and hex codes. Create `.light .metal-panel` variants to ensure they render appropriately in light mode.

## 2. React Components (Tailwind Classes)
Throughout the React UI (`client/src/components/`), utility classes like `bg-zinc-950`, `bg-[#1a1a1a]`, and `border-white/10` are hardcoded.
- **Action:** Audit all React components and replace hardcoded colors with semantic, theme-aware Tailwind classes (e.g., `bg-background`, `bg-card`, `border-border`, `bg-secondary`).
- **Goal:** Components should automatically switch styling when the root theme changes without needing explicit `dark:` prefixes everywhere.

## 3. Canvas Rendering Engine
The main game canvas relies on `client/src/game/renderer/TileRenderer.js` and `EntityRenderer.js`, which currently use hardcoded hex strings (e.g., `TERRAIN_COLORS` like `'#1a3c1a'` for grass).
- **Action:** Create dual palettes (e.g., `DARK_TERRAIN_COLORS` and `LIGHT_TERRAIN_COLORS`).
- **Action:** Update the GameEngine and Renderers to accept the current theme state from the application layer, dynamically switching the active color palette when drawing tiles, entity borders, and UI elements on the canvas.

## 4. Theme State Management & Toggle
A central mechanism is needed to manage and persist the player's theme preference.
- **Action:** Implement a `ThemeProvider` (React Context) to manage the global theme state (`light` vs `dark`).
- **Action:** Add a theme toggle in the `OptionsWindow` component.
- **Action:** Save the selected theme to `localStorage` to persist across sessions. Toggling this setting should dynamically add or remove the `.dark` class from the root HTML document.
