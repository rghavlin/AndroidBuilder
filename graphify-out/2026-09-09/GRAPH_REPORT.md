# Graph Report - AndroidBuilder  (2026-09-09)

## Corpus Check
- 570 files · ~7,287,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3440 nodes · 9476 edges · 179 communities (131 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6feed765`
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
- beltSearch.test.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- apEconomy.js
- npcAttackOnSight.test.js
- tmp_verify_loot_summary.js
- tmp_verify_two_zombies.js
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- ScriptedAttack.js
- LeftPanelWindow.tsx
- FactionRegistry
- ._restoreTilesAndEntities
- RoadGenerator
- Image Cropping Scripts
- MockGameMap
- eventMarkersIntegration.test.js
- rcVehicle.test.js
- migrateEvents.js
- NPM Configuration Testing
- npcLoadout.test.js
- bench_houses.mjs
- Electron Preload Script
- index.js
- mapRestoreParity.test.js
- tabs.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_loot.js
- verify_loot_constraints.js
- npcLoadout.test.js
- TestMapBuilder
- ExplosionIntent
- .addEntity

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 192 edges
2. `Item` - 154 edges
3. `cn()` - 125 edges
4. `GameMap` - 109 edges
5. `engine` - 96 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 57 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/autoWagonSleep.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicle.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (179 total, 48 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.18
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (48): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+40 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.10
Nodes (14): ActionContext, log, EquippedArmor, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, SequencerAction (+6 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (37): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+29 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+34 more)

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (33): GameMapProvider(), RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), setDestination() (+25 more)

### Community 7 - "CombatResolver"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.10
Nodes (10): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem (+2 more)

### Community 9 - "Entity Component System"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.10
Nodes (28): DroneConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+20 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.08
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.10
Nodes (10): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, debugLog(), ImageLoader (+2 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (39): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), DisplaySlot, formatTimestamp(), LoadGameWindow(), LoadGameWindowProps (+31 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.12
Nodes (16): PhoneWindow(), engine, INIT_STATES, canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges() (+8 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.12
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.06
Nodes (35): SeededRandom, applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals() (+27 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.18
Nodes (4): floodFill(), MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.25
Nodes (8): getProgressionForMap(), isInsideCompound(), isInsideTollGate(), isInStartArea(), corridorZombieCap(), ZombieSpawner, populate(), populate()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (54): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DefeatDialog(), DoorTooltip() (+46 more)

### Community 27 - "useGame"
Cohesion: 0.05
Nodes (16): MAP_GEN_CONFIG, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator (+8 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.19
Nodes (10): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode() (+2 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.26
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 32 - "Container Grid Logic"
Cohesion: 0.17
Nodes (11): lastRainUpdate, playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., warnedMalformedEntityIds, SpeechBubbleInput(), SpeechBubbleContext, SpeechBubbleProvider() (+3 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.08
Nodes (10): RabbitAI, Burnable, Rabbit, map, mockTile, npc, player, rabbit (+2 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (23): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+15 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 44 - "ImageLoader"
Cohesion: 0.09
Nodes (4): AnimalSpawner, NPCSpawner, WorldManager, runDebug()

### Community 45 - "Asset Image Loader"
Cohesion: 0.15
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 46 - "Turret AI Testing"
Cohesion: 0.14
Nodes (11): OptionsWindow(), GameContextInner(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, IndexedDBStore (+3 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.17
Nodes (6): MoveIntent, NPCTypes, findSouthTransitionTile(), findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 51 - ".pos"
Cohesion: 0.13
Nodes (5): SimulationManager, PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): ItemContextMenuProps, SplitDialog(), ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.11
Nodes (4): EntityType, PlaceIcon, Item, TestEntity

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.16
Nodes (11): isTurretPassableBy(), DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.24
Nodes (12): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+4 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.31
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.20
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.12
Nodes (9): DevConsoleProps, DevConsoleShopManager(), TabType, Input, DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP (+1 more)

### Community 66 - "Form UI Components"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 68 - "Road Generation Logic"
Cohesion: 0.38
Nodes (14): CombatProvider(), removeDestroyedTurret(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack() (+6 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.08
Nodes (26): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., PocketLayouts, CategoryDisplayName, CategoryPriority (+18 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.12
Nodes (18): DRONE_ITEM_DEF_IDS, isRemoteDevice(), EntityRenderer, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity() (+10 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.18
Nodes (13): gridItems(), hasItemsInside(), chargerContents(), collectBatteries(), containerGridOf(), isBattery(), makeTurret(), makeWagonCarrying() (+5 more)

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
Cohesion: 0.24
Nodes (12): getLinkedDeviceUnderfoot(), hasAutonomy(), isLinkedDevice(), listControllables(), listGroundedDevices(), centerOn(), linkDevice(), linkMessage() (+4 more)

### Community 84 - "JournalUI.tsx"
Cohesion: 0.14
Nodes (18): BATTERY_SLOT, DeviceChargeGauge(), DeviceList(), deviceName(), deviceStatus(), PhoneScreen, PhoneScreenContent(), PhoneWindowProps (+10 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.08
Nodes (16): BaseMapGenerator, isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, computeTollGateLayout() (+8 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.18
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.20
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 91 - "apEconomy.js"
Cohesion: 0.67
Nodes (3): doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 93 - "EntityRenderer.js"
Cohesion: 0.26
Nodes (8): logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "TemplateConfig.js"
Cohesion: 0.43
Nodes (5): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 98 - "TollGateSystem"
Cohesion: 0.15
Nodes (19): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, Command, CommandEmpty, CommandGroup (+11 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 101 - "Table UI Components"
Cohesion: 0.14
Nodes (6): CraftingManager, CraftingRecipes, getFuelValue(), computeBrainstemStewTreatment(), hammerRecipe, hatchetRecipe

### Community 103 - "RabbitAI"
Cohesion: 0.19
Nodes (6): applyNpcAIMode(), log, applyItemGrants(), cureInfection(), infectPlayer(), runCycle()

### Community 107 - "WeatherManager"
Cohesion: 0.06
Nodes (37): createItemFromDef(), makeVehicle(), MOTOR_PAIRS, penalty(), make(), makeItems(), deployDrone(), freshBattery() (+29 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.09
Nodes (31): StartModeDialog(), StartModeDialogProps, CameraContext, CameraProvider(), CombatContext, GameContext, GameProvider(), logger (+23 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, Inventory, InventoryContainer, Item, LightEmitter, MeleeWeapon (+7 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (73): MessageReader(), PhoneAppIcon(), GridSlot, GridSlotProps, ItemTooltip(), ItemTooltipProps, WorkspaceSlot, WorkspaceSlotProps (+65 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 117 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.11
Nodes (9): VisionSystem, LineOfSight, Quadrant, Row, slope(), test(), buildMap(), los() (+1 more)

### Community 120 - "TileChunkCache"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.25
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 123 - "TurretAI.js"
Cohesion: 0.17
Nodes (15): FloatingContainerOverlay(), FloatingContainerOverlayProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, WeaponModPanel(), WeaponModPanelProps, useAction() (+7 more)

### Community 124 - "MoveIntent"
Cohesion: 0.39
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.32
Nodes (7): dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemColor(), getBrainstemOverrides(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 130 - "toggle-group.tsx"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.10
Nodes (17): ZombieTooltip(), ZombieTooltipProps, LootProgression, MapProgression, ZombieTypes, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS (+9 more)

### Community 137 - "tmp_verify_two_zombies.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "ScriptedAttack.js"
Cohesion: 0.48
Nodes (6): buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 142 - "LeftPanelWindow.tsx"
Cohesion: 0.33
Nodes (3): InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 148 - "eventMarkersIntegration.test.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.12
Nodes (23): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+15 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 157 - "tabs.tsx"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 175 - "npcLoadout.test.js"
Cohesion: 0.08
Nodes (14): DevConsole(), Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, PERSISTED_KEYS (+6 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 180 - "ExplosionIntent"
Cohesion: 0.23
Nodes (5): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), AttributeProgressionManager

### Community 181 - ".addEntity"
Cohesion: 0.12
Nodes (4): AudioProvider(), GameMap, log, isIndoorFloor()

## Knowledge Gaps
- **723 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+718 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `WeatherManager` to `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `npcAttackOnSight.test.js`, `Action Intent System`, `Tooltip Components`, `Entity Component System`, `Inventory and Skill Windows`, `TestEntity.js`, `Map Template Generation`, `MockGameMap`, `rcVehicle.test.js`, `Game Initialization Manager`, `npcLoadout.test.js`, `Inventory Management System`, `Action Queue Processing`, `useGame`, `bench_houses.mjs`, `Map Generation Config`, `EventRunner`, `Road and Town Generation`, `toast.tsx`, `ImageLoader`, `Asset Image Loader`, `npcLoadout.test.js`, `.pos`, `.addEntity`, `TemplateMapGenerator.js`, `DecorationPlanner.js`, `Crafting Recipe Verification`, `PhoneWindow.tsx`, `Road Generation Logic`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `DevConsole.tsx`, `JournalUI.tsx`, `context-menu.tsx`, `MusicManager`, `Weapon Attachment Logic`, `Table UI Components`, `RabbitAI`, `navigation-menu.tsx`, `React Error Boundaries`, `TurretAI.js`, `rcVehicleMovement.test.js`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `npcAttackOnSight.test.js`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `Action Queue Processing`, `mapRestoreParity.test.js`, `tabs.tsx`, `Sidebar UI Components`, `Crafting Manager Logic`, `Developer Console UI`, `Menubar UI Components`, `PhoneWindow.tsx`, `Form UI Components`, `Toast Notification State`, `Toast UI Components`, `JournalUI.tsx`, `.generateFromScenario`, `DevConsole.tsx`, `TollGateSystem`, `toggle-group.tsx`, `TurretAI.js`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `react`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _740 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.048484848484848485 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.10416666666666667 - nodes in this community are weakly interconnected._