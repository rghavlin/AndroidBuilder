# Graph Report - AndroidBuilder  (2026-10-21)

## Corpus Check
- 591 files · ~7,671,669 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3570 nodes · 9945 edges · 186 communities (136 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88acbb97`
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
- mapRestoreParity.test.js
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
- test_noise.js
- test_noise_assert.js
- verify_saveload.mjs
- bench_houses.mjs
- ProgressionConfig.js
- .executeAction
- computeMinimapSize
- TestMapBuilder
- conditions.js
- MapConnectivityValidator.js
- npcLoadout.test.js
- SpeechBubbleContext.jsx
- eventMarkersIntegration.test.js
- DeviceCharge.js
- Row
- Quadrant

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 199 edges
2. `Item` - 158 edges
3. `cn()` - 125 edges
4. `GameMap` - 111 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 65 edges
9. `GameHarness` - 60 edges
10. `MapEditor()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `linkAutonomousWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneGating.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcPathingBudget.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (186 total, 50 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.43
Nodes (3): getEffectiveHour(), getLightMode(), getSightRangeForHour()

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (43): createItemFromDef(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem(), equipBeltWithPouch() (+35 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (33): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), PhoneWindow(), TollWindow(), TollWindowProps, BackpackGrid() (+25 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (48): computeMinimapSize(), DEFAULT_PLAYER_CLOTHING, defaultPlayerLoadout(), emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents() (+40 more)

### Community 6 - "Action Intent System"
Cohesion: 0.17
Nodes (19): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+11 more)

### Community 7 - "CombatResolver"
Cohesion: 0.07
Nodes (35): CharacterCreator(), PlayerSkillsUI(), CombatProvider(), AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile() (+27 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.24
Nodes (11): FAMILY_LABELS, FRONTAGES, measureStamp(), mergeStampTiles(), overlaps(), STAMP_GROUPS, stampBlockedReason(), stampedCells() (+3 more)

### Community 9 - "Entity Component System"
Cohesion: 0.05
Nodes (13): AIBehavior, Consumable, DamageIntent, EquippedArmor, Health, Item, LightEmitter, MeleeWeapon (+5 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.15
Nodes (21): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+13 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (11): Container, isGroundPriority(), isPinnedInPlace(), _warnedCatchAllProps, synthesizeZombieVirusCure(), PocketLayouts, testResults, CategoryDisplayName (+3 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.18
Nodes (10): getProgressionForMap(), EDITOR_GENERATOR_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, GENERATOR_TO_TEMPLATE, logger (+2 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.22
Nodes (20): addLegacyTransitionItem(), exitItem(), isExit(), migrateEditorTransitionTiles(), ITEM_SERIALIZED_FIELDS, copyTransitionFields(), describeTransition(), edgeExitFields() (+12 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (24): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem (+16 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.26
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 23 - "Door"
Cohesion: 0.12
Nodes (13): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, SplitRoadGenerator, hasSpecialFurnitureLayout(), LAYOUTS, planSpecialFurniture() (+5 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.05
Nodes (11): CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, PROFILE, { GameMap }, { TemplateMapGenerator }, generator, layout (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (86): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+78 more)

### Community 27 - "useGame"
Cohesion: 0.08
Nodes (32): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+24 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.28
Nodes (11): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), isWagon(), listRcVehicles(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot() (+3 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.18
Nodes (4): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter

### Community 33 - "Options and Crafting UI"
Cohesion: 0.03
Nodes (67): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, MenuButtonDef (+59 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.13
Nodes (19): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+11 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.13
Nodes (8): Drone, equipPhone(), freshBattery(), makeAirborneDrone(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 38 - "Building Layout Builder"
Cohesion: 0.17
Nodes (4): buildStampMap(), drawSelection(), MapBuilder, test()

### Community 41 - "Map Editor Tools"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 42 - "toast.tsx"
Cohesion: 0.14
Nodes (5): NPCSpawner, exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.31
Nodes (10): getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer(), tryFollowScent() (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.10
Nodes (3): AnimalSpawner, WorldManager, runDebug()

### Community 46 - "Turret AI Testing"
Cohesion: 0.07
Nodes (9): DevConsole(), Inventory, InventoryContainer, Movable, PlayerWallet, Renderable, EntityFactory, npc() (+1 more)

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
Cohesion: 0.13
Nodes (20): getTownTurretPositions(), isInsideCompound(), isInsideTollGate(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, getTurretKeepOutZone(), isInTurretKeepOut() (+12 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.08
Nodes (24): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 58 - "Audio Management System"
Cohesion: 0.25
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.12
Nodes (6): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), gameMap, generator, generator

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.30
Nodes (8): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 68 - "Road Generation Logic"
Cohesion: 0.15
Nodes (9): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (40): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., EquipmentSlot, FireMode, FUEL_VALUES (+32 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.24
Nodes (14): setPhonePower(), IDLE, processPhoneTurn(), consumePhoneChargeOncePerTurn(), hasAutonomy(), deployedPosition(), focusPointOf(), listControllables() (+6 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage() (+1 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.12
Nodes (13): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), ScenarioPickerWindow(), StartMenu() (+5 more)

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
Cohesion: 0.30
Nodes (3): LineOfSight, slope(), test()

### Community 84 - "JournalUI.tsx"
Cohesion: 0.25
Nodes (10): btnStyle(), BuildingStampPanel(), drawStampGhost(), Footprint, FRONTAGE_LABEL, inputStyle, rotateStamp(), StampSelection (+2 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 91 - "apEconomy.js"
Cohesion: 0.17
Nodes (10): FLOORPLAN_FOOTPRINTS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), FURNITURE_FOOTPRINTS, makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 93 - "EntityRenderer.js"
Cohesion: 0.23
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
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (12): applyEnergyApCap(), applySurvivalCascade(), applyVirusCure(), cureInfection(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats() (+4 more)

### Community 102 - "WeatherManager"
Cohesion: 0.10
Nodes (16): LootProgression, MapProgression, INIT_STATES, isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap() (+8 more)

### Community 104 - ".runTurn"
Cohesion: 0.06
Nodes (27): engine, SimulationManager, NOTE: do NOT force itemsModified for every container/attachment item., canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges() (+19 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (3): DERIVED_CONDITIONS, Entity, get()

### Community 109 - "SeededRandom"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.22
Nodes (4): runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.47
Nodes (5): btnStyle(), FurnitureStampPanel(), FurnitureStampPanelProps, inputStyle, VEHICLES

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.16
Nodes (15): FloatingContainer(), GridSlot, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, hasItemsInside(), AttributeProgressionManager, GridSlotSizeConfig (+7 more)

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

### Community 121 - "JournalUI.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 123 - "TurretAI.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 124 - "MoveIntent"
Cohesion: 0.48
Nodes (6): clearControlMode(), CONTROL_MODES, modes(), restoreControlModes(), serializeControlModes(), setControlMode()

### Community 125 - "rcVehicleMovement.test.js"
Cohesion: 0.08
Nodes (24): FactionRegistry, gridItems(), hydratedGridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurretSystem (+16 more)

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.15
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.13
Nodes (5): BaseMapGenerator, LAYOUT, deriveRoadBands(), MirroredWindingRoadGenerator, isFloor()

### Community 137 - "get"
Cohesion: 0.29
Nodes (7): inputStyle, label, num(), Props, TransitionTarget, TransitionTargetPanel(), TYPE_OPTIONS

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 143 - "MockGameMap"
Cohesion: 0.08
Nodes (10): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+2 more)

### Community 144 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 147 - "MockGameMap"
Cohesion: 0.09
Nodes (5): AudioProvider(), GameMap, log, isIndoorFloor(), runTest()

### Community 148 - "verify_army_tent.js"
Cohesion: 0.24
Nodes (6): CharacterRegistryWindow(), CreditsWindow(), StartMenuProps, CharacterRegistry, DEFAULT_PLAYER_STATS, idbStore

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.05
Nodes (35): ActionContext, ActionProvider(), AudioContext, CombatContext, GameProvider(), GameMapContext, GameMapProvider(), LogContext (+27 more)

### Community 152 - "ExplosionIntent"
Cohesion: 0.14
Nodes (3): COMPONENT_NAME_BY_CTOR, set(), restoreEntity()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.19
Nodes (10): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), toSlimRoom() (+2 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.12
Nodes (16): InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps, BATTERY_SLOT, DeviceChargeGauge(), DeviceList(), deviceName(), deviceStatus() (+8 more)

### Community 156 - "Row"
Cohesion: 0.31
Nodes (7): carryOverAuthoredTiles(), CarryOverResult, CarryTile, isAuthoredItem(), isTransitionItem(), TRANSITION_ITEM_IDS, tile()

### Community 157 - "npcAttackOnSight.test.js"
Cohesion: 0.10
Nodes (5): IntentQueue, CombatSystem, FireSystem, computeHearingZone(), markHeardIfInRange()

### Community 169 - "test_noise.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 170 - "test_noise_assert.js"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 171 - "verify_saveload.mjs"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 172 - "bench_houses.mjs"
Cohesion: 0.16
Nodes (17): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+9 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "conditions.js"
Cohesion: 0.27
Nodes (6): compare(), evalAll(), evalCondition(), isEventActive(), log, newMap()

### Community 178 - "MapConnectivityValidator.js"
Cohesion: 0.43
Nodes (6): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), hasExitAt(), findSouthTransitionTile()

### Community 181 - "eventMarkersIntegration.test.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 182 - "DeviceCharge.js"
Cohesion: 0.53
Nodes (4): deviceCharge(), itemCharge(), NO_CHARGE, asItemInstance()

## Knowledge Gaps
- **745 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+740 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `Game Engine Context` to `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `CombatResolver`, `._processCurrentStep`, `Inventory and Skill Windows`, `TestEntity.js`, `HUD and Dialog UI`, `Map Template Generation`, `MockGameMap`, `markerInteraction.test.js`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `npcAttackOnSight.test.js`, `Map Generation Config`, `Dialog and Button UI`, `Road and Town Generation`, `toast.tsx`, `Turret AI Testing`, `npcLoadout.test.js`, `pagination.tsx`, `Entity Serialization Tests`, `MapBuilder.js`, `DecorationPlanner.js`, `Carousel UI Components`, `Map Tile Logic`, `App Routing and Scaling`, `Weapon Attachment Logic`, `TemplateConfig.js`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `.runTurn`, `navigation-menu.tsx`, `EarbucksShopSystem`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `Options and Crafting UI` to `.executeAction`, `AI and Inventory Systems`, `Entity and Item Types`, `Character and Menu Windows`, `Action Queue Processing`, `itemMeters.js`, `useGame`, `Sidebar UI Components`, `Map Editor Tools`, `verify_saveload.mjs`, `Menubar UI Components`, `PhoneWindow.tsx`, `Toast Notification State`, `World Object Spawning`, `.generateFromScenario`, `TollGateSystem`, `SeededRandom`, `EarbucksShopSystem`, `toggle-group.tsx`, `react`, `JournalUI.tsx`, `Drone`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `react` connect `test_noise_assert.js` to `AI and Inventory Systems`, `Toast Notification State`, `Map Serialization Tests`, `External Dependencies`, `Item Factory Methods`, `markerInteraction.test.js`, `Action Queue Processing`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _762 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.045228403437358664 - nodes in this community are weakly interconnected._