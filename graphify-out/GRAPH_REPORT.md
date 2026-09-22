# Graph Report - AndroidBuilder  (2026-09-22)

## Corpus Check
- 574 files · ~7,291,130 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3467 nodes · 9594 edges · 173 communities (120 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 141 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21c10a45`
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
- TemplateConfig.js
- TollGateSystem
- Building Hallway Tests
- tmp_verify_zombie_loot.js
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
- react
- EarbucksShopSystem
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- lineOfSight.test.js
- TurretAI.js
- MoveIntent
- rcVehicleMovement.test.js
- Drone
- rcVehicle.test.js
- addItemToPlayer.test.js
- conditions.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- ._restoreTilesAndEntities
- npcAttackOnSight.test.js
- alert.tsx
- get
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- Item
- MapConnectivityValidator.js
- MockGameMap
- stairsTransition.test.js
- RoadGenerator
- Image Cropping Scripts
- MockGameMap
- verify_army_tent.js
- markerInteraction.test.js
- migrateEvents.js
- NPM Configuration Testing
- ExplosionIntent
- bench_houses.mjs
- Electron Preload Script
- itemMeters.js
- Row
- Quadrant
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_loot.js
- tmp_verify_loot_summary.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 194 edges
2. `Item` - 156 edges
3. `cn()` - 125 edges
4. `GameMap` - 109 edges
5. `engine` - 99 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 59 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `linkAutonomousWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneGating.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`

## Communities (173 total, 53 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.26
Nodes (10): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+2 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (48): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+40 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (11): AIBehavior, Consumable, Inventory, InventoryContainer, Item, LightEmitter, MeleeWeapon, Position (+3 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (45): BarterWindow(), BarterWindowProps, DevConsole(), EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryExtensionWindow() (+37 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.08
Nodes (46): computeMinimapSize(), emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent (+38 more)

### Community 6 - "Action Intent System"
Cohesion: 0.14
Nodes (20): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+12 more)

### Community 7 - "CombatResolver"
Cohesion: 0.16
Nodes (14): BATTERY_SLOT, DeviceChargeGauge(), DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+6 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (33): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, AISystem, CombatSystem, DestructionSystem, ExplosionSystem (+25 more)

### Community 9 - "Entity Component System"
Cohesion: 0.05
Nodes (50): CharacterCreator(), PlayerSkillsUI(), AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret() (+42 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (30): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+22 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.09
Nodes (7): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.17
Nodes (12): GridSlot, GridSlotProps, HIT_TABLE_DISTANCES, ItemTooltip(), ItemTooltipProps, pct(), SHOWN_MOD_CATEGORIES, getAdjustedBgColor() (+4 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.18
Nodes (17): canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), IDLE (+9 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (40): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+32 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.21
Nodes (14): deviceCharge(), itemCharge(), NO_CHARGE, driveBlockedReason(), getActiveRcVehicle(), getAutonomousVehicle(), isWagon(), listRcVehicles() (+6 more)

### Community 23 - "Door"
Cohesion: 0.10
Nodes (11): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, { GameMap }, { TemplateMapGenerator }, generator (+3 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (3): ScenarioMapGenerator, TemplateMapGenerator, verifyRandomBuildings()

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.05
Nodes (68): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DefeatDialog(), DoorTooltip() (+60 more)

### Community 27 - "useGame"
Cohesion: 0.09
Nodes (29): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+21 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.14
Nodes (14): LeftPanelWindowProps, PlayerSkillsWindowProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProvider(), GridSizeProviderProps (+6 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.32
Nodes (11): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (10): Drone, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), hasReceiver(), addWagon(), DRONE_POS (+2 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 33 - "Options and Crafting UI"
Cohesion: 0.07
Nodes (18): log, log, NOTE: This only moves the camera view, not any entities, MapProgression, INIT_STATES, NOTE: do NOT force itemsModified for every container/attachment item., logger, ZombieReplenishmentSystem (+10 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.19
Nodes (4): NPCTypes, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (10): ActionPoints, EquippedArmor, Health, PlayerWallet, SurvivalStats, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.17
Nodes (6): GameContextInner(), compressString(), decompressString(), runDebug(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.22
Nodes (9): getProgressionForMap(), isInsideCompound(), isInsideTollGate(), isInStartArea(), corridorZombieCap(), ZombieSpawner, populate(), populate() (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.23
Nodes (5): MoveIntent, findSouthTransitionTile(), findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 51 - ".pos"
Cohesion: 0.14
Nodes (4): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.05
Nodes (32): createItemFromDef(), CorridorLootGenerator, makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem(), equipBeltWithPouch() (+24 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.24
Nodes (13): applyEnergyApCap(), applySurvivalCascade(), applyVirusCure(), cureInfection(), deriveSecondaryStats(), infectPlayer(), maxApBonusFromAttributes(), maxHpFromAttributes() (+5 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 66 - "Form UI Components"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (13): ZombieTypes, getTownTurretPositions(), computeTollGateLayout(), TOLLGATE_DEFAULTS, getTurretKeepOutZone(), isInTurretKeepOut(), isPatientZero(), isPatientZeroStepAllowed() (+5 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (40): LootProgression, Container, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs (+32 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.13
Nodes (16): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+8 more)

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
Cohesion: 0.15
Nodes (11): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+3 more)

### Community 84 - "JournalUI.tsx"
Cohesion: 0.15
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 85 - "context-menu.tsx"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.33
Nodes (8): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 94 - "DevConsole.tsx"
Cohesion: 0.30
Nodes (3): LineOfSight, slope(), test()

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.09
Nodes (25): DialogOverlayProps, DialogStep, MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, TradeDialog(), TradeDialogProps (+17 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.21
Nodes (5): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), AttributeProgressionManager

### Community 102 - "WeatherManager"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 103 - "RabbitAI"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.43
Nodes (5): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 107 - "WeatherManager"
Cohesion: 0.22
Nodes (14): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), hasAutonomy(), isLinkedDevice(), isRemoteDevice(), listControllables(), listGroundedDevices(), centerOn() (+6 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.09
Nodes (31): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+23 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.09
Nodes (12): Movable, Renderable, EntityFactory, npc(), door, engineMock, map, moveIntent (+4 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.02
Nodes (89): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, ZombieTooltip(), ZombieTooltipProps (+81 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.39
Nodes (5): GameMapProvider(), describeIfExplored(), describeTile(), GATED_FIELDS, newMap()

### Community 117 - "EarbucksShopSystem"
Cohesion: 0.36
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 123 - "TurretAI.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 130 - "toggle-group.tsx"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.09
Nodes (8): Burnable, Rabbit, map, mockTile, npc, player, rabbit, zombie

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.15
Nodes (4): TEMPLATE_METADATA, BaseMapGenerator, CorridorGenerator, PROFILE

### Community 135 - "alert.tsx"
Cohesion: 0.10
Nodes (5): RpgStats, PlaceIcon, Item, TestEntity, ENTITY_RESTORERS

### Community 137 - "get"
Cohesion: 0.21
Nodes (13): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), getRcVehicle() (+5 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 142 - "MapConnectivityValidator.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 144 - "stairsTransition.test.js"
Cohesion: 0.20
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 147 - "MockGameMap"
Cohesion: 0.05
Nodes (21): GameMap, log, restoreEntity(), PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata(), basicResult, map (+13 more)

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.10
Nodes (10): EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, log, buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack() (+2 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.08
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+22 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **725 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+720 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `CombatResolver`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Action Queue Processing`, `useGame`, `MapBuilder.js`, `Sidebar UI Components`, `Crafting Manager Logic`, `Menubar UI Components`, `PhoneWindow.tsx`, `Form UI Components`, `Toast Notification State`, `Toast UI Components`, `.generateFromScenario`, `EntityRenderer.js`, `TollGateSystem`, `.runTurn`, `toggle-group.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Entity Serialization Tests` to `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Tooltip Components`, `Entity Component System`, `get`, `Inventory and Skill Windows`, `MapConnectivityValidator.js`, `MockGameMap`, `stairsTransition.test.js`, `Entity Spawning and Scent`, `Map Template Generation`, `MockGameMap`, `markerInteraction.test.js`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Action Queue Processing`, `bench_houses.mjs`, `EventRunner`, `Options and Crafting UI`, `Road and Town Generation`, `Line of Sight System`, `toast.tsx`, `Game Engine State`, `.pos`, `DecorationPlanner.js`, `Road Generation Logic`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `DevConsole.tsx`, `JournalUI.tsx`, `Weapon Attachment Logic`, `Table UI Components`, `RabbitAI`, `LineOfSight.js`, `WeatherManager`, `react`, `Logger`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Form UI Components`, `toggle-group.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _742 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.048484848484848485 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06342780026990553 - nodes in this community are weakly interconnected._