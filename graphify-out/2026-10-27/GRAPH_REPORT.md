# Graph Report - AndroidBuilder  (2026-10-26)

## Corpus Check
- 596 files · ~7,677,727 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3587 nodes · 10017 edges · 162 communities (124 shown, 38 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 169 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b514e79`
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
- MockGameMap
- verify_firefighter_spawn.js
- toggle-group.tsx
- react
- EarbucksShopSystem
- context-menu.tsx
- Logger
- computeMinimapSize
- JournalUI.tsx
- lineOfSight.test.js
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
- MapConnectivityValidator.js
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
- test_noise_assert.js
- ProgressionConfig.js
- TestMapBuilder
- MapConnectivityValidator.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 203 edges
2. `Item` - 162 edges
3. `cn()` - 125 edges
4. `GameMap` - 112 edges
5. `engine` - 100 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 67 edges
9. `GameHarness` - 60 edges
10. `MapEditor()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `npc()` --references--> `EntityFactory`  [EXTRACTED]
  test/entities/entityFaction.test.js → client/src/game/EntityFactory.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (162 total, 38 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.10
Nodes (17): InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps, MapTransitionDialog(), NPCDemandDialog(), PlayerSkillsWindowProps, TradeDialog(), TradeDialogProps (+9 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (45): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+37 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (45): FactionRegistry, createItemFromDef(), fillSpecialContainer(), pickWeightedKey(), SPECIAL_CONTAINER_CONTENTS, applyItemGrants(), equipBackpack(), makeItem() (+37 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (39): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryPanel(), PhoneWindow() (+31 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (49): isLockableContainer(), packContainerContents(), DEFAULT_PLAYER_CLOTHING, defaultPlayerLoadout(), emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep (+41 more)

### Community 6 - "Action Intent System"
Cohesion: 0.07
Nodes (37): RcVehicleConfig, debugLog(), NOTE: Structural damage (hp reduction, break/open flags) was already, TurnManager, clearOrder(), estimateTurns(), getOrder(), getOrders() (+29 more)

### Community 7 - "CombatResolver"
Cohesion: 0.06
Nodes (42): CharacterCreator(), PlayerSkillsUI(), AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret() (+34 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.13
Nodes (24): btnStyle(), BuildingStampPanel(), drawStampGhost(), Footprint, FRONTAGE_LABEL, inputStyle, rotateStamp(), StampSelection (+16 more)

### Community 9 - "Entity Component System"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (42): DroneConfig, Drone, IDLE, processPhoneTurn(), droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice() (+34 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.16
Nodes (3): debugLog(), ImageLoader, TILESET_MISSING_TERRAINS

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (8): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, resolveGrid(), KNOWN_FAILURES, results

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.20
Nodes (11): btnStyle(), GenerateTemplateModal(), GenerateTemplateModalProps, EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE (+3 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.16
Nodes (26): carryOverAuthoredTiles(), CarryOverResult, CarryTile, isAuthoredItem(), addLegacyTransitionItem(), exitItem(), isExit(), migrateEditorTransitionTiles() (+18 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.08
Nodes (34): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+26 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.16
Nodes (4): RabbitAI, MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 24 - "Turret Combat Logic"
Cohesion: 0.04
Nodes (23): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, hasSpecialFurnitureLayout(), LAYOUTS, planSpecialFurniture() (+15 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.09
Nodes (21): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+13 more)

### Community 27 - "useGame"
Cohesion: 0.08
Nodes (31): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow() (+23 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 31 - "EventRunner"
Cohesion: 0.16
Nodes (14): DeviceChargeGauge(), deviceCharge(), itemCharge(), NO_CHARGE, getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver() (+6 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.14
Nodes (9): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry, compressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+1 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.03
Nodes (76): BeltContainerPanel(), BeltContainerPanelProps, GridSlot, GridSlotProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, AccordionContent (+68 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.10
Nodes (24): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice(), isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile() (+16 more)

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
Cohesion: 0.05
Nodes (22): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+14 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 42 - "toast.tsx"
Cohesion: 0.18
Nodes (13): GameMapContext, GameMapProvider(), isTurretPassableBy(), describeIfExplored(), describeTile(), getControlMode(), getAutonomousVehicle(), findEdgeStructure() (+5 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.16
Nodes (14): DamageIntent, getZombieType(), floodFill(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+6 more)

### Community 44 - "ImageLoader"
Cohesion: 0.08
Nodes (4): AnimalSpawner, NPCSpawner, WorldManager, runDebug()

### Community 45 - "Asset Image Loader"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.07
Nodes (13): DevConsole(), Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., PERSISTED_KEYS, pickPersistedMetadata() (+5 more)

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
Cohesion: 0.06
Nodes (17): AIState, Burnable, RpgStats, EntityType, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, PlaceIcon (+9 more)

### Community 51 - ".pos"
Cohesion: 0.10
Nodes (7): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS, equipRifle()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.12
Nodes (24): getProgressionForMap(), ZombieTypes, findSouthTransitionTile(), getTownTurretPositions(), isInsideCompound(), isInsideTollGate(), isInStartArea(), computeTollGateLayout() (+16 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.08
Nodes (24): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 58 - "Audio Management System"
Cohesion: 0.14
Nodes (4): IntentQueue, CombatSystem, resolveScriptedDeath(), markHeardIfInRange()

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
Cohesion: 0.14
Nodes (7): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), allErrors, generator, subtypes

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.23
Nodes (9): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), grid() (+1 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.09
Nodes (28): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+20 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (35): Container, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+27 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 73 - "World Object Spawning"
Cohesion: 0.09
Nodes (22): LootProgression, MapProgression, INIT_STATES, RarityWeights, populateSafe(), CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY (+14 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.17
Nodes (3): hasItemsInside(), isClothingOrBackpack(), isDroneInReach()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage() (+1 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.16
Nodes (10): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), decompressString() (+2 more)

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

### Community 84 - "JournalUI.tsx"
Cohesion: 0.35
Nodes (3): LineOfSight, test(), los()

### Community 85 - "context-menu.tsx"
Cohesion: 0.18
Nodes (4): logger, Quadrant, Row, slope()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.21
Nodes (9): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), RETIRED_INDOOR_DECORATIONS, ROAD_DECORATIONS (+1 more)

### Community 87 - "MusicManager"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 91 - "TerrainTypes.js"
Cohesion: 0.42
Nodes (8): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

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
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.15
Nodes (4): applyNpcAIMode(), FireSystem, computeHearingZone(), runCycle()

### Community 102 - "WeatherManager"
Cohesion: 0.10
Nodes (6): BaseMapGenerator, LAYOUT, gameRandom, makeSeededRandom(), map, brokenScopeStats

### Community 104 - ".runTurn"
Cohesion: 0.09
Nodes (20): engine, SimulationManager, canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline() (+12 more)

### Community 105 - "wagonDrag.test.js"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 106 - "DecorationGeneratorModal.tsx"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 107 - "DroneVision.js"
Cohesion: 0.80
Nodes (4): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (5): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set()

### Community 109 - "SeededRandom"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.47
Nodes (5): btnStyle(), FurnitureStampPanel(), FurnitureStampPanelProps, inputStyle, VEHICLES

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

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

### Community 130 - "toggle-group.tsx"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 135 - "alert.tsx"
Cohesion: 0.13
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 137 - "get"
Cohesion: 0.29
Nodes (7): inputStyle, label, num(), Props, TransitionTarget, TransitionTargetPanel(), TYPE_OPTIONS

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.18
Nodes (10): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, buildScriptedAttackAction(), LIVING_TARGETS, log (+2 more)

### Community 143 - "MockGameMap"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 149 - "markerInteraction.test.js"
Cohesion: 0.05
Nodes (75): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), drawImprovedCursor() (+67 more)

### Community 153 - "bench_houses.mjs"
Cohesion: 0.08
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 155 - "itemMeters.js"
Cohesion: 0.19
Nodes (12): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen, PhoneScreenContent() (+4 more)

### Community 170 - "test_noise_assert.js"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), hasExitAt()

## Knowledge Gaps
- **747 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+742 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `test_noise_assert.js`, `toggle-group.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `react` connect `test_noise_assert.js` to `AI and Inventory Systems`, `Toast Notification State`, `Map Serialization Tests`, `External Dependencies`, `Item Factory Methods`, `markerInteraction.test.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `cn()` connect `Options and Crafting UI` to `traits.js`, `.executeAction`, `AI and Inventory Systems`, `Character and Menu Windows`, `markerInteraction.test.js`, `Action Queue Processing`, `itemMeters.js`, `useGame`, `Sidebar UI Components`, `EventRunner`, `Line of Sight System`, `Map Editor Tools`, `Asset Image Loader`, `Menubar UI Components`, `PhoneWindow.tsx`, `Toast Notification State`, `Toast UI Components`, `MusicManager`, `.generateFromScenario`, `TollGateSystem`, `SeededRandom`, `toggle-group.tsx`, `react`, `JournalUI.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _764 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05142857142857143 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._