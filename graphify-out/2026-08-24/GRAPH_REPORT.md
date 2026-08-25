# Graph Report - AndroidBuilder  (2026-08-24)

## Corpus Check
- 523 files · ~6,557,744 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3257 nodes · 8781 edges · 172 communities (124 shown, 48 thin omitted)
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
- EarbucksShopSystem
- apEconomy.js
- MockGameMap
- verify_phase_2.mjs
- .getPocketContainers
- ZombieTypes.js
- runContainerTests
- API Query Client
- rcVehicleMovement.test.js
- .recordHit
- ._restoreTilesAndEntities
- IntentQueue
- JournalUI.tsx
- MapConnectivityValidator.js
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- npcAttackOnSight.test.js
- npcLoadout.test.js
- accordion.tsx
- eventMarkers.test.js
- index.js
- Image Cropping Scripts
- test_noise_assert.js
- alert.tsx
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- scroll-area.tsx
- SplitRoadGenerator
- tmp_verify_loot.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_loot_summary.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 155 edges
2. `Item` - 138 edges
3. `cn()` - 119 edges
4. `GameMap` - 101 edges
5. `Entity` - 86 edges
6. `engine` - 85 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 56 edges
9. `useInventory()` - 50 edges
10. `GameHarness` - 48 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `useChart()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/chart.tsx → package.json
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (172 total, 48 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.16
Nodes (17): DroneConfig, consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), canOperate(), deploy(), deployedPosition(), focusPointOf() (+9 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.10
Nodes (25): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot, getAdjustedBgColor() (+17 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (40): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), OverlayManager(), PlayerSkillsWindowProps, TollWindow() (+32 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.13
Nodes (10): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), EMPTY_CATALOG, AnimalSpawner (+2 more)

### Community 6 - "Action Intent System"
Cohesion: 0.10
Nodes (25): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, Badge(), BadgeProps (+17 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (24): JournalUI(), log, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, engine (+16 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.16
Nodes (6): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results, verifyLoadSwaps()

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
Cohesion: 0.17
Nodes (17): clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination(), consumePhoneChargeOncePerTurn() (+9 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (9): ScenarioMapGenerator, TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings() (+1 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.10
Nodes (21): DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent, LegacyBubbleEvent (+13 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.11
Nodes (34): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), MapInterface() (+26 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.10
Nodes (24): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+16 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (42): CharacterCreator(), PlayerSkillsUI(), AITargeting, FactionRegistry, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile() (+34 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (19): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps (+11 more)

### Community 20 - "Game Map Management"
Cohesion: 0.06
Nodes (35): SeededRandom, applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals() (+27 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.17
Nodes (13): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+5 more)

### Community 23 - "Door"
Cohesion: 0.08
Nodes (8): ActionPoints, Health, InventoryContainer, Renderable, SurvivalStats, EntityFactory, npc(), runTest()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (7): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS, equipRifle()

### Community 26 - "Action Queue Processing"
Cohesion: 0.57
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "Combat and Turn Management"
Cohesion: 0.10
Nodes (21): GridSlotProps, ItemContextMenu(), ItemContextMenuProps, SplitDialog(), CameraContext, CameraProvider(), GameMapContext, GameMapProvider() (+13 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.18
Nodes (10): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), TurnProcessingUtils, makeTurret() (+2 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 33 - "Options and Crafting UI"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

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
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (15): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+7 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (36): emptyEvent(), LegacyDialogStep, btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta, createEmptyGrid() (+28 more)

### Community 42 - "toast.tsx"
Cohesion: 0.16
Nodes (10): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, toSlimRoom(), builder, mapData, t0 (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.12
Nodes (16): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+8 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (19): DRONE_ITEM_DEF_IDS, isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank() (+11 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (12): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString(), decompressString(), DEFAULT_PLAYER_STATS (+4 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 50 - "Window and Door Interaction"
Cohesion: 0.08
Nodes (14): VisionSystem, LineOfSight, Quadrant, Row, slope(), hasCorner, map, MockGameMap (+6 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.12
Nodes (10): LootProgression, MapProgression, BaseMapGenerator, LAYOUT, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), map (+2 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.24
Nodes (4): Drone, equipPhone(), freshBattery(), makeAirborneDrone()

### Community 55 - "pagination.tsx"
Cohesion: 0.14
Nodes (13): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO (+5 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.15
Nodes (7): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), ErrorBoundary, GamePage(), NotFound()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 62 - "TestEntity"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.13
Nodes (23): CreditsWindow(), EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), DisplaySlot, formatTimestamp(), LoadGameWindow() (+15 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 66 - "Form UI Components"
Cohesion: 0.06
Nodes (17): AIState, Burnable, Rabbit, SequencerAction, aiComp, ent, npc, player (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.24
Nodes (12): emptyEntityRegistry(), emptyQuestRegistry(), downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, buildFullItem() (+4 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.19
Nodes (15): RcVehicleConfig, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), getAutonomousVehicle(), getRcVehicle(), isWagon() (+7 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.32
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), nestedGrids(), ownGrids()

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
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 85 - "context-menu.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.13
Nodes (22): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+14 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 92 - ".generateFromScenario"
Cohesion: 0.32
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), rollWoundInfectionCure() (+3 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.15
Nodes (4): PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 94 - "DevConsole.tsx"
Cohesion: 0.17
Nodes (11): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS (+3 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.20
Nodes (14): droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge(), getActiveDevice() (+6 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.30
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 100 - "ConfigManager"
Cohesion: 0.24
Nodes (6): ScenarioInfo, ScenarioPickerWindow(), ScenarioPickerWindowProps, electronStorage, idbStorage, ScenarioStorage

### Community 101 - "Table UI Components"
Cohesion: 0.11
Nodes (11): CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), ItemCategory, computeBrainstemStewTreatment(), makeController(), makeReceiver() (+3 more)

### Community 103 - "RabbitAI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 107 - "WeatherManager"
Cohesion: 0.22
Nodes (5): DevConsole(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (5): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set()

### Community 109 - "SeededRandom"
Cohesion: 0.06
Nodes (31): createItemFromDef(), NOTE: do NOT force itemsModified for every container/attachment item., applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), UNARMED_WEAPON, equipBackpack() (+23 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (14): AIBehavior, Consumable, EquippedArmor, Inventory, Item, LightEmitter, MeleeWeapon, Movable (+6 more)

### Community 112 - "Logger"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.07
Nodes (19): AttachmentSlot, AttachmentSlotProps, WeaponModPanel(), WeaponModPanelProps, AccordionContent, AccordionItem, AccordionTrigger, Avatar (+11 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.07
Nodes (31): isGroundPriority(), isPinnedInPlace(), engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., PocketLayouts (+23 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 116 - "toggle-group.tsx"
Cohesion: 0.17
Nodes (3): PlayerSkills, INIT_STATES, EventEmitter

### Community 118 - "verify_loot.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.30
Nodes (6): isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner

### Community 122 - "apEconomy.js"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 123 - "MockGameMap"
Cohesion: 0.23
Nodes (4): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 124 - "verify_phase_2.mjs"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 125 - ".getPocketContainers"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 126 - "ZombieTypes.js"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - ".recordHit"
Cohesion: 0.10
Nodes (3): GameMap, log, runTest()

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.08
Nodes (25): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+17 more)

### Community 133 - "JournalUI.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 134 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.11
Nodes (10): DestroyIntent, NoiseEvent, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem (+2 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.20
Nodes (4): Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

### Community 143 - "accordion.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 144 - "eventMarkers.test.js"
Cohesion: 0.29
Nodes (4): addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 147 - "test_noise_assert.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 148 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **704 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+699 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `rcVehicleMovement.test.js`, `Item Interaction Logic`, `Game Engine Context`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `Shop and Log UI`, `ExplosionSystem.js`, `IntentQueue`, `NPC AI Behavior`, `Tooltip Components`, `Inventory and Skill Windows`, `Entity and Item Types`, `npcLoadout.test.js`, `HUD and Dialog UI`, `eventMarkers.test.js`, `Map Template Generation`, `Turret Combat Logic`, `Map Generation Config`, `EventRunner`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `Asset Image Loader`, `Rendering Optimization Tests`, `Developer Console UI`, `TemplateMapGenerator.js`, `World Object Spawning`, `Map Tile Logic`, `Map Serialization Tests`, `FurniturePlanner.js`, `EntityRenderer.js`, `Weapon Attachment Logic`, `Table UI Components`, `verify_firefighter_spawn.js`, `sheet.tsx`, `verify_loot.js`, `tmp_verify_zombie_loot.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `test_noise_assert.js`, `Crafting Manager Logic`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `Action Intent System` to `._restoreTilesAndEntities`, `AI and Inventory Systems`, `Game Engine Context`, `JournalUI.tsx`, `Shop and Log UI`, `Entity Component System`, `HUD and Dialog UI`, `accordion.tsx`, `Character and Menu Windows`, `alert.tsx`, `test_noise_assert.js`, `scroll-area.tsx`, `Combat and Turn Management`, `Sidebar UI Components`, `Container Grid Logic`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `TestEntity`, `Crafting Recipe Verification`, `Road Generation Logic`, `Toast Notification State`, `DevConsole.tsx`, `context-menu.tsx`, `TollGateSystem`, `RabbitAI`, `.runTurn`, `navigation-menu.tsx`, `Logger`, `EarbucksShopSystem`, `toggle-group.tsx`, `ZombieTypes.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _720 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.10099573257467995 - nodes in this community are weakly interconnected._