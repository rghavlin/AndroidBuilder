# Graph Report - AndroidBuilder  (2026-10-20)

## Corpus Check
- 586 files · ~7,300,125 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3530 nodes · 9785 edges · 174 communities (123 shown, 51 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 160 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fdf68b5c`
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
- TestEntity.js
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
- npcAttackOnSight.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- bench_houses.mjs
- computeMinimapSize
- TestMapBuilder
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
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
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

## Communities (174 total, 51 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.12
Nodes (20): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+12 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (36): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+28 more)

### Community 2 - "Item Interaction Logic"
Cohesion: 0.05
Nodes (5): Item, equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem()

### Community 3 - "Game Engine Context"
Cohesion: 0.07
Nodes (8): DevConsole(), Movable, Renderable, SurvivalStats, Vision, EntityFactory, npc(), runTest()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (37): BarterWindow(), BarterWindowProps, InventoryExtensionWindow(), InventoryExtensionWindowProps, InventoryPanel(), LeftPanelWindowProps, TollWindow(), TollWindowProps (+29 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (50): DEFAULT_PLAYER_CLOTHING, defaultPlayerLoadout(), emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), migrateBubbleEvent() (+42 more)

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (30): GameMapContext, GameMapProvider(), isTurretPassableBy(), RcVehicleConfig, isTerrainWalkable(), describeIfExplored(), describeTile(), clearOrder() (+22 more)

### Community 7 - "CombatResolver"
Cohesion: 0.10
Nodes (19): CharacterCreator(), PlayerSkillsUI(), getAttackableTurretOnTile(), removeDestroyedTurret(), debugLog(), TurnManager, CombatResolver, applyHitProgression() (+11 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.13
Nodes (24): btnStyle(), BuildingStampPanel(), drawStampGhost(), Footprint, FRONTAGE_LABEL, inputStyle, rotateStamp(), StampSelection (+16 more)

### Community 9 - "Entity Component System"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, DamageIntent, EquippedArmor, Health, Inventory, InventoryContainer (+7 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.06
Nodes (47): DroneConfig, Drone, canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline() (+39 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.27
Nodes (4): CameraContext, CameraProvider(), exportScenario(), testWallGapFix()

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.10
Nodes (7): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.10
Nodes (19): ZombieTooltip(), ZombieTooltipProps, getProgressionForMap(), LootProgression, MapProgression, EDITOR_GENERATOR_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber() (+11 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.15
Nodes (11): EarbucksShopWindowProps, ShopItemRowProps, AudioContext, AudioProvider(), GameProvider(), LogProvider(), OverlayContext, OverlayContextType (+3 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.09
Nodes (38): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+30 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.27
Nodes (7): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers()

### Community 23 - "Door"
Cohesion: 0.13
Nodes (14): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, FURNITURE_FOOTPRINTS, hasSpecialFurnitureLayout(), LAYOUTS (+6 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (12): TEMPLATE_METADATA, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, PROFILE, { GameMap }, { TemplateMapGenerator }, generator (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (27): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DialogOverlayProps, DialogStep, DoorTooltip(), DoorTooltipProps (+19 more)

### Community 27 - "useGame"
Cohesion: 0.08
Nodes (30): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp() (+22 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.29
Nodes (11): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.80
Nodes (4): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources()

### Community 32 - "Container Grid Logic"
Cohesion: 0.18
Nodes (4): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter

### Community 33 - "Options and Crafting UI"
Cohesion: 0.05
Nodes (48): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+40 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.08
Nodes (31): deviceCharge(), itemCharge(), NO_CHARGE, getRcVehicle(), isWagon(), listRcVehicles(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot() (+23 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (13): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), EventRunner, interpolateText(), resolveMapEvents() (+5 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.20
Nodes (12): getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.10
Nodes (4): AudioManager, debugLog(), ConfigManager, MusicManager

### Community 46 - "Turret AI Testing"
Cohesion: 0.23
Nodes (6): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 47 - "Game Engine State"
Cohesion: 0.50
Nodes (4): btnStyle(), GenerateTemplateModal(), GenerateTemplateModalProps, EDITOR_TEMPLATE_CHOICES

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.48
Nodes (6): buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.17
Nodes (18): getTownTurretPositions(), isInsideCompound(), isInsideTollGate(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, getTurretKeepOutZone(), isInTurretKeepOut() (+10 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 58 - "Audio Management System"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.13
Nodes (7): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), gameMap, generator, generator

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.26
Nodes (8): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.12
Nodes (17): MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, ItemContextMenu(), ItemContextMenuProps, SplitDialog(), ContextMenuCheckboxItem, ContextMenuContent (+9 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.04
Nodes (55): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent(), getWaterPercent() (+47 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.42
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 75 - "Map Serialization Tests"
Cohesion: 0.06
Nodes (30): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem (+22 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.25
Nodes (3): PlaceIcon, findSouthTransitionTile(), NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 77 - "Item Factory Methods"
Cohesion: 0.15
Nodes (9): ScenarioPickerWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, serializeOrders(), verifyRestoration() (+1 more)

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
Cohesion: 0.13
Nodes (8): AITargeting, getSightRangeForHour(), LineOfSight, logger, Quadrant, Row, slope(), test()

### Community 84 - "JournalUI.tsx"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (14): droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), getActiveDevice(), beginTween() (+6 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.23
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 91 - "apEconomy.js"
Cohesion: 0.24
Nodes (8): orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid(), buildPlanGrid(), violations

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 93 - "EntityRenderer.js"
Cohesion: 0.29
Nodes (4): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 94 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "TemplateConfig.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 98 - "TollGateSystem"
Cohesion: 0.13
Nodes (19): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+11 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.16
Nodes (17): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, applyEnergyApCap(), applySurvivalCascade() (+9 more)

### Community 102 - "WeatherManager"
Cohesion: 0.12
Nodes (8): BaseMapGenerator, LAYOUT, gameRandom, makeSeededRandom(), map, brokenScopeStats, templates, tmg

### Community 104 - ".runTurn"
Cohesion: 0.05
Nodes (51): engine, createItemFromDef(), SimulationManager, log, applyItemGrants(), GameHarness, UNARMED_WEAPON, NOTE: GameHarness drives the global engine/gameRandom singletons, so only (+43 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.19
Nodes (13): FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, useAction(), GridSlotSizeConfig (+5 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (5): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set()

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.47
Nodes (5): btnStyle(), FurnitureStampPanel(), FurnitureStampPanelProps, inputStyle, VEHICLES

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.05
Nodes (33): GridSlot, GridSlotProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, AccordionContent, AccordionItem, AccordionTrigger (+25 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.23
Nodes (5): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), AttributeProgressionManager

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
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 123 - "TurretAI.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 124 - "MoveIntent"
Cohesion: 0.43
Nodes (7): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode()

### Community 125 - "rcVehicleMovement.test.js"
Cohesion: 0.09
Nodes (30): FactionRegistry, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+22 more)

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.08
Nodes (11): AIState, Burnable, RpgStats, SequencerAction, aiComp, ent, npc, player (+3 more)

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.40
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 135 - "alert.tsx"
Cohesion: 0.10
Nodes (9): Door, ENTITY_RESTORERS, door, engineMock, map, moveIntent, player, z1 (+1 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 142 - "MapConnectivityValidator.js"
Cohesion: 0.40
Nodes (3): generator, indoorMap, outdoorMap

### Community 143 - "MockGameMap"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 144 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 147 - "MockGameMap"
Cohesion: 0.09
Nodes (3): GameMap, log, runTest()

### Community 148 - "verify_army_tent.js"
Cohesion: 0.12
Nodes (41): EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+33 more)

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.11
Nodes (22): ActionContext, ActionProvider(), CombatContext, LogContext, useVisualEffects(), VisualEffectsContext, log, ExplosionIntent (+14 more)

### Community 153 - "bench_houses.mjs"
Cohesion: 0.12
Nodes (22): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+14 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.18
Nodes (13): BATTERY_SLOT, DeviceChargeGauge(), DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+5 more)

### Community 156 - "Row"
Cohesion: 0.40
Nodes (4): carryOverAuthoredTiles(), CarryOverResult, CarryTile, tile()

### Community 172 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

## Knowledge Gaps
- **740 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+735 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Options and Crafting UI` to `.executeAction`, `AI and Inventory Systems`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `verify_army_tent.js`, `Action Queue Processing`, `itemMeters.js`, `useGame`, `Sidebar UI Components`, `Line of Sight System`, `Map Editor Tools`, `Menubar UI Components`, `PhoneWindow.tsx`, `Toast Notification State`, `.generateFromScenario`, `TollGateSystem`, `tmp_verify_zombie_loot.js`, `navigation-menu.tsx`, `EarbucksShopSystem`, `toggle-group.tsx`, `react`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `.runTurn` to `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `._processCurrentStep`, `CombatResolver`, `Inventory and Skill Windows`, `TestEntity.js`, `MapConnectivityValidator.js`, `Entity Spawning and Scent`, `MockGameMap`, `verify_army_tent.js`, `markerInteraction.test.js`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `Dialog and Button UI`, `Road and Town Generation`, `Line of Sight System`, `toast.tsx`, `npcLoadout.test.js`, `pagination.tsx`, `Entity Serialization Tests`, `DecorationPlanner.js`, `Carousel UI Components`, `Map Tile Logic`, `Map Serialization Tests`, `App Routing and Scaling`, `Weapon Attachment Logic`, `TemplateConfig.js`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `WeatherManager`, `EarbucksShopSystem`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `react` connect `Map Editor Tools` to `traits.js`, `Toast Notification State`, `External Dependencies`, `Turret AI Testing`, `Map Template Generation`, `verify_army_tent.js`, `Sidebar UI Components`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _757 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.04807017543859649 - nodes in this community are weakly interconnected._