# Game Design, Entities, and Asset Standards

This document serves as the authoritative specification for gameplay design, entity specifications, and asset creation pipelines. All designers, artists, and programmers must adhere to these specifications to maintain visual consistency and logical compatibility.

---

## 1. Entity Specifications: Zombies

Zombie entities must be subclasses of the base `Zombie` class and follow the declarative **ECS-Intent System** for turn simulation rather than directly mutating coordinates or health states.

### Core Zombie Properties
Every zombie instance must maintain the following properties:
* `lastSeen` (boolean): Defaults to `false`. Becomes `true` when the player exits the zombie's line of sight.
* `heardNoise` (boolean): Defaults to `false`.
* `targetSightedCoords` (object `{x, y}`): Defaults to `(0, 0)`. Stores the player's last visible tile coordinate.
* `noiseCoords` (object `{x, y}`): Defaults to `(0, 0)`. Stores the coordinate of the last heard sound.
* `maxAP` (number): AP limit per turn. Defaults to `8`.
* `hp` (number): Health points.

### Zombie Variants
* **Basic Zombie**: 10 HP, 12 maxAP. Found throughout the map.
* **Crawler Zombie**: 5 HP, 6 maxAP. Found in groups of 2-4 per map. Slower and more fragile.

### Line of Sight Tracking
As the player moves, the vision system checks the tiles along the player's path. If a player passes from a tile visible to a zombie to a tile not visible to that zombie, `lastSeen` becomes `true` and the player's exit tile is recorded in `targetSightedCoords`.

### Turn Simulation Behavior (ECS-Intent Flow)
During the simulation phase of the turn, the AI system processes each zombie sequentially to evaluate its state and push component intents to the `IntentQueue`. **No direct mutations are allowed.**

```
          [Start Zombie Turn Evaluation]
                        |
            Is player in Line of Sight?
           /                           \
        (Yes)                          (No)
         /                               \
Calculate A* path to Player        Is lastSeen true?
Generate MoveIntent or            /                 \
DamageIntent (if adjacent)     (Yes)                (No)
                                /                     \
                  Calculate A* path to          Is heardNoise true?
                  targetSightedCoords          /                   \
                  Generate MoveIntent        (Yes)                 (No)
                  Set lastSeen=false          /                      \
                  when reached        Calculate A* path         End Turn /
                                      to noiseCoords           Pass Intent
                                      Generate MoveIntent
                                      Set heardNoise=false
                                      when reached
```

1. **Player Sighted (In Line of Sight):**
   * Computes path to player's current coordinate.
   * If adjacent: Queues a `DamageIntent` targeting the player, consuming AP.
   * If not adjacent: Queues a `MoveIntent` along the calculated path towards the player, consuming AP.
2. **Player Slipped Away (`lastSeen` is true):**
   * Computes path to `targetSightedCoords`.
   * Queues a `MoveIntent` along that path.
   * Once the zombie reaches `targetSightedCoords`, `lastSeen` is set to `false`.
3. **Sound Heard (`heardNoise` is true):**
   * Computes path to `noiseCoords`.
   * Queues a `MoveIntent` along that path.
   * Once the zombie reaches `noiseCoords`, `heardNoise` is set to `false`.
4. **Default Action:**
   * Random wandering (to be implemented). Currently queues a pass action.

---

## 2. Asset Standards: Item Images & Orientation

To ensure visual consistency and decouple asset creation from scattered code definitions, the inventory system follows a strict orientation standard.

### CRITICAL RULE: All rectangular item images must be landscape/horizontal (width > height).
* **Square items (1×1, 2×2):** No orientation constraint.
* **Rectangular items (e.g., 2×1, 3×1, 4×1):** Must be defined and created as landscape (width > height).

```javascript
// ✅ CORRECT - All rectangular items are landscape
'weapon.9mmPistol': { width: 2, height: 2 }      // Square
'weapon.rifle': { width: 4, height: 1 }       // Horizontal  
'weapon.knife': { width: 2, height: 1 }       // Horizontal
'weapon.baseball_bat': { width: 3, height: 1 } // Horizontal
'tool.smallflashlight': { width: 2, height: 1 }    // Horizontal
'food.water': { width: 2, height: 1 }         // Horizontal

// ❌ WRONG - Do not define rectangular items vertically
'weapon.knife': { width: 1, height: 2 }       // Vertical - VIOLATION
'weapon.rifle': { width: 1, height: 4 }       // Vertical - VIOLATION
```

### Rotation Behavior
Items can be rotated 90° during grid placement:
* A 2×1 item (horizontal by default) becomes 1×2 when rotated (vertical).
* A 4×1 rifle (horizontal by default) becomes 1×4 when rotated (vertical).
* The UI visually rotates the asset, but the source image file is always landscape.

### Asset Creation Guidelines for Artists
1. **Source Dimensions:** Build images with transparent padding inside a square canvas.
2. **Wider Than Tall:** Ensure the visual item artwork is wider than it is tall for all non-square layouts.

---

## 3. Entity Images & Fallbacks

Entity sprites render on the viewport and use dynamic loading and geometry-based fallback rules.

### File Naming Convention
Entity images in [client/public/images/entities/](file:///c:/Games/AndroidBuilder/client/public/images/entities/) must follow:
* `{entityType}.{extension}` - For basic entity types (e.g., `player.png`, `zombie.png`, `npc.png`)
* `{entityType}_{subtype}.{extension}` - For specific variants (e.g., `zombie_fast.png`, `zombie_bloated.png`, `player_injured.png`)

### Supported Formats
* PNG (Recommended - supports transparency)
* JPG/JPEG
* GIF
* SVG

### Visual Guidelines
* **Recommended Size:** 64x64 pixels (scaled automatically by rendering context).
* **Style:** Pixel art or clean, transparent-background flat icons.

### Fallback Rules
If an image is not found or fails to load, the rendering system automatically draws geometric shapes:
* **Player:** Blue circle
* **Zombie:** Red circle
* **NPC:** Green circle
* **Items:** Colored squares representing the item type (weapon, ammo, food, etc.)
* **Unknown:** Gray square

---

## 4. Map Evolution & Game Modes Roadmap

This section documents the map system's development history and specifies how maps are loaded, generated, and utilized across the different game modes.

### 1. The Evolution of Maps & Map Editor
* **Predetermined & Infinite Maps (Legacy):** The project originally started with an infinite series of smaller, predetermined maps.
* **Town-Size Maps (Intermediate):** The map system was then expanded to support large, town-sized maps.
* **Custom Maps (Current/Future):** The architecture has transitioned to support completely custom maps.
* **Editor Purpose Pivot:** The map editor was initially created to design a basic tutorial level. Its role has since expanded to serve as the authoring tool for the entire Campaign mode. Advanced features are continually integrated into the editor to support this campaign-creation capability.

### 2. Supported Game Modes
In the production release, the player will be able to choose from three distinct play modes:

| Play Mode | Map Source | Generation vs. Loading | Details |
| :--- | :--- | :--- | :--- |
| **Freeplay** | Endless procedural map cycle | Dynamic Generation | The default endless mode. Maps are generated dynamically on demand (e.g., at game startup or during map transitions). No changes to the existing flow. |
| **Campaign** | Custom-authored map sequence | Pre-made Map Loading | A narrative campaign starting with a tutorial level. Maps are custom-designed using the map editor and loaded in the sequence specified by the campaign flow. |
| **Scenarios** | Standalone custom scenarios | Pre-made Map Loading | Standalone custom maps representing special gameplay situations or challenges, package-included in the game. |

### 3. Production Role of the Map Editor
* **In-Game Availability:** The Map Editor will be fully included in the production release.
* **User Customization:** Players will have full access to the Map Editor to design, save, and load their own custom maps, operating with the same workflows currently available in the development build.

