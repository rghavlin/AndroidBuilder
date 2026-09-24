# Graph Report - AndroidBuilder  (2026-09-23)

## Corpus Check
- 576 files · ~7,291,818 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3472 nodes · 9626 edges · 179 communities (126 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 141 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ff052a4`
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
- accordion.tsx
- Position
- Renderable
- Vision
- computeMinimapSize
- TestMapBuilder
- verify_saveload.mjs

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 197 edges
2. `Item` - 157 edges
3. `cn()` - 125 edges
4. `GameMap` - 109 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 60 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `npc()` --references--> `EntityFactory`  [EXTRACTED]
  test/entities/entityFaction.test.js → client/src/game/EntityFactory.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
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

## Communities (179 total, 53 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (13): ActionPoints, AIBehavior, Consumable, DamageIntent, EquippedArmor, Item, LightEmitter, MeleeWeapon (+5 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (46): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), LeftPanelWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+38 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (51): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), migrateBubbleEvent() (+43 more)

### Community 6 - "Action Intent System"
Cohesion: 0.10
Nodes (38): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+30 more)

### Community 7 - "CombatResolver"
Cohesion: 0.21
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (25): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny (+17 more)

### Community 9 - "Entity Component System"
Cohesion: 0.17
Nodes (19): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+11 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+46 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (33): DeviceChargeGauge(), DroneConfig, Drone, deviceCharge(), itemCharge(), NO_CHARGE, consumeDeployCharge(), consumeFlightCharge() (+25 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.14
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.11
Nodes (9): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, WorkspaceSlot, WorkspaceSlotProps, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS (+1 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.27
Nodes (6): HIT_TABLE_DISTANCES, ItemTooltip(), ItemTooltipProps, pct(), SHOWN_MOD_CATEGORIES, useOptionalPlayer()

### Community 18 - "Map Template Generation"
Cohesion: 0.10
Nodes (33): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen, PhoneScreenContent() (+25 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (32): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+24 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (14): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+6 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.18
Nodes (15): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+7 more)

### Community 23 - "Door"
Cohesion: 0.36
Nodes (4): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (11): CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, PROFILE, { GameMap }, { TemplateMapGenerator }, generator, layout (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.08
Nodes (39): ActionSlotButton(), ActionSlotButtonProps, GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent() (+31 more)

### Community 27 - "useGame"
Cohesion: 0.07
Nodes (32): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+24 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.15
Nodes (15): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps (+7 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.80
Nodes (4): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources()

### Community 32 - "Container Grid Logic"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.12
Nodes (11): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, NPCTypes, computeTollGateLayout(), TOLLGATE_DEFAULTS, EMPTY_CATALOG (+3 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.33
Nodes (3): electronStorage, idbStorage, ScenarioStorage

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.17
Nodes (11): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), FURNITURE_FOOTPRINTS, makeLayoutGrid() (+3 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (10): NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata(), builder, mapData, t0 (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.10
Nodes (3): compressString(), WorldManager, runDebug()

### Community 45 - "Asset Image Loader"
Cohesion: 0.10
Nodes (4): AudioManager, debugLog(), ConfigManager, MusicManager

### Community 46 - "Turret AI Testing"
Cohesion: 0.20
Nodes (5): ScenarioPickerWindow(), decompressString(), GameSaveSystem, verifyRestoration(), json

### Community 47 - "Game Engine State"
Cohesion: 0.13
Nodes (10): getProgressionForMap(), LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, INIT_STATES (+2 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (5): MoveIntent, getZombieType(), AISystem, spitAtPlayer(), ScentTrail

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.14
Nodes (13): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+5 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.04
Nodes (54): createItemFromDef(), synthesizeZombieVirusCure(), SimulationManager, applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), GameHarness (+46 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.23
Nodes (9): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), collectBatteries(), containerGridOf(), isBattery() (+1 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.14
Nodes (6): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), gameMap, generator

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 66 - "Form UI Components"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.12
Nodes (25): ZombieTooltip(), ZombieTooltipProps, getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, ZombieTypes, getTownTurretPositions() (+17 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (30): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+22 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.10
Nodes (24): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice(), isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile() (+16 more)

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
Cohesion: 0.15
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 85 - "context-menu.tsx"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.23
Nodes (7): AttachmentSlot, AttachmentSlotProps, CampfireUIProps, FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, TooltipContent

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "TollGateSystem"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.09
Nodes (28): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, hasItemsInside(), InventoryProvider() (+20 more)

### Community 102 - "WeatherManager"
Cohesion: 0.08
Nodes (24): CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, isAllRoad() (+16 more)

### Community 103 - "RabbitAI"
Cohesion: 0.36
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), nestedGrids(), ownGrids()

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 105 - "LineOfSight.js"
Cohesion: 0.42
Nodes (8): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 107 - "WeatherManager"
Cohesion: 0.22
Nodes (4): runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (3): DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.16
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+7 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.08
Nodes (7): DevConsole(), Health, Inventory, InventoryContainer, Movable, EntityFactory, runTest()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.05
Nodes (43): TradeDialog(), TradeDialogProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+35 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 116 - "react"
Cohesion: 0.12
Nodes (22): ItemContextMenu(), ItemContextMenuProps, ActionContext, ActionProvider(), CameraProvider(), GameMapContext, GameMapProvider(), isTurretPassableBy() (+14 more)

### Community 117 - "EarbucksShopSystem"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 118 - "context-menu.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 119 - "Logger"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 123 - "TurretAI.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 124 - "MoveIntent"
Cohesion: 0.54
Nodes (7): droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), getActiveDevice()

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.30
Nodes (16): CombatProvider(), removeDestroyedTurret(), dropZombieDeathLoot(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack() (+8 more)

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.09
Nodes (9): Rabbit, SequencerAction, map, mockTile, npc, player, rabbit, zombie (+1 more)

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.12
Nodes (5): BaseMapGenerator, gameRandom, makeSeededRandom(), arm(), brokenScopeStats

### Community 135 - "alert.tsx"
Cohesion: 0.12
Nodes (3): Burnable, RpgStats, PlaceIcon

### Community 137 - "get"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.17
Nodes (6): getNPCType(), findSouthTransitionTile(), applyNpcAIMode(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 141 - "Item"
Cohesion: 0.13
Nodes (5): FireSystem, MovementSystem, computeHearingZone(), markHeardIfInRange(), runCycle()

### Community 142 - "MapConnectivityValidator.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 144 - "stairsTransition.test.js"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.07
Nodes (28): StartModeDialog(), StartModeDialogProps, GameContext, logger, NOTE: do NOT sync `condition` here — it is a DERIVED getter, and, logger, PlayerContext, PlayerProvider() (+20 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.23
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.19
Nodes (10): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), toSlimRoom() (+2 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.48
Nodes (6): buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 156 - "Row"
Cohesion: 0.20
Nodes (4): logger, Quadrant, Row, slope()

### Community 157 - "Quadrant"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 171 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **725 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+720 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `traits.js`, `.executeAction`, `AI and Inventory Systems`, `get`, `Inventory and Skill Windows`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `stairsTransition.test.js`, `Action Queue Processing`, `useGame`, `MapBuilder.js`, `Quadrant`, `Sidebar UI Components`, `accordion.tsx`, `Menubar UI Components`, `Form UI Components`, `Road Generation Logic`, `Toast Notification State`, `Toast UI Components`, `MusicManager`, `.generateFromScenario`, `EntityRenderer.js`, `TollGateSystem`, `tmp_verify_zombie_loot.js`, `.runTurn`, `navigation-menu.tsx`, `toggle-group.tsx`, `lineOfSight.test.js`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Form UI Components`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Entity Serialization Tests` to `traits.js`, `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `npcAttackOnSight.test.js`, `Action Intent System`, `Tooltip Components`, `Entity Component System`, `Inventory and Skill Windows`, `TestEntity.js`, `MapConnectivityValidator.js`, `MockGameMap`, `Map Template Generation`, `MockGameMap`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `Map Generation Config`, `Road and Town Generation`, `Line of Sight System`, `toast.tsx`, `Crafting Manager Logic`, `Audio Management System`, `DecorationPlanner.js`, `Road Generation Logic`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `JournalUI.tsx`, `Weapon Attachment Logic`, `tmp_verify_zombie_loot.js`, `Table UI Components`, `WeatherManager`, `npcAttackOnSight.test.js`, `.isEdgeBlocked`, `react`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _742 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._