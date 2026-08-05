# Graph Report - AndroidBuilder  (2026-08-05)

## Corpus Check
- 498 files · ~6,531,866 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3138 nodes · 8244 edges · 144 communities (100 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22770142`
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
- Combat and Turn Management
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
- Tile Rendering and Cache
- Line of Sight System
- Map Editor Tools
- toast.tsx
- Crafting Manager Logic
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
- Ground Item Management
- Scenario Map Generation
- Form UI Components
- Door Interaction Logic
- Road Generation Logic
- Trading System Logic
- Toast Notification State
- Carousel UI Components
- Toast UI Components
- World Object Spawning
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
- apEconomy.js
- .generateFromScenario
- EntityRenderer.js
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- MapConnectivityValidator.js
- ExplosionIntent
- Building Hallway Tests
- Table UI Components
- WeatherManager
- RabbitAI
- .runTurn
- LineOfSight.js
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- Electron Main Process
- EarbucksShopSystem
- verify_firefighter_spawn.js
- RoadGenerator
- alert.tsx
- tmp_verify_zombie_loot.js
- tmp_verify_zombie_loot.js
- OTP Input Components
- rcVehicleMovement.test.js
- API Query Client
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- Container.test.js
- MockGameMap
- Image Cropping Scripts
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `Item` - 125 edges
2. `createItemFromDef()` - 125 edges
3. `cn()` - 119 edges
4. `GameMap` - 97 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 71 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `litterGround()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneStates.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicleMovement.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (144 total, 44 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.06
Nodes (51): DroneConfig, RcVehicleConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost() (+43 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (80): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction (+72 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (31): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+23 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.11
Nodes (10): getProgressionForMap(), PlaceIcon, findSouthTransitionTile(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, NPCSpawner (+2 more)

### Community 6 - "Action Intent System"
Cohesion: 0.19
Nodes (19): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), MapInterface() (+11 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 9 - "Entity Component System"
Cohesion: 0.14
Nodes (16): ActionContext, ActionProvider(), CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), ExplosionIntent, dropZombieDeathLoot() (+8 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (45): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+37 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (15): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+7 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (9): isInsideCompound(), TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings() (+1 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (23): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.14
Nodes (16): GameMapContext, GameMapProvider(), logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, isTurretPassableBy(), DEFAULT_TERRAIN_PROPS (+8 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.09
Nodes (33): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), DevConsoleProps (+25 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (14): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps (+6 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.07
Nodes (19): MeleeWeapon, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, INIT_STATES, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS (+11 more)

### Community 23 - "Door"
Cohesion: 0.08
Nodes (14): EntityFactory, applyNpcAIMode(), AISystem, npc(), emptyTiles(), loadScenario(), door, engineMock (+6 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.09
Nodes (25): LootProgression, isGroundPriority(), isPinnedInPlace(), CategoryDisplayName, CategoryPriority, FUEL_VALUES, ItemCategory, ItemTrait (+17 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.09
Nodes (23): JournalUI(), drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain() (+15 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (17): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+9 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.20
Nodes (10): EquipmentSlot, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+2 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.15
Nodes (14): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan() (+6 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (52): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), EntityRegistry, GameEvent, LegacyDialogStep, QuestRegistry, downconvertEvents() (+44 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.21
Nodes (6): inputContent, runInspector(), compressString(), decompressString(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.10
Nodes (11): log, LineOfSight, logger, Quadrant, Row, slope(), Logger, test() (+3 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.06
Nodes (36): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+28 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.26
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.05
Nodes (28): ZombieTooltip(), ZombieTooltipProps, RabbitAI, DamageIntent, MoveIntent, getNPCType(), getZombieType(), ZombieTypes (+20 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.48
Nodes (6): deployAndLaunch(), equipPhone(), freshBattery(), litterGround(), makeStowedDrone(), placeRemoteDrone()

### Community 73 - "World Object Spawning"
Cohesion: 0.09
Nodes (30): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+22 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.12
Nodes (6): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), gameMap, generator, generator

### Community 76 - "App Routing and Scaling"
Cohesion: 0.24
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.06
Nodes (33): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+25 more)

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (19): scripts, ap-economy, balance, budget:update, build, build-electron, check, dev (+11 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.09
Nodes (39): EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, StartModeDialog(), StartModeDialogProps, CraftingUI(), AudioContext, AudioProvider() (+31 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.26
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.17
Nodes (11): FURNITURE_FOOTPRINTS, assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid() (+3 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.40
Nodes (5): useCarousel(), useChart(), useFormField(), useSidebar(), react

### Community 93 - "EntityRenderer.js"
Cohesion: 0.17
Nodes (16): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, applyEnergyApCap(), applySurvivalCascade() (+8 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.12
Nodes (5): BranchingRoadGenerator, RoadNetwork, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.10
Nodes (11): EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, Item, TestEntity, engine (+3 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.16
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.12
Nodes (9): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), computeBrainstemStewTreatment(), hammerRecipe (+1 more)

### Community 103 - "RabbitAI"
Cohesion: 0.20
Nodes (13): FloatingContainerOverlay(), FloatingContainerOverlayProps, ItemContextMenu(), ItemContextMenuProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, useAction() (+5 more)

### Community 104 - ".runTurn"
Cohesion: 0.24
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (7): FactionRegistry, COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set(), restoreEntity()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.03
Nodes (29): DevConsole(), ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health (+21 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.08
Nodes (27): NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, createItemFromDef(), ItemDefs, PocketLayouts, FireMode (+19 more)

### Community 118 - "RoadGenerator"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 119 - "alert.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "MockGameMap"
Cohesion: 0.21
Nodes (4): exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `verify_firefighter_spawn.js` to `traits.js`, `Item Interaction Logic`, `NPC AI Behavior`, `Action Intent System`, `Entity Component System`, `Entity and Item Types`, `Rabbit AI State`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `Combat and Turn Management`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Toast UI Components`, `Map Tile Logic`, `Map Serialization Tests`, `Item Factory Methods`, `.executeTransition`, `Campfire Visibility Tests`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `npcAttackOnSight.test.js`, `EarbucksShopSystem`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `cn()` connect `Game Engine Context` to `AI and Inventory Systems`, `Action Intent System`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `Character and Menu Windows`, `World Progression and Spawning`, `Action Queue Processing`, `Sidebar UI Components`, `EventRunner`, `Loot and Layout Estimation`, `Asset Image Loader`, `Rendering Optimization Tests`, `Menubar UI Components`, `Audio Management System`, `Carousel UI Components`, `World Object Spawning`, `Campfire Visibility Tests`, `EntityRenderer.js`, `RabbitAI`, `Electron Main Process`, `tmp_verify_zombie_loot.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `apEconomy.js`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _714 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05745814307458143 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._