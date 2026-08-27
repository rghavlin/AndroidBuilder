# Graph Report - AndroidBuilder  (2026-08-27)

## Corpus Check
- 556 files · ~7,275,328 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3377 nodes · 9215 edges · 179 communities (129 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `73f54fc4`
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
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- ._restoreTilesAndEntities
- log
- verify_loot_constraints.js
- npcLoadout.test.js
- .generateFromScenario
- Image Cropping Scripts
- MockGameMap
- index.js
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- stairsTransition.test.js
- bench_houses.mjs
- Electron Preload Script
- Quadrant
- mapRestoreParity.test.js
- test_noise.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- .addEntity
- test_noise_assert.js
- verify_saveload.mjs
- isIndoorFloor
- droneMovement.test.js
- verify_army_tent.js
- tmp_verify_fix.js
- TestMapBuilder
- index.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 169 edges
2. `Item` - 146 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 89 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `useInventory()` - 52 edges
10. `ItemDefs` - 49 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (179 total, 50 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.07
Nodes (14): AIBehavior, Inventory, Movable, EntityFactory, AISystem, npc(), door, engineMock (+6 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.19
Nodes (16): CombatContext, CombatProvider(), ExplosionIntent, applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack() (+8 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.06
Nodes (57): BarterWindow(), BarterWindowProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+49 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (11): getProgressionForMap(), isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, corridorZombieCap(), ZombieSpawner (+3 more)

### Community 6 - "Action Intent System"
Cohesion: 0.18
Nodes (16): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), setDestination(), countTurnsForPath() (+8 more)

### Community 7 - "CombatResolver"
Cohesion: 0.21
Nodes (5): CharacterCreator(), PlayerSkillsUI(), CombatResolver, brokenScopeStats, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.07
Nodes (21): IntentQueue, actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item (+13 more)

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
Cohesion: 0.47
Nodes (8): droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge(), getActiveDevice()

### Community 13 - "Entity and Item Types"
Cohesion: 0.08
Nodes (36): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+28 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.13
Nodes (11): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, EMPTY_CATALOG (+3 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.08
Nodes (23): LootProgression, MapProgression, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+15 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (7): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.08
Nodes (23): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, AttachmentSlot (+15 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.11
Nodes (7): Rabbit, map, mockTile, npc, player, rabbit, zombie

### Community 19 - "Character and Menu Windows"
Cohesion: 0.06
Nodes (44): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), DevConsoleProps (+36 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 23 - "Door"
Cohesion: 0.17
Nodes (13): DamageIntent, getZombieType(), floodFill(), findAttackSlotPath(), getMeleeReach(), isMeleeAttackPosition(), getBeelineIntent(), getGreedyHuntIntent() (+5 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (11): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "MapBuilder.js"
Cohesion: 0.17
Nodes (11): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), FURNITURE_FOOTPRINTS, makeLayoutGrid() (+3 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (4): PlayerSkills, onItemCrafted(), recordDefense(), recordHit()

### Community 31 - "EventRunner"
Cohesion: 0.24
Nodes (9): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), hasReceiver(), addWagon(), DRONE_POS, NEAR_DRONE (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.31
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), infectPlayer(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter() (+3 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.12
Nodes (25): GameScreenContent(), InfectionHUD(), SleepModal(), SleepOverlay(), StartModeDialog(), StartModeDialogProps, GameContext, GameContextInner() (+17 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+35 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (8): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, serializeOrders(), json, runTest()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.53
Nodes (8): canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), consumePhoneChargeOncePerTurn()

### Community 50 - "Window and Door Interaction"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 51 - ".pos"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (18): DroneConfig, consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), listRcVehicles(), canOperate(), deploy(), deployedPosition() (+10 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.09
Nodes (34): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+26 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.33
Nodes (7): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.16
Nodes (12): LeftPanelWindowProps, BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+4 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.10
Nodes (20): GameMapProvider(), isTurretPassableBy(), DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight() (+12 more)

### Community 66 - "Form UI Components"
Cohesion: 0.07
Nodes (13): AIState, Burnable, RpgStats, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS (+5 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.17
Nodes (4): log, NOTE: This only moves the camera view, not any entities, INIT_STATES, EventEmitter

### Community 72 - "Toast UI Components"
Cohesion: 0.07
Nodes (9): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, make() (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.19
Nodes (12): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+4 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.35
Nodes (11): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.08
Nodes (31): MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, BeltContainerPanel(), BeltContainerPanelProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO (+23 more)

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
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.31
Nodes (5): AITargeting, TurretAI, removeDestroyedTurret(), hydratedGridItems(), TurretSystem

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.24
Nodes (4): Drone, equipPhone(), freshBattery(), makeAirborneDrone()

### Community 87 - "MusicManager"
Cohesion: 0.38
Nodes (8): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice(), isRemoteDevice(), make(), makeAutoWagon(), makePoweredTurret(), makeRcWagon()

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 94 - "DevConsole.tsx"
Cohesion: 0.15
Nodes (4): Pathfinding, ScentTrail, testWindowCost(), testCases

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 98 - "TollGateSystem"
Cohesion: 0.09
Nodes (26): DialogOverlayProps, DialogStep, InventoryExtensionWindow(), InventoryExtensionWindowProps, MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialogProps, TradeDialog() (+18 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "ConfigManager"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 103 - "RabbitAI"
Cohesion: 0.31
Nodes (6): gridItems(), hasItemsInside(), chargerContents(), makeTurret(), makeWagonCarrying(), nestedAmmo()

### Community 104 - ".runTurn"
Cohesion: 0.08
Nodes (26): createItemFromDef(), synthesizeZombieVirusCure(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), equipBackpack() (+18 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (4): GameInitializationManager, runDebug(), MockMap, mockPlayer

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 107 - "WeatherManager"
Cohesion: 0.19
Nodes (6): DevConsole(), buildFullItem(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, Consumable, EquippedArmor, Health, InventoryContainer, Item, LightEmitter, MeleeWeapon (+7 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (61): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction (+53 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.06
Nodes (34): NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists. (+26 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 118 - "context-menu.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 119 - "Logger"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 120 - "TileChunkCache"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 121 - "JournalUI.tsx"
Cohesion: 0.22
Nodes (7): aiComp, ent, npc, player, rabbit, restored, zombie

### Community 123 - "TurretAI.js"
Cohesion: 0.10
Nodes (15): SimulationManager, getRcVehicle(), isWagon(), asItemInstance(), UNARMED_WEAPON, makeAutoWagon(), makeWagon(), MOTOR_PAIRS (+7 more)

### Community 124 - "MoveIntent"
Cohesion: 0.14
Nodes (9): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, CorridorGenerator, logger (+1 more)

### Community 125 - "apEconomy.js"
Cohesion: 0.09
Nodes (6): doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, verifyRandomBuildings(), generator

### Community 126 - "rcVehicleMovement.test.js"
Cohesion: 0.40
Nodes (5): useCarousel(), useChart(), useFormField(), useSidebar(), react

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.14
Nodes (9): generator, indoorMap, outdoorMap, { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes (+1 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.24
Nodes (10): hasItemsInside(), InventoryProvider(), isClothingOrBackpack(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), applyVirusCure() (+2 more)

### Community 133 - "apEconomy.js"
Cohesion: 0.18
Nodes (6): JournalUI(), interpolateText(), applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.11
Nodes (13): log, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, log, buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack() (+5 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.14
Nodes (9): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone() (+1 more)

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.36
Nodes (4): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.18
Nodes (4): getNPCType(), applyNpcAIMode(), NPCAISystem, runCycle()

### Community 142 - "log"
Cohesion: 0.13
Nodes (20): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+12 more)

### Community 143 - "verify_loot_constraints.js"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.19
Nodes (10): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), toSlimRoom() (+2 more)

### Community 155 - "Quadrant"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 157 - "test_noise.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 170 - "test_noise_assert.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 171 - "verify_saveload.mjs"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 173 - "droneMovement.test.js"
Cohesion: 1.00
Nodes (3): deployDrone(), equipPhone(), freshBattery()

### Community 175 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **718 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+713 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `AI and Inventory Systems`, `apEconomy.js`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Sidebar UI Components`, `test_noise.js`, `Container Grid Logic`, `Crafting Manager Logic`, `Window and Door Interaction`, `pagination.tsx`, `Menubar UI Components`, `PhoneWindow.tsx`, `App Routing and Scaling`, `JournalUI.tsx`, `MapConnectivityValidator.js`, `TollGateSystem`, `navigation-menu.tsx`, `toggle-group.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `.runTurn` to `addItemToPlayer.test.js`, `Item Interaction Logic`, `Game Engine Context`, `._processCurrentStep`, `AI and Inventory Systems`, `NPC AI Behavior`, `apEconomy.js`, `ExplosionSystem.js`, `npcAttackOnSight.test.js`, `Action Intent System`, `Tooltip Components`, `TestEntity.js`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `npcLoadout.test.js`, `index.js`, `Game Initialization Manager`, `Turret Combat Logic`, `Inventory Management System`, `bench_houses.mjs`, `Quadrant`, `stairsTransition.test.js`, `EventRunner`, `Line of Sight System`, `Map Editor Tools`, `toast.tsx`, `verify_saveload.mjs`, `droneMovement.test.js`, `DevConsole.tsx`, `.pos`, `Developer Console UI`, `Road Generation Logic`, `Toast UI Components`, `World Object Spawning`, `Map Serialization Tests`, `App Routing and Scaling`, `FurniturePlanner.js`, `MusicManager`, `Weapon Attachment Logic`, `Table UI Components`, `RabbitAI`, `WeatherManager`, `verify_firefighter_spawn.js`, `TurretAI.js`, `apEconomy.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _734 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06968641114982578 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._