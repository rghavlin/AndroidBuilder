# Graph Report - AndroidBuilder  (2026-09-09)

## Corpus Check
- 567 files · ~7,285,651 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3426 nodes · 9438 edges · 162 communities (119 shown, 43 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c55ae96`
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
- EntityRenderer.js
- Weapon Attachment Logic
- Project Package Metadata
- TollGateSystem
- Building Hallway Tests
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
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- lineOfSight.test.js
- TurretAI.js
- MoveIntent
- rcVehicle.test.js
- addItemToPlayer.test.js
- beltSearch.test.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- apEconomy.js
- npcAttackOnSight.test.js
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- test_noise_assert.js
- Image Cropping Scripts
- MockGameMap
- migrateEvents.js
- NPM Configuration Testing
- bench_houses.mjs
- Electron Preload Script
- mapRestoreParity.test.js
- tabs.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- test_noise_assert.js
- JournalUI.tsx
- verify_loot_constraints.js
- npcLoadout.test.js
- TestMapBuilder
- ExplosionIntent
- .addEntity
- MapMetadata.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 188 edges
2. `Item` - 153 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 95 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 56 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
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

## Communities (162 total, 43 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.19
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (48): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+40 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.17
Nodes (5): computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (38): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindow(), InventoryExtensionWindowProps, InventoryPanel(), LeftPanelWindowProps, TollWindow() (+30 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 6 - "Action Intent System"
Cohesion: 0.06
Nodes (37): RcVehicleConfig, GameEngine, log, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders() (+29 more)

### Community 7 - "CombatResolver"
Cohesion: 0.23
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.15
Nodes (8): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone(), markHeardIfInRange()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (34): DroneConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+26 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.11
Nodes (5): DevConsole(), WeatherManager, MockGameMap, testWallGapFix(), verifyRestoration()

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.06
Nodes (20): Container, isGroundPriority(), isPinnedInPlace(), _warnedCatchAllProps, getMeterPercent(), getWaterPercent(), synthesizeZombieVirusCure(), PocketLayouts (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.09
Nodes (29): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+21 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (24): PhoneWindow(), engine, SimulationManager, canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges() (+16 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.09
Nodes (33): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), DevConsoleProps (+25 more)

### Community 20 - "Game Map Management"
Cohesion: 0.06
Nodes (35): SeededRandom, applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals() (+27 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (41): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+33 more)

### Community 27 - "useGame"
Cohesion: 0.05
Nodes (14): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, ScenarioMapGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, { GameMap } (+6 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (11): getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), asItemInstance(), makeAutoWagon(), makeWagon(), MOTOR_PAIRS (+3 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.07
Nodes (42): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+34 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.05
Nodes (18): AIState, Burnable, Rabbit, SequencerAction, aiComp, ent, npc, player (+10 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.08
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.15
Nodes (17): AttributeCardProps, CompactSkillRowProps, SkillProgressBarProps, PlayerSkillsWindowProps, TooltipContent, applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats() (+9 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.33
Nodes (3): electronStorage, idbStorage, ScenarioStorage

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (45): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+37 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (7): inputContent, runInspector(), ScenarioPickerWindow(), compressString(), decompressString(), runTest(), json

### Community 47 - "Game Engine State"
Cohesion: 0.26
Nodes (11): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+3 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (6): MoveIntent, NPCTypes, findSouthTransitionTile(), findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 51 - ".pos"
Cohesion: 0.10
Nodes (7): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS, equipRifle()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.13
Nodes (10): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, CorridorGenerator, logger (+2 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.29
Nodes (3): PlaceIcon, ENTITY_RESTORERS, restoreEntity()

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.15
Nodes (9): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+1 more)

### Community 58 - "Audio Management System"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 61 - "MapBuilder.js"
Cohesion: 0.08
Nodes (8): getProgressionForMap(), GameInitializationManager, INIT_STATES, EventEmitter, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.10
Nodes (14): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideCompound(), isInsideTollGate(), isInStartArea(), isFloor(), logger (+6 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.26
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 68 - "Road Generation Logic"
Cohesion: 0.11
Nodes (31): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+23 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (35): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+27 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (32): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., EquipmentSlot, getFuelValue(), ItemCategory (+24 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.25
Nodes (3): runContainerTests(), KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.11
Nodes (19): FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem(), resolveItemMeta() (+11 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.13
Nodes (17): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), collectBatteries(), containerGridOf() (+9 more)

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
Cohesion: 0.48
Nodes (6): buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 84 - "JournalUI.tsx"
Cohesion: 0.08
Nodes (26): DevConsoleShopManager(), BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+18 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.11
Nodes (8): LootProgression, MapProgression, BaseMapGenerator, gameRandom, makeSeededRandom(), map, populate(), brokenScopeStats

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.33
Nodes (8): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS

### Community 87 - "MusicManager"
Cohesion: 0.53
Nodes (5): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents()

### Community 93 - "EntityRenderer.js"
Cohesion: 0.11
Nodes (19): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps (+11 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 103 - "RabbitAI"
Cohesion: 0.15
Nodes (5): applyNpcAIMode(), log, infectPlayer(), newMap(), runCycle()

### Community 104 - ".runTurn"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 105 - "LineOfSight.js"
Cohesion: 0.26
Nodes (3): debugLog(), TurnManager, CombatSystem

### Community 107 - "WeatherManager"
Cohesion: 0.06
Nodes (38): createItemFromDef(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem(), equipBeltWithPouch() (+30 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.19
Nodes (19): GameScreenContent(), InfectionHUD(), MapTransitionDialog(), OverlayManager(), SleepModal(), SleepOverlay(), ActionContext, ActionProvider() (+11 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (14): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+6 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (83): AttributeCard(), CompactSkillRow(), SkillProgressBar(), FloatingContainer(), FloatingContainerProps, WeaponModPanel(), WeaponModPanelProps, AccordionContent (+75 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.18
Nodes (5): LineOfSight, Quadrant, Row, slope(), test()

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (4): AudioManager, debugLog(), ConfigManager, MusicManager

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 123 - "TurretAI.js"
Cohesion: 0.16
Nodes (15): FloatingContainerOverlay(), FloatingContainerOverlayProps, GameMapContext, GameMapProvider(), isTurretPassableBy(), getControlMode(), makeRcFilter(), sliceLegByAp() (+7 more)

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 133 - "apEconomy.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.09
Nodes (29): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+21 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 157 - "tabs.tsx"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 170 - "test_noise_assert.js"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 173 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 175 - "npcLoadout.test.js"
Cohesion: 0.07
Nodes (9): Health, PlayerWallet, Position, Renderable, EntityFactory, npc(), emptyTiles(), loadScenario() (+1 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 180 - "ExplosionIntent"
Cohesion: 0.07
Nodes (23): CombatContext, LogContext, LogProvider(), VisualEffectsContext, ExplosionIntent, PlayerSkills, EntityType, ITEM_SERIALIZED_FIELDS (+15 more)

### Community 181 - ".addEntity"
Cohesion: 0.12
Nodes (3): GameMap, log, runTest()

### Community 182 - "MapMetadata.js"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

## Knowledge Gaps
- **721 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `WeatherManager` to `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Tooltip Components`, `Entity Component System`, `Inventory and Skill Windows`, `TestEntity.js`, `Entity and Item Types`, `HUD and Dialog UI`, `Map Template Generation`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `useGame`, `EventRunner`, `Options and Crafting UI`, `Map Editor Tools`, `toast.tsx`, `Game Engine State`, `npcLoadout.test.js`, `.pos`, `ExplosionIntent`, `.addEntity`, `DecorationPlanner.js`, `PhoneWindow.tsx`, `Scenario Map Generation`, `Road Generation Logic`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `JournalUI.tsx`, `context-menu.tsx`, `EntityRenderer.js`, `Weapon Attachment Logic`, `Table UI Components`, `navigation-menu.tsx`, `React Error Boundaries`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `npcAttackOnSight.test.js`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `Game Initialization Manager`, `Action Queue Processing`, `mapRestoreParity.test.js`, `tabs.tsx`, `Sidebar UI Components`, `Road and Town Generation`, `test_noise_assert.js`, `JournalUI.tsx`, `Crafting Manager Logic`, `Menubar UI Components`, `Toast Notification State`, `JournalUI.tsx`, `EntityRenderer.js`, `TollGateSystem`, `toggle-group.tsx`, `TurretAI.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `Crafting Manager Logic`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _738 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.048484848484848485 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.09294199860237597 - nodes in this community are weakly interconnected._