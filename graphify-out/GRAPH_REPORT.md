# Graph Report - AndroidBuilder  (2026-10-27)

## Corpus Check
- 598 files · ~7,687,285 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3596 nodes · 10051 edges · 161 communities (119 shown, 42 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12ea19b9`
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
- TerrainTypes.js
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
- wagonDrag.test.js
- DecorationGeneratorModal.tsx
- DroneVision.js
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
- computeMinimapSize
- JournalUI.tsx
- lineOfSight.test.js
- Item
- DamageIntent
- conditions.js
- toggle-group.tsx
- .executeAction
- npcAttackOnSight.test.js
- alert.tsx
- get
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- Item
- MockGameMap
- mapRestoreParity.test.js
- Image Cropping Scripts
- MockGameMap
- markerInteraction.test.js
- migrateEvents.js
- NPM Configuration Testing
- bench_houses.mjs
- Electron Preload Script
- itemMeters.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- ProgressionConfig.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 203 edges
2. `Item` - 162 edges
3. `cn()` - 126 edges
4. `GameMap` - 112 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 67 edges
9. `GameHarness` - 60 edges
10. `MapEditor()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `useChart()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/chart.tsx → package.json
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (161 total, 42 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.13
Nodes (19): GameControls(), GameScreenContent(), InfectionHUD(), InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps, MapInterface(), MapTransitionDialog() (+11 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.04
Nodes (62): FactionRegistry, Drone, engine, createItemFromDef(), SimulationManager, ensurePhone(), SafeEventEmitter, GameHarness (+54 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.13
Nodes (30): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+22 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.05
Nodes (60): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle, btnStyle(), inputStyle, ZombieGeneratorModal() (+52 more)

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (29): GameMapProvider(), isTurretPassableBy(), clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders() (+21 more)

### Community 7 - "CombatResolver"
Cohesion: 0.06
Nodes (49): CombatProvider(), AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets() (+41 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (22): btnStyle(), BuildingStampPanel(), drawStampGhost(), Footprint, FRONTAGE_LABEL, inputStyle, rotateStamp(), StampSelection (+14 more)

### Community 9 - "Entity Component System"
Cohesion: 0.04
Nodes (16): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, Inventory, InventoryContainer, Item (+8 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (50): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+42 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.15
Nodes (22): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+14 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.17
Nodes (3): getSightRangeForHour(), GameEngine, log

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (7): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), resolveGrid(), KNOWN_FAILURES, results

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.10
Nodes (4): AudioManager, debugLog(), ConfigManager, MusicManager

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.20
Nodes (11): btnStyle(), GenerateTemplateModal(), GenerateTemplateModalProps, EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE (+3 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.13
Nodes (31): carryOverAuthoredTiles(), CarryOverResult, CarryTile, isAuthoredItem(), addLegacyTransitionItem(), exitItem(), isExit(), migrateEditorTransitionTiles() (+23 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.05
Nodes (12): MeleeWeapon, Position, Renderable, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS, restoreEntity(), PERSISTED_KEYS, pickPersistedMetadata() (+4 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (6): TemplateMapGenerator, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (27): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+19 more)

### Community 27 - "useGame"
Cohesion: 0.08
Nodes (42): EarbucksDisplay(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameEventLog(), GameEventLogProps, getLogColor() (+34 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.43
Nodes (5): DeviceChargeGauge(), deviceCharge(), itemCharge(), NO_CHARGE, asItemInstance()

### Community 32 - "Container Grid Logic"
Cohesion: 0.11
Nodes (16): inputContent, runInspector(), formatTimestamp(), SaveGameWindow(), ScenarioPickerWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS (+8 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.03
Nodes (71): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AccordionContent, AccordionItem (+63 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.11
Nodes (19): FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem(), resolveItemMeta() (+11 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.16
Nodes (9): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone() (+1 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.20
Nodes (3): drawSelection(), MapBuilder, test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.12
Nodes (17): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), collectBatteries(), containerGridOf() (+9 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (20): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+12 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 42 - "toast.tsx"
Cohesion: 0.16
Nodes (8): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.16
Nodes (15): getZombieType(), floodFill(), findAttackSlotPath(), getMeleeReach(), isMeleeAttackPosition(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+7 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (17): DevConsole(), EntityFactory, INIT_STATES, AISystem, logger, ZombieReplenishmentSystem, npc(), emptyTiles() (+9 more)

### Community 47 - "Game Engine State"
Cohesion: 0.13
Nodes (11): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), aiComp, ent, npc, player (+3 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 50 - "Window and Door Interaction"
Cohesion: 0.07
Nodes (13): AIState, Burnable, RpgStats, EntityType, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, NPCTypes (+5 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.18
Nodes (14): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, getTownTurretPositions(), computeTollGateLayout(), TOLLGATE_DEFAULTS, getTurretKeepOutZone(), isInTurretKeepOut() (+6 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.07
Nodes (19): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), allErrors, generator, subtypes, generator (+11 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.23
Nodes (9): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid() (+1 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.09
Nodes (27): FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, ItemContextMenu(), ItemContextMenuProps, SplitDialog(), WeaponModPanel() (+19 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.05
Nodes (37): Container, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+29 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.18
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 73 - "World Object Spawning"
Cohesion: 0.08
Nodes (24): LootProgression, MapProgression, RarityWeights, fillSpecialContainer(), pickWeightedKey(), populateSafe(), SPECIAL_CONTAINER_CONTENTS, CorridorLootGenerator (+16 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.18
Nodes (3): hasItemsInside(), isClothingOrBackpack(), isDroneInReach()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.12
Nodes (16): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO (+8 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.15
Nodes (11): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), StartMenu(), useCarousel(), useFormField(), useSidebar() (+3 more)

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
Cohesion: 0.20
Nodes (4): AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 84 - "JournalUI.tsx"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 85 - "context-menu.tsx"
Cohesion: 0.25
Nodes (8): getProgressionForMap(), isInsideCompound(), isInsideTollGate(), isInStartArea(), corridorZombieCap(), ZombieSpawner, populate(), populate()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 91 - "TerrainTypes.js"
Cohesion: 0.21
Nodes (14): applyEnergyApCap(), applySurvivalCascade(), applyVirusCure(), computeBrainstemStewTreatment(), cureInfection(), deriveSecondaryStats(), infectPlayer(), maxApBonusFromAttributes() (+6 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 94 - "DevConsole.tsx"
Cohesion: 0.19
Nodes (7): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH, PATH

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

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
Cohesion: 0.27
Nodes (12): IDLE, processPhoneTurn(), consumePhoneChargeOncePerTurn(), hasAutonomy(), deployedPosition(), focusPointOf(), listControllables(), listDevices() (+4 more)

### Community 103 - "RabbitAI"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 104 - ".runTurn"
Cohesion: 0.13
Nodes (4): getLightMode(), applyNpcAIMode(), log, arm()

### Community 105 - "wagonDrag.test.js"
Cohesion: 0.20
Nodes (5): makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem()

### Community 106 - "DecorationGeneratorModal.tsx"
Cohesion: 0.23
Nodes (8): hasSpecialFurnitureLayout(), LAYOUTS, planSpecialFurniture(), storeLayout(), checkLayout(), FRONTAGES, tilesOf(), TYPES

### Community 107 - "DroneVision.js"
Cohesion: 0.19
Nodes (10): RcVehicleConfig, debugLog(), NOTE: Structural damage (hp reduction, break/open flags) was already, TurnManager, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources() (+2 more)

### Community 109 - "SeededRandom"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 110 - "React Error Boundaries"
Cohesion: 0.15
Nodes (8): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, RoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, PROFILE

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.47
Nodes (5): btnStyle(), FurnitureStampPanel(), FurnitureStampPanelProps, inputStyle, VEHICLES

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 117 - "EarbucksShopSystem"
Cohesion: 0.67
Nodes (3): btn(), ContainerContentsModal(), Props

### Community 118 - "context-menu.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 119 - "Logger"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 121 - "JournalUI.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "conditions.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 137 - "get"
Cohesion: 0.29
Nodes (7): inputStyle, label, num(), Props, TransitionTarget, TransitionTargetPanel(), TYPE_OPTIONS

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.21
Nodes (8): getNPCType(), NPCAISystem, buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 143 - "MockGameMap"
Cohesion: 0.09
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.06
Nodes (60): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+52 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.08
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+22 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.18
Nodes (19): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen, PhoneScreenContent() (+11 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **747 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+742 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Options and Crafting UI` to `traits.js`, `.executeAction`, `AI and Inventory Systems`, `Character and Menu Windows`, `Action Queue Processing`, `itemMeters.js`, `useGame`, `Sidebar UI Components`, `EventRunner`, `Line of Sight System`, `Map Editor Tools`, `Asset Image Loader`, `pagination.tsx`, `Menubar UI Components`, `PhoneWindow.tsx`, `Toast Notification State`, `Toast UI Components`, `Map Serialization Tests`, `.generateFromScenario`, `TollGateSystem`, `SeededRandom`, `toggle-group.tsx`, `react`, `JournalUI.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `Item Factory Methods`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `react` connect `Item Factory Methods` to `traits.js`, `AI and Inventory Systems`, `Toast Notification State`, `External Dependencies`, `SeededRandom`, `markerInteraction.test.js`, `Sidebar UI Components`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _764 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1330049261083744 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.04821802935010482 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05150905432595573 - nodes in this community are weakly interconnected._