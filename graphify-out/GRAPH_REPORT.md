# Graph Report - AndroidBuilder  (2026-08-05)

## Corpus Check
- 500 files · ~6,534,416 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3147 nodes · 8286 edges · 166 communities (107 shown, 59 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `675dd4c5`
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
- Electron Main Process
- EarbucksShopSystem
- verify_firefighter_spawn.js
- tmp_verify_clip.js
- toggle-group.tsx
- EarbucksShopSystem.js
- alert.tsx
- tmp_verify_zombie_loot.js
- apEconomy.js
- tmp_verify_zombie_loot.js
- MockGameMap
- OTP Input Components
- FactionRegistry
- ZombieTypes.js
- rcVehicleMovement.test.js
- API Query Client
- TurretAI.js
- .recordHit
- ._restoreTilesAndEntities
- migrateEvents.js
- npcLoadout.test.js
- Row
- eventMarkers.test.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- tmp_verify_fix.js
- Container.test.js
- verify_army_tent.mjs
- verify_map_gen.js
- MockGameMap
- verify_split_road.js
- Image Cropping Scripts
- WindowTooltip.tsx
- GameEventBus
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 127 edges
2. `Item` - 126 edges
3. `cn()` - 119 edges
4. `GameMap` - 97 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 72 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicle.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (166 total, 59 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.19
Nodes (16): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+8 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.04
Nodes (64): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+56 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (38): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+30 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.22
Nodes (5): getProgressionForMap(), findSouthTransitionTile(), AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (10): AIState, PlayerSkills, INIT_STATES, aiComp, ent, npc, player, rabbit (+2 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.19
Nodes (16): consumeDeployCharge(), droneChargesRemaining(), getActiveRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), canOperate(), deploy() (+8 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.18
Nodes (13): RcVehicleConfig, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice() (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (84): EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+76 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.17
Nodes (16): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, SpeechBubbleInput(), TutorialEndDialog(), TutorialEndDialogProps, DialogContent (+8 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.44
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 19 - "Character and Menu Windows"
Cohesion: 0.07
Nodes (45): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+37 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.26
Nodes (10): getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer(), tryFollowScent() (+2 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (12): DamageIntent, MoveIntent, MapProgression, DEFAULT_PLAYER_STATS, idbStore, AISystem, ScentTrail, gameRandom (+4 more)

### Community 23 - "Door"
Cohesion: 0.06
Nodes (21): DevConsole(), InventoryContainer, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, restoreEntity() (+13 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (22): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+14 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.08
Nodes (14): SpeechBubbleContext, SpeechBubbleProvider(), FactionRegistry, getLightMode(), getSightRangeForHour(), EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already (+6 more)

### Community 27 - "useGame"
Cohesion: 0.17
Nodes (6): log, NOTE: This only moves the camera view, not any entities, logger, Logger, buildMap(), mapWithEdgeWindow()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.18
Nodes (12): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), resolveItemMeta(), TILE_ICON_RANK (+4 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.16
Nodes (9): MAP_GEN_CONFIG, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, SplitRoadGenerator (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.28
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (17): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+9 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+35 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (6): compressString(), decompressString(), GameSaveSystem, runTest(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (6): LineOfSight, Quadrant, Row, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.09
Nodes (23): CompareOp, Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef (+15 more)

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
Nodes (28): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+20 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.30
Nodes (12): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), livingZombies(), nearest(), pct(), playerTurn() (+4 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (9): Rabbit, SequencerAction, map, mockTile, npc, player, rabbit, zombie (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.28
Nodes (4): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 72 - "Toast UI Components"
Cohesion: 0.16
Nodes (18): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+10 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.33
Nodes (10): isTurretPassableBy(), driveBlockedReason(), driveActiveVehicle(), findRcPath(), finishDrive(), makeRcFilter(), materializeGhost(), previewDriveCost() (+2 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.08
Nodes (24): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), equipBackpack(), makeItem(), equipBeltWithPouch() (+16 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 77 - "Item Factory Methods"
Cohesion: 0.06
Nodes (18): GameMap, log, isIndoorFloor(), basicResult, map, mutantResult, player, windowEntity (+10 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.06
Nodes (32): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+24 more)

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
Cohesion: 0.25
Nodes (3): runContainerTests(), KNOWN_FAILURES, results

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (29): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+21 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 93 - "EntityRenderer.js"
Cohesion: 0.24
Nodes (12): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+4 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.54
Nodes (4): isInsideCompound(), isInsideTollGate(), isInStartArea(), ZombieSpawner

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.12
Nodes (5): BranchingRoadGenerator, RoadNetwork, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.12
Nodes (3): PlaceIcon, Item, TestEntity

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.14
Nodes (5): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, getItemName(), getFuelValue()

### Community 103 - "RabbitAI"
Cohesion: 0.05
Nodes (53): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+45 more)

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.05
Nodes (8): CharacterCreator(), PlayerSkillsUI(), DERIVED_CONDITIONS, Entity, get(), set(), CombatResolver, fireManyAtLongRange()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.04
Nodes (22): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Health, Inventory, Item (+14 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.08
Nodes (30): NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, applyExpiration(), applyPower() (+22 more)

### Community 116 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 117 - "EarbucksShopSystem.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 121 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 126 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 127 - "rcVehicleMovement.test.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 128 - "API Query Client"
Cohesion: 0.25
Nodes (7): inputContent, runInspector(), apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "TurretAI.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 132 - "migrateEvents.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "MockGameMap"
Cohesion: 0.21
Nodes (7): CameraProvider(), hasItemsInside(), InventoryProvider(), isClothingOrBackpack(), AttributeProgressionManager, testWallGapFix(), verifyRestoration()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `AI and Inventory Systems`, `Rabbit AI State`, `HUD and Dialog UI`, `Character and Menu Windows`, `Sidebar UI Components`, `EventRunner`, `Line of Sight System`, `Asset Image Loader`, `Rendering Optimization Tests`, `Menubar UI Components`, `Audio Management System`, `TemplateMapGenerator.js`, `App Routing and Scaling`, `RabbitAI`, `.runTurn`, `navigation-menu.tsx`, `Electron Main Process`, `toggle-group.tsx`, `tmp_verify_zombie_loot.js`, `ZombieTypes.js`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `Rendering Optimization Tests`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Map Serialization Tests` to `traits.js`, `Item Interaction Logic`, `.recordHit`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `npcLoadout.test.js`, `Tooltip Components`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `MockGameMap`, `Door`, `Turret Combat Logic`, `Action Queue Processing`, `Combat and Turn Management`, `Dialog and Button UI`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Item Factory Methods`, `.executeTransition`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `SeededRandom`, `EarbucksShopSystem`, `verify_firefighter_spawn.js`, `EarbucksShopSystem.js`, `RoadGenerator`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _714 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.0517503805175038 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.03735632183908046 - nodes in this community are weakly interconnected._