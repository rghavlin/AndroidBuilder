# Graph Report - AndroidBuilder  (2026-08-27)

## Corpus Check
- 564 files · ~7,279,918 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3408 nodes · 9359 edges · 167 communities (128 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f3dd5f06`
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
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- verify_loot_constraints.js
- .generateFromScenario
- Image Cropping Scripts
- MockGameMap
- migrateEvents.js
- NPM Configuration Testing
- stairsTransition.test.js
- bench_houses.mjs
- Electron Preload Script
- mapRestoreParity.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- .addEntity
- test_noise_assert.js
- TestMapBuilder
- MapMetadata.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 179 edges
2. `Item` - 150 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 93 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 54 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (167 total, 39 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.07
Nodes (32): drawImprovedCursor(), lastRainUpdate, playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds, ActionContext (+24 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (40): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InventoryPanel(), PhoneWindow(), TollWindow() (+32 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.17
Nodes (18): consumeDeployCharge(), isWagon(), listRcVehicles(), hasAutonomy(), canOperate(), deploy(), deployedPosition(), focusPointOf() (+10 more)

### Community 6 - "Action Intent System"
Cohesion: 0.14
Nodes (26): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+18 more)

### Community 7 - "CombatResolver"
Cohesion: 0.20
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (33): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, AISystem, CombatSystem, DestructionSystem, ExplosionSystem (+25 more)

### Community 9 - "Entity Component System"
Cohesion: 0.18
Nodes (8): debugLog(), TurnManager, beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.19
Nodes (16): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+8 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.18
Nodes (6): DevConsole(), CameraProvider(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 14 - "Rabbit AI State"
Cohesion: 0.07
Nodes (22): getProgressionForMap(), LootProgression, MapProgression, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig (+14 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (25): NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+17 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.16
Nodes (3): debugLog(), ImageLoader, TILESET_MISSING_TERRAINS

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.20
Nodes (14): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, DragPreviewLayer() (+6 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (9): JournalUI(), applyNpcAIMode(), log, interpolateText(), applyMapRegistries(), SafeEventEmitter, hasScenario, loadScenario() (+1 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.17
Nodes (5): GameMapProvider(), MinHeap, Pathfinding, newMap(), testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (18): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+10 more)

### Community 23 - "Door"
Cohesion: 0.22
Nodes (11): getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer(), tryFollowScent() (+3 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (15): AudioProvider(), DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS (+7 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (11): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.34
Nodes (11): canTogglePhonePower(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), IDLE, processPhoneTurn() (+3 more)

### Community 27 - "useGame"
Cohesion: 0.08
Nodes (16): MAP_GEN_CONFIG, EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, BuildingTypes (+8 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.18
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 31 - "EventRunner"
Cohesion: 0.14
Nodes (9): Drone, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE (+1 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.33
Nodes (8): FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), getScaleMode(), useWindowSize(), WindowSize

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.13
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.16
Nodes (17): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, applyEnergyApCap(), applySurvivalCascade() (+9 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.06
Nodes (61): ActionSlotButton(), BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip() (+53 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (16): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+8 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+36 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.15
Nodes (5): ActionProvider(), recordDefense(), recordHit(), getBrainPulpOverrides(), getBrainstemOverrides()

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (9): MainMenuWindow(), OptionsWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, IndexedDBStore (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.14
Nodes (6): makeWagon(), MOTOR_PAIRS, makeRcWagon(), equipChargedPhone(), makeWagon(), MOTOR_PAIRS

### Community 51 - ".pos"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 55 - "pagination.tsx"
Cohesion: 0.08
Nodes (24): ActionSlotButtonProps, ShopItemRow(), EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps, ItemContextMenuProps (+16 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.33
Nodes (5): CharacterRegistryWindow(), CreditsWindow(), StartMenu(), StartMenuProps, CharacterRegistry

### Community 58 - "Audio Management System"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.27
Nodes (6): gridItems(), hasItemsInside(), chargerContents(), makeTurret(), makeWagonCarrying(), nestedAmmo()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.15
Nodes (13): LeftPanelWindowProps, BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+5 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.15
Nodes (7): MoveIntent, buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.07
Nodes (22): createItemFromDef(), synthesizeZombieVirusCure(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), ensurePhone(), applyItemGrants(), make() (+14 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.18
Nodes (13): EntityRenderer, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+5 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.35
Nodes (11): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (19): CombatContext, CombatProvider(), ExplosionIntent, NOTE: Structural damage (hp reduction, break/open flags) was already, applyHitProgression(), lx(), ly(), NOOP_UI (+11 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.09
Nodes (5): EntityType, PlaceIcon, Item, TestEntity, engine

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
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.12
Nodes (12): EntityFactory, findSouthTransitionTile(), isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, corridorZombieCap() (+4 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 87 - "MusicManager"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage() (+1 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 98 - "TollGateSystem"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "ConfigManager"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 101 - "Table UI Components"
Cohesion: 0.14
Nodes (7): CraftingManager, CraftingRecipes, makeController(), makeReceiver(), WAGONS, hammerRecipe, hatchetRecipe

### Community 103 - "RabbitAI"
Cohesion: 0.48
Nodes (6): deployAndLaunch(), equipPhone(), freshBattery(), litterGround(), makeStowedDrone(), placeRemoteDrone()

### Community 104 - ".runTurn"
Cohesion: 0.06
Nodes (31): ItemCategory, RarityWeights, CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT (+23 more)

### Community 107 - "WeatherManager"
Cohesion: 0.39
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 109 - "SeededRandom"
Cohesion: 0.12
Nodes (12): deriveRoadBands(), MirroredWindingRoadGenerator, deriveRoadBands(), WindingRoadGenerator, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isFloor(), isTerrainDestructible() (+4 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.04
Nodes (33): ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health, Inventory (+25 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (79): MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, ZombieTooltip(), ZombieTooltipProps, AttachmentSlot, AttachmentSlotProps, BeltContainerPanel() (+71 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.50
Nodes (3): equipChargedPhone(), makeTurret(), makeWagon()

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
Cohesion: 0.10
Nodes (11): log, LineOfSight, logger, Quadrant, Row, slope(), Logger, test() (+3 more)

### Community 120 - "TileChunkCache"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 121 - "JournalUI.tsx"
Cohesion: 0.31
Nodes (5): AITargeting, TurretAI, removeDestroyedTurret(), hydratedGridItems(), TurretSystem

### Community 123 - "TurretAI.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 124 - "MoveIntent"
Cohesion: 1.00
Nodes (3): deployDrone(), equipPhone(), freshBattery()

### Community 126 - "rcVehicleMovement.test.js"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.25
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), useIsMobile(), react

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 132 - "._processCurrentStep"
Cohesion: 0.36
Nodes (9): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), hasReceiver(), isLinkedDevice(), isRemoteDevice(), make(), makeAutoWagon(), makePoweredTurret() (+1 more)

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.12
Nodes (11): DialogOverlayProps, DialogStep, InventoryExtensionWindow(), InventoryExtensionWindowProps, MapTransitionDialog(), NPCDemandDialog(), PlayerSkillsWindowProps, SpeechBubbleInput() (+3 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.23
Nodes (5): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, runCycle()

### Community 143 - "verify_loot_constraints.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 145 - ".generateFromScenario"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 152 - "stairsTransition.test.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "bench_houses.mjs"
Cohesion: 0.12
Nodes (23): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+15 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 170 - "test_noise_assert.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 182 - "MapMetadata.js"
Cohesion: 0.07
Nodes (11): Item, MeleeWeapon, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata(), templates (+3 more)

## Knowledge Gaps
- **721 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `AI and Inventory Systems`, `verify_road_template_p3_09.mjs`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `stairsTransition.test.js`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `Options and Crafting UI`, `Road and Town Generation`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `PhoneWindow.tsx`, `Road Generation Logic`, `Toast Notification State`, `JournalUI.tsx`, `FurniturePlanner.js`, `MusicManager`, `MapConnectivityValidator.js`, `TollGateSystem`, `toggle-group.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `react` connect `rcVehicle.test.js` to `AI and Inventory Systems`, `Toast Notification State`, `Tile Rendering and Cache`, `External Dependencies`, `Turret AI Testing`, `.generateFromScenario`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _738 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0726764500349406 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._