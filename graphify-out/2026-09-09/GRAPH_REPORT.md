# Graph Report - AndroidBuilder  (2026-09-08)

## Corpus Check
- 565 files · ~7,281,156 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3416 nodes · 9396 edges · 184 communities (131 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `872bb27d`
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
- CombatResolver
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
- MapBuilder.js
- Sidebar UI Components
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
- .pos
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
- DecorationPlanner.js
- Crafting Recipe Verification
- PhoneWindow.tsx
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
- JournalUI.tsx
- context-menu.tsx
- FurniturePlanner.js
- MusicManager
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
- .isEdgeBlocked
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- runContainerTests
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- lineOfSight.test.js
- TurretAI.js
- MoveIntent
- apEconomy.js
- rcVehicleMovement.test.js
- rcVehicle.test.js
- addItemToPlayer.test.js
- beltSearch.test.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- apEconomy.js
- npcAttackOnSight.test.js
- tmp_verify_fix.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- AudioSystem
- test_noise_assert.js
- verify_saveload.mjs
- drawer.tsx
- Image Cropping Scripts
- MockGameMap
- GameMapRestore.js
- tmp_verify_clip.js
- migrateEvents.js
- NPM Configuration Testing
- stairsTransition.test.js
- bench_houses.mjs
- Electron Preload Script
- ErrorBoundary
- mapRestoreParity.test.js
- tabs.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- .addEntity
- test_noise_assert.js
- JournalUI.tsx
- alert.tsx
- verify_loot_constraints.js
- DroneSystem.js
- npcLoadout.test.js
- TestMapBuilder
- accordion.tsx
- avatar.tsx
- badge.tsx
- ExplosionIntent
- .addEntity
- MapMetadata.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 183 edges
2. `Item` - 151 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 94 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 55 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcPathingBudget.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`

## Communities (184 total, 53 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.23
Nodes (11): getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+3 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.17
Nodes (6): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (22): BarterWindow(), BarterWindowProps, InventoryPanel(), LeftPanelWindowProps, PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+14 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.18
Nodes (23): PhoneWindow(), canTogglePhonePower(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), IDLE (+15 more)

### Community 6 - "Action Intent System"
Cohesion: 0.23
Nodes (13): clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination(), countTurnsForPath() (+5 more)

### Community 7 - "CombatResolver"
Cohesion: 0.10
Nodes (23): CharacterCreator(), PlayerSkillsUI(), CombatProvider(), removeDestroyedTurret(), dropZombieDeathLoot(), debugLog(), TurnManager, CombatResolver (+15 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (9): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone() (+1 more)

### Community 9 - "Entity Component System"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.31
Nodes (11): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+3 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.15
Nodes (6): DevConsole(), CameraProvider(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 14 - "Rabbit AI State"
Cohesion: 0.14
Nodes (4): BaseMapGenerator, gameRandom, makeSeededRandom(), brokenScopeStats

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.06
Nodes (30): ItemTooltipProps, Container, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+22 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.10
Nodes (25): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+17 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (33): UniversalGridProps, ActionContext, AudioContext, CombatContext, LogContext, logger, PlayerContext, NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame (+25 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.09
Nodes (40): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+32 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.22
Nodes (7): EarbucksShopWindowProps, ShopItemRowProps, DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 23 - "Door"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (8): ActionPoints, PlayerWallet, Position, Renderable, Vision, EntityFactory, npc(), runTest()

### Community 26 - "Action Queue Processing"
Cohesion: 0.09
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 27 - "useGame"
Cohesion: 0.05
Nodes (13): CorridorGenerator, RoadGenerator, ScenarioMapGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, PROFILE, { GameMap }, { TemplateMapGenerator } (+5 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.15
Nodes (5): Drone, addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 29 - "Sidebar UI Components"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 31 - "EventRunner"
Cohesion: 0.26
Nodes (13): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), hasReceiver(), isLinkedDevice() (+5 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.11
Nodes (22): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+14 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.08
Nodes (10): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+2 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.35
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), sicknessPenalties() (+2 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.09
Nodes (45): EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+37 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.06
Nodes (54): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle, builtinStanceValue(), emptyEntityRegistry(), emptyEvent() (+46 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), AttributeProgressionManager

### Community 46 - "Turret AI Testing"
Cohesion: 0.23
Nodes (5): inputContent, runInspector(), compressString(), decompressString(), json

### Community 47 - "Game Engine State"
Cohesion: 0.22
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.05
Nodes (42): createItemFromDef(), ensurePhone(), applyItemGrants(), equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem(), makeItems() (+34 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.18
Nodes (5): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 51 - ".pos"
Cohesion: 0.13
Nodes (4): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.12
Nodes (13): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, getBrainstemColor(), getBrainstemStewColors() (+5 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.26
Nodes (16): GameMapContext, GameMapProvider(), isTurretPassableBy(), isTerrainWalkable(), findRcPath(), makeRcFilter(), driveBlockedReason(), getActiveRcVehicle() (+8 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.14
Nodes (7): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), clothingKeys, lootGen, subtypes

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.28
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.19
Nodes (12): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen, PhoneScreenContent() (+4 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.08
Nodes (24): RarityWeights, CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+16 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.09
Nodes (6): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.19
Nodes (12): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+4 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.08
Nodes (34): BUILTIN_FACTIONS, BUILTIN_STANCES, cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry, FACTIONS (+26 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

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
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 84 - "JournalUI.tsx"
Cohesion: 0.09
Nodes (17): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+9 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.11
Nodes (15): getProgressionForMap(), LootProgression, MapProgression, INIT_STATES, isInsideCompound(), isInsideTollGate(), isInStartArea(), logger (+7 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.33
Nodes (8): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS

### Community 92 - ".generateFromScenario"
Cohesion: 0.13
Nodes (17): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps (+9 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.12
Nodes (17): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), EquipmentSlot, EquipmentSlotProps, SLOT_INFO, FloatingContainerOverlay(), GridSlot (+9 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.12
Nodes (13): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+5 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.14
Nodes (18): DialogOverlayProps, DialogStep, InventoryExtensionWindow(), InventoryExtensionWindowProps, MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps (+10 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 105 - "LineOfSight.js"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 107 - "WeatherManager"
Cohesion: 0.11
Nodes (12): RcVehicleConfig, makeVehicle(), MOTOR_PAIRS, penalty(), makeWagon(), MOTOR_PAIRS, makeController(), makeReceiver() (+4 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (13): AIBehavior, Consumable, DamageIntent, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+5 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.07
Nodes (35): TradeDialog(), TradeDialogProps, ClothingContainerPanel(), ClothingContainerPanelProps, logger, AlertDialogAction, AlertDialogCancel, AlertDialogContent (+27 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.19
Nodes (10): AITargeting, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), logger, Quadrant (+2 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 123 - "TurretAI.js"
Cohesion: 0.07
Nodes (19): ZombieTooltip(), ZombieTooltipProps, AttachmentSlot, AttachmentSlotProps, FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, Checkbox (+11 more)

### Community 125 - "apEconomy.js"
Cohesion: 0.16
Nodes (10): ItemContextMenuProps, isWagon(), listRcVehicles(), deploy(), getActiveGroundedDevice(), stow(), asItemInstance(), makeWagon() (+2 more)

### Community 126 - "rcVehicleMovement.test.js"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 130 - "toggle-group.tsx"
Cohesion: 0.18
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 133 - "apEconomy.js"
Cohesion: 0.17
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 135 - "tmp_verify_fix.js"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "verify_saveload.mjs"
Cohesion: 0.25
Nodes (7): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TREATMENT_EFFECTS

### Community 145 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 148 - "GameMapRestore.js"
Cohesion: 0.29
Nodes (3): PlaceIcon, ENTITY_RESTORERS, restoreEntity()

### Community 149 - "tmp_verify_clip.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "stairsTransition.test.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "bench_houses.mjs"
Cohesion: 0.07
Nodes (35): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN (+27 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 157 - "tabs.tsx"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 169 - ".addEntity"
Cohesion: 0.13
Nodes (16): hasItemsInside(), InventoryContext, InventoryProvider(), isClothingOrBackpack(), logger, CraftingRecipes, getItemName(), applyExpiration() (+8 more)

### Community 170 - "test_noise_assert.js"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 172 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 173 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 174 - "DroneSystem.js"
Cohesion: 0.60
Nodes (3): consumeHoverCharge(), land(), DroneSystem

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 178 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 179 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 181 - ".addEntity"
Cohesion: 0.11
Nodes (3): GameMap, log, runTest()

### Community 182 - "MapMetadata.js"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

## Knowledge Gaps
- **721 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `DevConsole.tsx` to `Item Interaction Logic`, `Game Engine Context`, `NPC AI Behavior`, `npcAttackOnSight.test.js`, `CombatResolver`, `Tooltip Components`, `Rabbit AI State`, `HUD and Dialog UI`, `Map Template Generation`, `MockGameMap`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `useGame`, `MapBuilder.js`, `EventRunner`, `Tile Rendering and Cache`, `Line of Sight System`, `.addEntity`, `Map Editor Tools`, `toast.tsx`, `DroneSystem.js`, `npcLoadout.test.js`, `.pos`, `Developer Console UI`, `.addEntity`, `DecorationPlanner.js`, `Scenario Map Generation`, `Carousel UI Components`, `World Object Spawning`, `Map Tile Logic`, `Map Serialization Tests`, `JournalUI.tsx`, `context-menu.tsx`, `EntityRenderer.js`, `Weapon Attachment Logic`, `Table UI Components`, `WeatherManager`, `apEconomy.js`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `NPC AI Behavior`, `tmp_verify_fix.js`, `verify_road_template_p3_09.mjs`, `HUD and Dialog UI`, `verify_saveload.mjs`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `drawer.tsx`, `Game Initialization Manager`, `stairsTransition.test.js`, `Action Queue Processing`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `tabs.tsx`, `Tile Rendering and Cache`, `test_noise_assert.js`, `JournalUI.tsx`, `alert.tsx`, `Crafting Manager Logic`, `accordion.tsx`, `avatar.tsx`, `badge.tsx`, `Menubar UI Components`, `PhoneWindow.tsx`, `Toast Notification State`, `.generateFromScenario`, `EntityRenderer.js`, `MapConnectivityValidator.js`, `TollGateSystem`, `toggle-group.tsx`, `toggle-group.tsx`, `TurretAI.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `MapConnectivityValidator.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _738 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.11587301587301588 - nodes in this community are weakly interconnected._