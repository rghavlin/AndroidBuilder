# Graph Report - AndroidBuilder  (2026-10-21)

## Corpus Check
- 593 files · ~7,674,541 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3578 nodes · 9985 edges · 167 communities (123 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c1da021e`
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
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- .isEdgeBlocked
- verify_firefighter_spawn.js
- toggle-group.tsx
- react
- EarbucksShopSystem
- context-menu.tsx
- Logger
- JournalUI.tsx
- lineOfSight.test.js
- MoveIntent
- rcVehicleMovement.test.js
- rcVehicle.test.js
- TestEntity.js
- conditions.js
- toggle-group.tsx
- .executeAction
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
- markerInteraction.test.js
- migrateEvents.js
- NPM Configuration Testing
- ExplosionIntent
- bench_houses.mjs
- Electron Preload Script
- itemMeters.js
- Row
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- test_noise_assert.js
- bench_houses.mjs
- ProgressionConfig.js
- .executeAction
- TestMapBuilder
- MapConnectivityValidator.js
- SpeechBubbleContext.jsx
- eventMarkersIntegration.test.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 202 edges
2. `Item` - 160 edges
3. `cn()` - 125 edges
4. `GameMap` - 111 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 67 edges
9. `GameHarness` - 60 edges
10. `ItemDefs` - 53 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `linkAutonomousWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneGating.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/autoWagonSleep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (167 total, 44 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.14
Nodes (23): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+15 more)

### Community 1 - "UI Components"
Cohesion: 0.04
Nodes (53): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+45 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (45): createItemFromDef(), fillSpecialContainer(), pickWeightedKey(), populateSafe(), resolveGrid(), SPECIAL_CONTAINER_CONTENTS, applyItemGrants(), makeVehicle() (+37 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (48): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), PhoneWindow(), TollWindow(), TollWindowProps, BackpackGrid() (+40 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.06
Nodes (52): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle, computeMinimapSize(), DEFAULT_PLAYER_CLOTHING, defaultPlayerLoadout() (+44 more)

### Community 6 - "Action Intent System"
Cohesion: 0.17
Nodes (18): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+10 more)

### Community 7 - "CombatResolver"
Cohesion: 0.06
Nodes (43): CharacterCreator(), PlayerSkillsUI(), CombatProvider(), AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile() (+35 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.13
Nodes (24): btnStyle(), BuildingStampPanel(), drawStampGhost(), Footprint, FRONTAGE_LABEL, inputStyle, rotateStamp(), StampSelection (+16 more)

### Community 9 - "Entity Component System"
Cohesion: 0.04
Nodes (30): ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health, Inventory (+22 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.14
Nodes (24): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+16 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.07
Nodes (9): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, debugLog() (+1 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.27
Nodes (8): btnStyle(), GenerateTemplateModal(), GenerateTemplateModalProps, EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 18 - "Map Template Generation"
Cohesion: 0.22
Nodes (20): addLegacyTransitionItem(), exitItem(), isExit(), migrateEditorTransitionTiles(), ITEM_SERIALIZED_FIELDS, copyTransitionFields(), describeTransition(), edgeExitFields() (+12 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.07
Nodes (43): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DevConsoleProps, DevConsoleShopManager() (+35 more)

### Community 20 - "Game Map Management"
Cohesion: 0.11
Nodes (24): applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals(), livingZombies() (+16 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 24 - "Turret Combat Logic"
Cohesion: 0.05
Nodes (16): MAP_GEN_CONFIG, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator (+8 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.05
Nodes (39): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+31 more)

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (26): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+18 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (15): itemCharge(), NO_CHARGE, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), getRcVehicle(), isWagon() (+7 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.13
Nodes (18): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+10 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.03
Nodes (71): JournalUI(), getAdjustedBgColor(), UniversalGrid(), AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription (+63 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.11
Nodes (20): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+12 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.29
Nodes (4): addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (16): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+8 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 42 - "toast.tsx"
Cohesion: 0.18
Nodes (7): DevConsole(), storeLayout(), buildFullItem(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.23
Nodes (11): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+3 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.06
Nodes (20): Item, MeleeWeapon, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, restoreEntity(), applyNpcAIMode(), logger (+12 more)

### Community 47 - "Game Engine State"
Cohesion: 0.20
Nodes (4): AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.12
Nodes (3): PlaceIcon, Item, TestEntity

### Community 51 - ".pos"
Cohesion: 0.07
Nodes (9): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS, makeWagon(), MOTOR_PAIRS (+1 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.12
Nodes (23): getProgressionForMap(), LootProgression, MapProgression, ZombieTypes, getTownTurretPositions(), isInsideCompound(), isInsideTollGate(), isInStartArea() (+15 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.05
Nodes (31): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem (+23 more)

### Community 58 - "Audio Management System"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.24
Nodes (8): ActionProvider(), dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemColor(), getBrainstemOverrides(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.09
Nodes (14): spawnLabBuildingLoot(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), allErrors, generator, subtypes (+6 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.27
Nodes (8): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.08
Nodes (29): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, AttachmentSlot (+21 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 68 - "Road Generation Logic"
Cohesion: 0.06
Nodes (22): compressString(), DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight() (+14 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.07
Nodes (33): NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., synthesizeZombieVirusCure() (+25 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.33
Nodes (9): hasAutonomy(), deployedPosition(), focusPointOf(), listControllables(), listGroundedDevices(), underfootPosition(), centerOn(), linkDevice() (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 74 - "Map Tile Logic"
Cohesion: 0.17
Nodes (4): hasItemsInside(), isClothingOrBackpack(), isDroneInReach(), verifyLoadSwaps()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage() (+1 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.11
Nodes (7): inputContent, runInspector(), decompressString(), GameSaveSystem, IndexedDBStore, json, runTest()

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
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 85 - "context-menu.tsx"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

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
Cohesion: 0.11
Nodes (21): MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup (+13 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.14
Nodes (19): GameContextInner(), SleepContext, SleepProvider(), computeHearingZone(), applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes() (+11 more)

### Community 101 - "Table UI Components"
Cohesion: 0.17
Nodes (5): CraftingManager, CraftingRecipes, computeBrainstemStewTreatment(), hammerRecipe, hatchetRecipe

### Community 102 - "WeatherManager"
Cohesion: 0.12
Nodes (5): BaseMapGenerator, gameRandom, makeSeededRandom(), map, brokenScopeStats

### Community 104 - ".runTurn"
Cohesion: 0.12
Nodes (23): SimulationManager, canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower() (+15 more)

### Community 109 - "SeededRandom"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.33
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.47
Nodes (5): btnStyle(), FurnitureStampPanel(), FurnitureStampPanelProps, inputStyle, VEHICLES

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.11
Nodes (9): log, NOTE: This only moves the camera view, not any entities, PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), INIT_STATES, AttributeProgressionManager (+1 more)

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

### Community 121 - "JournalUI.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 124 - "MoveIntent"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 125 - "rcVehicleMovement.test.js"
Cohesion: 0.50
Nodes (3): equipChargedPhone(), makeTurret(), makeWagon()

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 133 - "._restoreTilesAndEntities"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 137 - "get"
Cohesion: 0.29
Nodes (7): inputStyle, label, num(), Props, TransitionTarget, TransitionTargetPanel(), TYPE_OPTIONS

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.26
Nodes (4): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 143 - "MockGameMap"
Cohesion: 0.09
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 144 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.05
Nodes (49): StartModeDialog(), StartModeDialogProps, ActionContext, AudioContext, AudioProvider(), CombatContext, GameContext, GameProvider() (+41 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.11
Nodes (24): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+16 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.14
Nodes (15): LeftPanelWindowProps, BATTERY_SLOT, DeviceChargeGauge(), DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon() (+7 more)

### Community 156 - "Row"
Cohesion: 0.31
Nodes (7): carryOverAuthoredTiles(), CarryOverResult, CarryTile, isAuthoredItem(), isTransitionItem(), TRANSITION_ITEM_IDS, tile()

### Community 170 - "test_noise_assert.js"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 172 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "MapConnectivityValidator.js"
Cohesion: 0.43
Nodes (6): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), hasExitAt(), findSouthTransitionTile()

### Community 181 - "eventMarkersIntegration.test.js"
Cohesion: 0.14
Nodes (7): FactionRegistry, get(), applyMapRegistries(), SafeEventEmitter, hasScenario, loadScenario(), SCENARIO

## Knowledge Gaps
- **746 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+741 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `test_noise_assert.js` to `Container Grid Logic`, `traits.js`, `AI and Inventory Systems`, `Map Serialization Tests`, `External Dependencies`, `markerInteraction.test.js`, `Audio Management System`, `useGame`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `test_noise_assert.js`, `toggle-group.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `cn()` connect `Options and Crafting UI` to `traits.js`, `PhoneWindow.tsx`, `TollGateSystem`, `.executeAction`, `AI and Inventory Systems`, `Audio Management System`, `Map Editor Tools`, `itemMeters.js`, `SeededRandom`, `Character and Menu Windows`, `toggle-group.tsx`, `react`, `Menubar UI Components`, `JournalUI.tsx`, `Action Queue Processing`, `useGame`, `.generateFromScenario`, `Sidebar UI Components`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _763 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1350806451612903 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.04265873015873016 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._