# Graph Report - AndroidBuilder  (2026-07-29)

## Corpus Check
- 464 files · ~6,477,550 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2961 nodes · 7667 edges · 149 communities (105 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec45c70d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- traits.js
- UI Components
- Item Interaction Logic
- Game Engine Context
- AI and Inventory Systems
- NPC AI Behavior
- Action Intent System
- Shop and Log UI
- Tooltip Components
- Entity Component System
- Item Metadata and Traits
- External Dependencies
- Inventory and Skill Windows
- Entity and Item Types
- Rabbit AI State
- HUD and Dialog UI
- Shop and Pricing Config
- Entity Spawning and Scent
- Map Template Generation
- Character and Menu Windows
- Game Map Management
- World Progression and Spawning
- Game Initialization Manager
- Door
- Turret Combat Logic
- Inventory Management System
- Action Queue Processing
- useGame
- Sidebar UI Components
- Map Generation Config
- EventRunner
- Container Grid Logic
- Options and Crafting UI
- Camera Viewport Control
- Dialog and Button UI
- Loot and Layout Estimation
- Road and Town Generation
- Building Layout Builder
- Line of Sight System
- Map Editor Tools
- toast.tsx
- ImageLoader
- Asset Image Loader
- Turret AI Testing
- Game Engine State
- Build and Dev Dependencies
- DevConsole.tsx
- Window and Door Interaction
- Rendering Optimization Tests
- TypeScript Configuration
- Developer Console UI
- Zombie Visibility Tracking
- pagination.tsx
- Menubar UI Components
- Entity Serialization Tests
- Audio Management System
- UI Framework Config
- TemplateMapGenerator.js
- MapBuilder.js
- TestEntity
- Crafting Recipe Verification
- Scenario Map Generation
- Form UI Components
- Door Interaction Logic
- Road Generation Logic
- Trading System Logic
- Toast Notification State
- Carousel UI Components
- Toast UI Components
- World Object Spawning
- Map Tile Logic
- Map Serialization Tests
- App Routing and Scaling
- Item Factory Methods
- Item Movement Logic
- .executeTransition
- Electron Build Config
- Server and Vite Config
- NPM Build Scripts
- Campfire Visibility Tests
- verify_molotov.mjs
- context-menu.tsx
- FurniturePlanner.js
- TurretCombat.js
- ASCII Map Renderer
- Lab Map Generation
- Weather Management System
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- Building Hallway Tests
- sheet.tsx
- Table UI Components
- LineOfSight.js
- .generateNextMap
- Seeded Random Utilities
- React Error Boundaries
- MockCtx
- Electron Main Process
- EarbucksShopSystem
- SurvivalCascade.js
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- tmp_verify_zombie_loot.js
- OTP Input Components
- StartMenu.tsx
- test_inventory_ecs.mjs
- API Query Client
- chart.tsx
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RoadGenerator
- Container.test.js
- DialogOverlay.tsx
- form.tsx
- Image Cropping Scripts
- TerrainTypes.js
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- navigation-menu.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_zombie_loot.js
- react
- test_exhaustive_los.js
- TestMapBuilder
- MusicManager
- wagonDrag.test.js
- verify_rain_collector_size.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 119 edges
2. `Item` - 109 edges
3. `GameMap` - 93 edges
4. `createItemFromDef()` - 92 edges
5. `Entity` - 83 edges
6. `InventoryManager` - 76 edges
7. `engine` - 61 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (149 total, 44 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (88): BeltContainerPanel(), BeltContainerPanelProps, GridSlot, GridSlotProps, ItemTooltip(), ItemTooltipProps, getAdjustedBgColor(), UniversalGrid() (+80 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.13
Nodes (31): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+23 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.14
Nodes (10): getProgressionForMap(), findSouthTransitionTile(), isInsideTollGate(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner (+2 more)

### Community 6 - "Action Intent System"
Cohesion: 0.04
Nodes (29): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, LightEmitter, Movable (+21 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (26): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, FloatingContainerOverlay(), FloatingContainerOverlayProps (+18 more)

### Community 9 - "Entity Component System"
Cohesion: 0.08
Nodes (22): ZombieTooltip(), ZombieTooltipProps, LootProgression, ZombieTypes, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS (+14 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (40): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+32 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.14
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (9): isInsideCompound(), TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings() (+1 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.07
Nodes (49): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), drawImprovedCursor() (+41 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

### Community 18 - "Map Template Generation"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.14
Nodes (13): InventoryExtensionWindowProps, PlayerSkillsWindowProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps, GridSlotSizeConfig (+5 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (32): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+24 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.09
Nodes (25): DevConsole(), NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, PocketLayouts (+17 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.09
Nodes (21): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+13 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 35 - "Dialog and Button UI"
Cohesion: 0.07
Nodes (35): lastRainUpdate, playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., warnedMalformedEntityIds, SpeechBubbleInput(), StartModeDialog(), StartModeDialogProps (+27 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 37 - "Road and Town Generation"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (17): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+9 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+36 more)

### Community 42 - "toast.tsx"
Cohesion: 0.11
Nodes (11): SeededRandom, args, config, secs, seeds, startSeed, t0, fuzzSeed() (+3 more)

### Community 44 - "ImageLoader"
Cohesion: 0.17
Nodes (6): FactionRegistry, applyMapRegistries(), SafeEventEmitter, hasScenario, loadScenario(), SCENARIO

### Community 45 - "Asset Image Loader"
Cohesion: 0.20
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.11
Nodes (14): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), GameContextInner() (+6 more)

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (6): LineOfSight, Quadrant, Row, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.05
Nodes (36): GameMapProvider(), RabbitAI, DamageIntent, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS (+28 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.09
Nodes (9): Health, Item, MeleeWeapon, Position, Renderable, NOTE: do NOT force itemsModified for every container/attachment item., logger, ZombieReplenishmentSystem (+1 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.15
Nodes (12): EntityRenderer, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+4 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.04
Nodes (22): AIState, Burnable, PlayerSkills, RpgStats, Rabbit, Item, TestEntity, SequencerAction (+14 more)

### Community 66 - "Form UI Components"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.23
Nodes (3): MockGameMap, testWallGapFix(), verifyRestoration()

### Community 74 - "Map Tile Logic"
Cohesion: 0.14
Nodes (8): MapProgression, INIT_STATES, DEFAULT_PLAYER_STATS, idbStore, gameRandom, logger, map, brokenScopeStats

### Community 75 - "Map Serialization Tests"
Cohesion: 0.19
Nodes (5): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 79 - ".executeTransition"
Cohesion: 0.11
Nodes (3): getTemplateForMapNumber(), WorldManager, runDebug()

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (18): scripts, ap-economy, balance, build, build-electron, check, dev, electron (+10 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.32
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), rollWoundInfectionCure() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 94 - "DevConsole.tsx"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.14
Nodes (7): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, computeBrainstemStewTreatment(), hammerRecipe, hatchetRecipe

### Community 105 - "LineOfSight.js"
Cohesion: 0.09
Nodes (17): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+9 more)

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "MockCtx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.10
Nodes (18): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+10 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 120 - "MapCanvas.jsx"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 124 - "OTP Input Components"
Cohesion: 0.08
Nodes (31): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+23 more)

### Community 125 - "StartMenu.tsx"
Cohesion: 0.39
Nodes (5): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "Container.test.js"
Cohesion: 0.14
Nodes (8): MAP_GEN_CONFIG, FIXED_TEMPLATE_ASSIGNMENTS, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, SplitRoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 149 - "TerrainTypes.js"
Cohesion: 0.19
Nodes (10): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, buildMap() (+2 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 173 - "react"
Cohesion: 0.33
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), react

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 182 - "wagonDrag.test.js"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

## Knowledge Gaps
- **684 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+679 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Tooltip Components`, `Entity Component System`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `World Progression and Spawning`, `Action Queue Processing`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Loot and Layout Estimation`, `Road and Town Generation`, `Line of Sight System`, `Menubar UI Components`, `MockCtx`, `SurvivalCascade.js`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Form UI Components`, `AI and Inventory Systems`, `External Dependencies`, `Turret AI Testing`, `Rabbit AI State`, `Action Queue Processing`, `Sidebar UI Components`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _699 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.02745995423340961 - nodes in this community are weakly interconnected._