# Graph Report - AndroidBuilder  (2026-09-15)

## Corpus Check
- 573 files · ~7,289,055 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3446 nodes · 9510 edges · 170 communities (116 shown, 54 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c460ebe3`
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
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- Item
- MapConnectivityValidator.js
- MockGameMap
- stairsTransition.test.js
- RoadGenerator
- Image Cropping Scripts
- migrateEvents.js
- NPM Configuration Testing
- npcLoadout.test.js
- bench_houses.mjs
- Electron Preload Script
- mapRestoreParity.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- npcLoadout.test.js
- TestMapBuilder
- .addEntity

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 194 edges
2. `Item` - 156 edges
3. `cn()` - 125 edges
4. `GameMap` - 109 edges
5. `engine` - 98 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 59 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `linkAutonomousWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneGating.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (170 total, 54 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.37
Nodes (9): getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer(), tryFollowScent() (+1 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.24
Nodes (8): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.06
Nodes (45): BarterWindow(), BarterWindowProps, InventoryPanel(), LeftPanelWindowProps, PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+37 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+36 more)

### Community 6 - "Action Intent System"
Cohesion: 0.06
Nodes (55): RcVehicleConfig, debugLog(), TurnManager, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders() (+47 more)

### Community 7 - "CombatResolver"
Cohesion: 0.33
Nodes (7): NPCTypes, buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 8 - "Tooltip Components"
Cohesion: 0.05
Nodes (36): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+28 more)

### Community 9 - "Entity Component System"
Cohesion: 0.13
Nodes (17): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), collectBatteries(), containerGridOf() (+9 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (34): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+26 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (20): Container, isGroundPriority(), isPinnedInPlace(), _warnedCatchAllProps, getMeterPercent(), getWaterPercent(), PocketLayouts, testResults (+12 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (8): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, ConfigManager, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.09
Nodes (27): EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps, ItemContextMenu(), ItemContextMenuProps, ItemTooltip() (+19 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (36): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), PhoneScreen, PhoneScreenContent(), PhoneWindow(), PhoneWindowProps (+28 more)

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
Cohesion: 0.16
Nodes (12): getProgressionForMap(), findSouthTransitionTile(), isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, corridorZombieCap() (+4 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.05
Nodes (12): TEMPLATE_METADATA, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, PROFILE, { GameMap }, { TemplateMapGenerator }, generator (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (26): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+18 more)

### Community 27 - "useGame"
Cohesion: 0.11
Nodes (29): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+21 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.29
Nodes (11): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (5): Drone, addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 32 - "Container Grid Logic"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 33 - "Options and Crafting UI"
Cohesion: 0.06
Nodes (18): Burnable, RpgStats, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, PlaceIcon (+10 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.15
Nodes (6): computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (7): Rabbit, map, mockTile, npc, player, rabbit, zombie

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (10): inputContent, runInspector(), ScenarioPickerWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore (+2 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 51 - ".pos"
Cohesion: 0.11
Nodes (6): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.15
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.31
Nodes (8): DeviceChargeGauge(), deviceCharge(), itemCharge(), NO_CHARGE, asItemInstance(), battery(), makeDrone(), makeWagon()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+2 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.08
Nodes (23): createItemFromDef(), synthesizeZombieVirusCure(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), generator, indoorMap (+15 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 65 - "Scenario Map Generation"
Cohesion: 0.14
Nodes (4): GameInitializationManager, runDebug(), MockMap, mockPlayer

### Community 66 - "Form UI Components"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.18
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, builder, mapData, t0, t1 (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.07
Nodes (23): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., EquipmentSlot, getFuelValue() (+15 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.13
Nodes (16): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+8 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.06
Nodes (48): CharacterCreator(), PlayerSkillsUI(), AITargeting, BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys (+40 more)

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

### Community 84 - "JournalUI.tsx"
Cohesion: 0.42
Nodes (8): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.26
Nodes (12): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+4 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 94 - "DevConsole.tsx"
Cohesion: 0.20
Nodes (4): logger, Quadrant, Row, slope()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "TemplateConfig.js"
Cohesion: 0.23
Nodes (6): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, logger

### Community 98 - "TollGateSystem"
Cohesion: 0.11
Nodes (23): InventoryExtensionWindow(), InventoryExtensionWindowProps, MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps (+15 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 103 - "RabbitAI"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.24
Nodes (8): ZombieTooltip(), ZombieTooltipProps, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, ZombieTypes

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (4): DERIVED_CONDITIONS, Entity, get(), set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.05
Nodes (79): DefeatDialog(), EarbucksShopWindow(), GameScreenContent(), drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles (+71 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.03
Nodes (37): DevConsole(), ActionPoints, AIBehavior, Consumable, DamageIntent, EquippedArmor, Health, Inventory (+29 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (78): MessageReader(), PhoneAppIcon(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps (+70 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 117 - "EarbucksShopSystem"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.29
Nodes (3): getSightRangeForHour(), LineOfSight, test()

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.36
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), nestedGrids(), ownGrids()

### Community 123 - "TurretAI.js"
Cohesion: 0.22
Nodes (4): runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 125 - "rcVehicleMovement.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

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
Cohesion: 0.07
Nodes (23): LootProgression, MapProgression, RarityWeights, CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS (+15 more)

### Community 135 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.17
Nodes (6): getNPCType(), applyNpcAIMode(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, runCycle()

### Community 142 - "MapConnectivityValidator.js"
Cohesion: 0.32
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.10
Nodes (26): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+18 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 175 - "npcLoadout.test.js"
Cohesion: 0.22
Nodes (3): getLightMode(), cureInfection(), infectPlayer()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 181 - ".addEntity"
Cohesion: 0.12
Nodes (3): GameMap, log, runTest()

## Knowledge Gaps
- **724 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+719 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `DecorationPlanner.js` to `addItemToPlayer.test.js`, `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `npcAttackOnSight.test.js`, `Action Intent System`, `Tooltip Components`, `Entity Component System`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Template Generation`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `npcLoadout.test.js`, `MapBuilder.js`, `EventRunner`, `Options and Crafting UI`, `Road and Town Generation`, `toast.tsx`, `Game Engine State`, `.pos`, `.addEntity`, `Developer Console UI`, `Entity Serialization Tests`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `MusicManager`, `Weapon Attachment Logic`, `Table UI Components`, `RabbitAI`, `LineOfSight.js`, `navigation-menu.tsx`, `WeatherManager`, `React Error Boundaries`, `npcAttackOnSight.test.js`, `react`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `alert.tsx`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `Action Queue Processing`, `useGame`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `Crafting Manager Logic`, `Menubar UI Components`, `Entity Serialization Tests`, `PhoneWindow.tsx`, `Form UI Components`, `Toast Notification State`, `Toast UI Components`, `.generateFromScenario`, `TollGateSystem`, `.runTurn`, `navigation-menu.tsx`, `React Error Boundaries`, `toggle-group.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Form UI Components`, `toggle-group.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _741 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0496156533892383 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.06409130816505706 - nodes in this community are weakly interconnected._