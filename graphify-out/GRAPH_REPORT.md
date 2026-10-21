# Graph Report - AndroidBuilder  (2026-10-20)

## Corpus Check
- 582 files · ~7,297,733 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3498 nodes · 9698 edges · 181 communities (132 shown, 49 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c589779`
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
- apEconomy.js
- RoadGenerator
- Image Cropping Scripts
- MockGameMap
- verify_army_tent.js
- markerInteraction.test.js
- migrateEvents.js
- NPM Configuration Testing
- bench_houses.mjs
- Electron Preload Script
- itemMeters.js
- Row
- npcAttackOnSight.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_loot.js
- tmp_verify_loot_summary.js
- vehicleCharger.test.js
- bench_houses.mjs
- alert.tsx
- get
- computeMinimapSize
- TestMapBuilder
- verify_saveload.mjs
- MapConnectivityValidator.js
- npcLoadout.test.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 197 edges
2. `Item` - 157 edges
3. `cn()` - 125 edges
4. `GameMap` - 110 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 65 edges
9. `GameHarness` - 60 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/autoWagonSleep.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/deviceFocusPoint.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (181 total, 49 thin omitted)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.09
Nodes (8): ActionPoints, AIBehavior, InventoryContainer, PlayerWallet, EntityFactory, AISystem, npc(), runTest()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (42): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), LeftPanelWindowProps, BATTERY_SLOT, DeviceChargeGauge(), DeviceList() (+34 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (47): EDITOR_GENERATOR_CHOICES, DEFAULT_PLAYER_CLOTHING, defaultPlayerLoadout(), emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents() (+39 more)

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (32): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+24 more)

### Community 7 - "CombatResolver"
Cohesion: 0.18
Nodes (6): CharacterCreator(), PlayerSkillsUI(), CombatResolver, buildScriptedAttackAction(), resolveAttackMode(), fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 9 - "Entity Component System"
Cohesion: 0.05
Nodes (15): Consumable, EquippedArmor, Health, Inventory, Item, LightEmitter, MeleeWeapon, Movable (+7 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.08
Nodes (31): DroneConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+23 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.21
Nodes (5): DevConsole(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (18): Container, isGroundPriority(), isPinnedInPlace(), _warnedCatchAllProps, getMeterPercent(), getWaterPercent(), synthesizeZombieVirusCure(), PocketLayouts (+10 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.10
Nodes (18): getProgressionForMap(), LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, getBrainstemColor() (+10 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.18
Nodes (20): canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), IDLE (+12 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps (+17 more)

### Community 20 - "Game Map Management"
Cohesion: 0.06
Nodes (35): SeededRandom, applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals() (+27 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.20
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 23 - "Door"
Cohesion: 0.13
Nodes (14): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, FURNITURE_FOOTPRINTS, hasSpecialFurnitureLayout(), LAYOUTS (+6 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (26): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+18 more)

### Community 27 - "useGame"
Cohesion: 0.07
Nodes (36): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+28 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage() (+1 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.10
Nodes (18): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+10 more)

### Community 31 - "EventRunner"
Cohesion: 0.26
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 32 - "Container Grid Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 33 - "Options and Crafting UI"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.16
Nodes (15): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+7 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.22
Nodes (3): AnimalSpawner, NPCSpawner, runDebug()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 40 - "Line of Sight System"
Cohesion: 0.13
Nodes (3): EventRunner, applyItemGrants(), infectPlayer()

### Community 41 - "Map Editor Tools"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.20
Nodes (11): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+3 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (8): CreditsWindow(), MainMenuWindow(), OptionsWindow(), StartMenu(), MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, IndexedDBStore

### Community 47 - "Game Engine State"
Cohesion: 0.50
Nodes (4): btnStyle(), GenerateTemplateModal(), GenerateTemplateModalProps, EDITOR_TEMPLATE_CHOICES

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 51 - ".pos"
Cohesion: 0.15
Nodes (4): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.14
Nodes (20): findSouthTransitionTile(), getTownTurretPositions(), isInsideCompound(), isInsideTollGate(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, getTurretKeepOutZone() (+12 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.23
Nodes (9): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), collectBatteries(), containerGridOf(), isBattery() (+1 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.26
Nodes (8): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.11
Nodes (23): FloatingContainerOverlay(), ItemContextMenu(), ItemContextMenuProps, SplitDialog(), ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel (+15 more)

### Community 66 - "Form UI Components"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 68 - "Road Generation Logic"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (21): NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., EquipmentSlot (+13 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.19
Nodes (3): hasItemsInside(), isClothingOrBackpack(), verifyLoadSwaps()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (10): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone() (+2 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.12
Nodes (14): inputContent, runInspector(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, apiRequest() (+6 more)

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
Cohesion: 0.05
Nodes (25): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+17 more)

### Community 84 - "JournalUI.tsx"
Cohesion: 0.11
Nodes (18): RarityWeights, CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+10 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.13
Nodes (9): debugLog(), TurnManager, beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH (+1 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.36
Nodes (7): deviceCharge(), itemCharge(), NO_CHARGE, asItemInstance(), battery(), makeDrone(), makeWagon()

### Community 90 - "Weather Management System"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 91 - "apEconomy.js"
Cohesion: 0.23
Nodes (9): FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid(), buildPlanGrid() (+1 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 93 - "EntityRenderer.js"
Cohesion: 0.26
Nodes (4): MoveIntent, findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 94 - "DevConsole.tsx"
Cohesion: 0.24
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.18
Nodes (14): AttributeProgressionManager, applyEnergyApCap(), applySurvivalCascade(), applyVirusCure(), cureInfection(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes() (+6 more)

### Community 102 - "WeatherManager"
Cohesion: 0.07
Nodes (11): ItemCategory, NOTE: do NOT force itemsModified for every container/attachment item., BaseMapGenerator, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), map (+3 more)

### Community 103 - "RabbitAI"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 104 - ".runTurn"
Cohesion: 0.09
Nodes (30): createItemFromDef(), make(), makeItems(), deployDrone(), freshBattery(), linkAutonomousWagon(), arm(), deployDrone() (+22 more)

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.13
Nodes (21): BeltContainerPanel(), BeltContainerPanelProps, FloatingContainer(), FloatingContainerProps, GridSlot, GridSlotProps, getAdjustedBgColor(), UniversalGrid() (+13 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (3): DERIVED_CONDITIONS, Entity, set()

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.38
Nodes (8): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice(), isRemoteDevice(), make(), makeAutoWagon(), makePoweredTurret(), makeRcWagon()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.04
Nodes (62): GameControlsProps, STAT_COLORS, StatBar, StatBarProps, JournalUI(), AttributeCard(), AttributeCardProps, CompactSkillRow() (+54 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (4): PlayerSkills, onItemCrafted(), recordDefense(), recordHit()

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 123 - "TurretAI.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 124 - "MoveIntent"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 125 - "rcVehicleMovement.test.js"
Cohesion: 0.18
Nodes (18): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+10 more)

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.32
Nodes (13): removeDestroyedTurret(), dropZombieDeathLoot(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack() (+5 more)

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.06
Nodes (12): AIState, Burnable, RpgStats, Rabbit, SequencerAction, aiComp, ent, npc (+4 more)

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 135 - "alert.tsx"
Cohesion: 0.05
Nodes (8): Door, GarageDoor, PlaceIcon, Item, TestEntity, Window, ENTITY_RESTORERS, restoreEntity()

### Community 137 - "get"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "Item"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 142 - "MapConnectivityValidator.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 143 - "MockGameMap"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 144 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 148 - "verify_army_tent.js"
Cohesion: 0.07
Nodes (50): GameControls(), GameScreenContent(), InfectionHUD(), InventoryExtensionWindow(), InventoryExtensionWindowProps, drawImprovedCursor(), lastRainUpdate, MapCanvas() (+42 more)

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.06
Nodes (37): StartModeDialog(), StartModeDialogProps, ActionContext, CombatContext, GameContext, logger, NOTE: do NOT sync `condition` here — it is a DERIVED getter, and, logger (+29 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.12
Nodes (22): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+14 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.53
Nodes (4): PhoneScreenContent(), getPhoneMessage(), PHONE_MESSAGES, RENDERABLE_TYPES

### Community 156 - "Row"
Cohesion: 0.40
Nodes (4): carryOverAuthoredTiles(), CarryOverResult, CarryTile, tile()

### Community 169 - "tmp_verify_loot.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 171 - "vehicleCharger.test.js"
Cohesion: 0.40
Nodes (4): makeBattery(), makeWagon(), makeWagonWithPowerCells(), stowedCharge()

### Community 172 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 173 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

## Knowledge Gaps
- **731 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+726 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `Character and Menu Windows`, `verify_army_tent.js`, `Action Queue Processing`, `useGame`, `Sidebar UI Components`, `Container Grid Logic`, `Options and Crafting UI`, `Map Editor Tools`, `alert.tsx`, `Turret AI Testing`, `Menubar UI Components`, `PhoneWindow.tsx`, `Form UI Components`, `Toast UI Components`, `Weather Management System`, `.generateFromScenario`, `TollGateSystem`, `navigation-menu.tsx`, `toggle-group.tsx`, `react`, `lineOfSight.test.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `.runTurn` to `traits.js`, `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `._processCurrentStep`, `Tooltip Components`, `get`, `Inventory and Skill Windows`, `TestEntity.js`, `MapConnectivityValidator.js`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Template Generation`, `MockGameMap`, `verify_army_tent.js`, `markerInteraction.test.js`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `Map Generation Config`, `EventRunner`, `Dialog and Button UI`, `Road and Town Generation`, `Line of Sight System`, `toast.tsx`, `vehicleCharger.test.js`, `Window and Door Interaction`, `.pos`, `npcLoadout.test.js`, `pagination.tsx`, `Entity Serialization Tests`, `Audio Management System`, `DecorationPlanner.js`, `Carousel UI Components`, `World Object Spawning`, `Map Tile Logic`, `Map Serialization Tests`, `DevConsole.tsx`, `JournalUI.tsx`, `MusicManager`, `Weapon Attachment Logic`, `Table UI Components`, `WeatherManager`, `navigation-menu.tsx`, `npcAttackOnSight.test.js`, `MoveIntent`, `rcVehicleMovement.test.js`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `RabbitAI`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _748 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.051251956181533644 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._