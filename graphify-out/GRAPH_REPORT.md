# Graph Report - AndroidBuilder  (2026-08-24)

## Corpus Check
- 524 files · ~6,558,856 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3261 nodes · 8797 edges · 156 communities (118 shown, 38 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f75dc9e`
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
- Map Tile Logic
- Map Serialization Tests
- App Routing and Scaling
- Item Factory Methods
- Item Movement Logic
- .executeTransition
- Electron Build Config
- Server and Vite Config
- NPM Build Scripts
- DevConsole.tsx
- RabbitAI
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
- TollGateSystem
- Building Hallway Tests
- ConfigManager
- Table UI Components
- WeatherManager
- RabbitAI
- .runTurn
- LineOfSight.js
- navigation-menu.tsx
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- Logger
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- sheet.tsx
- verify_loot.js
- alert.tsx
- tmp_verify_zombie_loot.js
- apEconomy.js
- ZombieTypes.js
- runContainerTests
- API Query Client
- .recordHit
- ._restoreTilesAndEntities
- IntentQueue
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- eventMarkers.test.js
- index.js
- Image Cropping Scripts
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- SplitRoadGenerator
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 155 edges
2. `Item` - 138 edges
3. `cn()` - 119 edges
4. `GameMap` - 102 edges
5. `engine` - 86 edges
6. `Entity` - 86 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 56 edges
9. `useInventory()` - 50 edges
10. `GameHarness` - 48 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (156 total, 38 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (13): consumeDeployCharge(), droneChargesRemaining(), canOperate(), deploy(), deployedPosition(), focusPointOf(), launch(), listControllables() (+5 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.16
Nodes (15): FloatingContainer(), FloatingContainerProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, hasItemsInside(), AttributeProgressionManager, GridSlotSizeConfig (+7 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.11
Nodes (32): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid() (+24 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.16
Nodes (9): getProgressionForMap(), LootProgression, MapProgression, findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner (+1 more)

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (18): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, MenuButtonDef, StartMenuButtons() (+10 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.10
Nodes (15): JournalUI(), log, interpolateText(), applyEnergyApCap(), applySurvivalCascade(), cureInfection(), deriveSecondaryStats(), infectPlayer() (+7 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.10
Nodes (9): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., FireMode, equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem() (+1 more)

### Community 9 - "Entity Component System"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.16
Nodes (20): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+12 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (18): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, builder, mapData (+10 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (23): DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent, LegacyBubbleEvent (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.09
Nodes (21): SpeechBubbleInput(), AudioContext, AudioProvider(), CombatContext, CombatProvider(), GameProvider(), LogProvider(), OverlayContext (+13 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.09
Nodes (42): GameControlsProps, STAT_COLORS, StatBar, StatBarProps, InfectionHUD(), drawImprovedCursor(), lastRainUpdate, MapCanvas() (+34 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.21
Nodes (6): CharacterCreator(), PlayerSkillsUI(), CombatResolver, buildScriptedAttackAction(), resolveAttackMode(), fireManyAtLongRange()

### Community 19 - "Character and Menu Windows"
Cohesion: 0.12
Nodes (30): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+22 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.06
Nodes (25): RabbitAI, DamageIntent, MoveIntent, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS (+17 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.30
Nodes (13): dropZombieDeathLoot(), getCorpseOverrides(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack() (+5 more)

### Community 23 - "Door"
Cohesion: 0.07
Nodes (15): DevConsole(), Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., PERSISTED_KEYS, pickPersistedMetadata() (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.17
Nodes (3): PlayerCombatSystem, ENEMY_TYPES, GameHarness

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (11): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "Combat and Turn Management"
Cohesion: 0.11
Nodes (16): ActionContext, ActionProvider(), CameraContext, CameraProvider(), GameMapContext, GameMapProvider(), isTurretPassableBy(), getBrainPulpOverrides() (+8 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.27
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.07
Nodes (14): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideCompound(), isInsideTollGate(), isInStartArea(), isFloor(), logger (+6 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (18): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+10 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+34 more)

### Community 42 - "toast.tsx"
Cohesion: 0.24
Nodes (14): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+6 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (19): DRONE_ITEM_DEF_IDS, isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank() (+11 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.17
Nodes (5): compressString(), decompressString(), GameSaveSystem, json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.16
Nodes (3): Tile, buildMap(), mapWithEdgeWindow()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 50 - "Window and Door Interaction"
Cohesion: 0.07
Nodes (21): RoadGenerator, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), VisionSystem (+13 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.12
Nodes (9): getBrainstemColor(), getBrainstemStewColors(), ZombieCorpseConfig, gameRandom, makeSeededRandom(), arm(), brokenScopeStats, templates (+1 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.20
Nodes (15): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+7 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.24
Nodes (7): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, useItemImage()

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 62 - "TestEntity"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.13
Nodes (20): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+12 more)

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.23
Nodes (13): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+5 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.07
Nodes (14): Container, isGroundPriority(), isPinnedInPlace(), _warnedCatchAllProps, PocketLayouts, runContainerTests(), runTest(), testResults (+6 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.22
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 75 - "Map Serialization Tests"
Cohesion: 0.27
Nodes (8): getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), asItemInstance(), equipChargedPhone(), makeWagon(), MOTOR_PAIRS

### Community 77 - "Item Factory Methods"
Cohesion: 0.18
Nodes (5): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, ConfigManager, TILESET_MISSING_TERRAINS

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (19): scripts, ap-economy, balance, budget:update, build, build-electron, check, dev (+11 more)

### Community 83 - "DevConsole.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 84 - "RabbitAI"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 85 - "context-menu.tsx"
Cohesion: 0.27
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.17
Nodes (11): FURNITURE_FOOTPRINTS, assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid() (+3 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 92 - ".generateFromScenario"
Cohesion: 0.31
Nodes (5): AITargeting, TurretAI, removeDestroyedTurret(), hydratedGridItems(), TurretSystem

### Community 94 - "DevConsole.tsx"
Cohesion: 0.16
Nodes (5): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, runDebug()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 98 - "TollGateSystem"
Cohesion: 0.13
Nodes (19): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+11 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 100 - "ConfigManager"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 101 - "Table UI Components"
Cohesion: 0.16
Nodes (5): CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), computeBrainstemStewTreatment()

### Community 104 - ".runTurn"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 109 - "SeededRandom"
Cohesion: 0.05
Nodes (33): createItemFromDef(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), makeItems(), makeAutoWagon(), makeAutoWagon() (+25 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 112 - "Logger"
Cohesion: 0.29
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), Toaster(), useToast(), react

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (79): GridSlot, GridSlotProps, ItemTooltip(), ItemTooltipProps, WeaponModPanel(), WeaponModPanelProps, AccordionContent, AccordionItem (+71 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.05
Nodes (34): ItemDefs, CategoryDisplayName, EquipmentSlot, FUEL_VALUES, ItemCategory, Rarity, RarityWeights, SlotDisplayName (+26 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 116 - "toggle-group.tsx"
Cohesion: 0.09
Nodes (11): PlayerSkills, INIT_STATES, EventEmitter, SafeEventEmitter, aiComp, ent, npc, player (+3 more)

### Community 117 - "sheet.tsx"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 119 - "alert.tsx"
Cohesion: 0.50
Nodes (3): equipChargedPhone(), makeTurret(), makeWagon()

### Community 122 - "apEconomy.js"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 126 - "ZombieTypes.js"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.06
Nodes (44): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+36 more)

### Community 132 - "IntentQueue"
Cohesion: 0.18
Nodes (5): IntentQueue, LIVING_TARGETS, log, performScriptedAttack(), resolveScriptedDeath()

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.11
Nodes (12): DestroyIntent, NoiseEvent, SimulationManager, AISystem, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+4 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.06
Nodes (16): AIState, Burnable, defineAccessors(), RpgStats, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see (+8 more)

### Community 144 - "eventMarkers.test.js"
Cohesion: 0.15
Nodes (9): Drone, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE (+1 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **704 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+699 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `Item Interaction Logic`, `Game Engine Context`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `ExplosionSystem.js`, `Tooltip Components`, `IntentQueue`, `NPC AI Behavior`, `Inventory and Skill Windows`, `Entity and Item Types`, `TestEntity.js`, `HUD and Dialog UI`, `eventMarkers.test.js`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Combat and Turn Management`, `EventRunner`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `Asset Image Loader`, `Rendering Optimization Tests`, `Developer Console UI`, `TemplateMapGenerator.js`, `Toast UI Components`, `Map Serialization Tests`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Table UI Components`, `verify_firefighter_spawn.js`, `sheet.tsx`, `alert.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Logger`, `EarbucksShopSystem`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `._restoreTilesAndEntities`, `AI and Inventory Systems`, `Game Engine Context`, `Action Intent System`, `Shop and Log UI`, `Entity Component System`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Sidebar UI Components`, `Container Grid Logic`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `TestEntity`, `Crafting Recipe Verification`, `Item Factory Methods`, `DevConsole.tsx`, `context-menu.tsx`, `TollGateSystem`, `.runTurn`, `navigation-menu.tsx`, `toggle-group.tsx`, `ZombieTypes.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _720 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.11224489795918367 - nodes in this community are weakly interconnected._