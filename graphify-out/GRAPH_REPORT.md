# Graph Report - AndroidBuilder  (2026-08-25)

## Corpus Check
- 542 files · ~7,267,043 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3329 nodes · 8982 edges · 146 communities (105 shown, 41 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95813ff9`
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
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- ZombieTypes.js
- API Query Client
- .recordHit
- ._restoreTilesAndEntities
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- Image Cropping Scripts
- MockGameMap
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
1. `createItemFromDef()` - 158 edges
2. `Item` - 138 edges
3. `cn()` - 119 edges
4. `GameMap` - 106 edges
5. `engine` - 86 edges
6. `Entity` - 86 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 62 edges
9. `useInventory()` - 50 edges
10. `GameHarness` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcPathingBudget.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicle.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (146 total, 41 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.09
Nodes (29): ScreenScaler(), ScreenScalerProps, AttachmentSlot, AttachmentSlotProps, BeltContainerPanel(), BeltContainerPanelProps, FloatingContainerOverlay(), FloatingContainerOverlayProps (+21 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.19
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.13
Nodes (29): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+21 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.10
Nodes (17): getProgressionForMap(), MapProgression, INIT_STATES, findSouthTransitionTile(), isInsideCompound(), isInsideTollGate(), isInStartArea(), isFloor() (+9 more)

### Community 6 - "Action Intent System"
Cohesion: 0.10
Nodes (10): compare(), evalAll(), evalCondition(), isEventActive(), interpolateText(), applyMapRegistries(), QuestState, hasScenario (+2 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (13): getLightMode(), getSightRangeForHour(), EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, buildMarker(), computeDesiredMarkers(), isMarker() (+5 more)

### Community 9 - "Entity Component System"
Cohesion: 0.22
Nodes (17): CombatContext, CombatProvider(), removeDestroyedTurret(), ExplosionIntent, applyHitProgression(), lx(), ly(), NOOP_UI (+9 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (38): GameMapContext, GameMapProvider(), isTurretPassableBy(), RcVehicleConfig, isTerrainWalkable(), clearOrder(), estimateTurns(), getOrder() (+30 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.04
Nodes (26): MAP_GEN_CONFIG, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, CorridorGenerator, LAYOUT (+18 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.20
Nodes (9): RarityWeights, CorridorLootGenerator, isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES (+1 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (53): GameScreenContent(), InfectionHUD(), drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded. (+45 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.08
Nodes (27): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+19 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (47): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+39 more)

### Community 20 - "Game Map Management"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.07
Nodes (24): RabbitAI, DamageIntent, MoveIntent, getNPCType(), getZombieType(), ZombieTypes, doorsForBuilding(), floodFill() (+16 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (18): ActionContext, ActionProvider(), VisualEffectsContext, dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemColor(), getBrainstemOverrides(), getBrainstemStewColors() (+10 more)

### Community 23 - "Door"
Cohesion: 0.05
Nodes (25): Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata(), AISystem (+17 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "Combat and Turn Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 31 - "EventRunner"
Cohesion: 0.07
Nodes (21): IntentQueue, actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item (+13 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+2 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.06
Nodes (29): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty() (+21 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.12
Nodes (4): EventRunner, resolveMapEvents(), cureInfection(), infectPlayer()

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+35 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (19): DRONE_ITEM_DEF_IDS, isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank() (+11 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.17
Nodes (8): inputContent, runInspector(), ScenarioPickerWindow(), compressString(), decompressString(), runDebug(), json, runTest()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.09
Nodes (15): log, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), LineOfSight, logger, Quadrant (+7 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.20
Nodes (10): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS, computeTollGateLayout() (+2 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.07
Nodes (37): DroneConfig, Drone, debugLog(), TurnManager, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice() (+29 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.05
Nodes (33): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+25 more)

### Community 62 - "TestEntity"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.20
Nodes (14): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, DragPreviewLayer() (+6 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.16
Nodes (4): SimulationManager, applyNpcAIMode(), VisionSystem, runCycle()

### Community 66 - "Form UI Components"
Cohesion: 0.07
Nodes (5): AIState, Burnable, RpgStats, Rabbit, SequencerAction

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.23
Nodes (9): FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid(), buildPlanGrid() (+1 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 75 - "Map Serialization Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 76 - "App Routing and Scaling"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.33
Nodes (6): btnStyle(), inputStyle, LootAmount, LootGeneratorModal(), LootGeneratorModalProps, LootGeneratorMode

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
Cohesion: 0.16
Nodes (4): log, NOTE: This only moves the camera view, not any entities, GameSaveSystem, IndexedDBStore

### Community 85 - "context-menu.tsx"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.12
Nodes (23): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+15 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.43
Nodes (5): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 91 - "apEconomy.js"
Cohesion: 0.20
Nodes (8): deriveRoadBands(), MirroredWindingRoadGenerator, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 94 - "DevConsole.tsx"
Cohesion: 0.33
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), react

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.07
Nodes (29): InventoryExtensionWindowProps, JournalUI(), MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, OverlayManager(), PlayerSkillsWindowProps (+21 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 107 - "WeatherManager"
Cohesion: 0.19
Nodes (6): DevConsole(), buildFullItem(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (5): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set(), restoreEntity()

### Community 109 - "SeededRandom"
Cohesion: 0.06
Nodes (17): GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, deployDrone(), equipPhone(), freshBattery(), addWagon(), DRONE_POS, NEAR_DRONE (+9 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.04
Nodes (20): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, Inventory, InventoryContainer, Item (+12 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (72): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AccordionContent, AccordionItem (+64 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.06
Nodes (38): LootProgression, NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs (+30 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.14
Nodes (8): PlayerSkills, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 126 - "ZombieTypes.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - ".recordHit"
Cohesion: 0.08
Nodes (5): AudioProvider(), GameMap, log, isIndoorFloor(), testCases

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.04
Nodes (59): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+51 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.08
Nodes (19): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, buildScriptedAttackAction() (+11 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.15
Nodes (4): PlaceIcon, Item, TestEntity, ENTITY_RESTORERS

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **714 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+709 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `traits.js`, `Container Grid Logic`, `TollGateSystem`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `Road Generation Logic`, `navigation-menu.tsx`, `Crafting Manager Logic`, `Item Factory Methods`, `.generateFromScenario`, `Character and Menu Windows`, `DevConsole.tsx`, `toggle-group.tsx`, `context-menu.tsx`, `Menubar UI Components`, `TemplateMapGenerator.js`, `Sidebar UI Components`, `Crafting Recipe Verification`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `DevConsole.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Tile Rendering and Cache` to `traits.js`, `Item Interaction Logic`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `Action Intent System`, `Shop and Log UI`, `ExplosionSystem.js`, `Entity Component System`, `NPC AI Behavior`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Template Generation`, `MockGameMap`, `Game Initialization Manager`, `Door`, `Inventory Management System`, `EventRunner`, `Map Editor Tools`, `toast.tsx`, `Asset Image Loader`, `Rendering Optimization Tests`, `Developer Console UI`, `TemplateMapGenerator.js`, `Form UI Components`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Table UI Components`, `.runTurn`, `WeatherManager`, `SeededRandom`, `verify_firefighter_spawn.js`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _730 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08974358974358974 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._