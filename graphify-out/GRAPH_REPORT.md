# Graph Report - AndroidBuilder  (2026-09-09)

## Corpus Check
- 572 files · ~7,288,804 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3445 nodes · 9500 edges · 163 communities (118 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c29fb588`
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
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- TurretAI.js
- MoveIntent
- rcVehicleMovement.test.js
- Drone
- rcVehicle.test.js
- addItemToPlayer.test.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- npcAttackOnSight.test.js
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- RoadGenerator
- Image Cropping Scripts
- MockGameMap
- migrateEvents.js
- NPM Configuration Testing
- npcLoadout.test.js
- bench_houses.mjs
- Electron Preload Script
- index.js
- mapRestoreParity.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- npcLoadout.test.js
- TestMapBuilder
- ExplosionIntent
- .addEntity

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 193 edges
2. `Item` - 155 edges
3. `cn()` - 125 edges
4. `GameMap` - 109 edges
5. `engine` - 97 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 58 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
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
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`

## Communities (163 total, 45 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (11): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+3 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.08
Nodes (25): ActionContext, CombatContext, VisualEffectsContext, log, ExplosionIntent, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to (+17 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (44): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InventoryPanel(), TollWindow(), TollWindowProps (+36 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (26): EntityRegistry, GameEvent, LegacyDialogStep, QuestRegistry, BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta (+18 more)

### Community 6 - "Action Intent System"
Cohesion: 0.10
Nodes (37): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+29 more)

### Community 7 - "CombatResolver"
Cohesion: 0.19
Nodes (7): CharacterCreator(), PlayerSkillsUI(), CombatResolver, buildScriptedAttackAction(), resolveAttackMode(), brokenScopeStats, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.05
Nodes (34): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+26 more)

### Community 9 - "Entity Component System"
Cohesion: 0.12
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (45): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+37 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (27): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+19 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.05
Nodes (50): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, AttachmentSlot (+42 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.16
Nodes (23): PhoneWindow(), canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower() (+15 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.07
Nodes (50): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+42 more)

### Community 20 - "Game Map Management"
Cohesion: 0.06
Nodes (35): SeededRandom, applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals() (+27 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.16
Nodes (12): ZombieTooltip(), ZombieTooltipProps, getProgressionForMap(), ZombieTypes, isInsideCompound(), isInsideTollGate(), isInStartArea(), corridorZombieCap() (+4 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.13
Nodes (9): debugLog(), TurnManager, beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH (+1 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (49): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+41 more)

### Community 27 - "useGame"
Cohesion: 0.06
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 28 - "MapBuilder.js"
Cohesion: 0.16
Nodes (22): RETIRED_INDOOR_DECORATIONS, emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), createEmptyGrid(), createEmptyTile() (+14 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.29
Nodes (11): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (9): Drone, collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.17
Nodes (11): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), FURNITURE_FOOTPRINTS, makeLayoutGrid() (+3 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.04
Nodes (24): AIState, Burnable, RpgStats, PlaceIcon, Rabbit, Item, TestEntity, SequencerAction (+16 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.17
Nodes (5): runContainerTests(), runTest(), KNOWN_FAILURES, results, verifyLoadSwaps()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.33
Nodes (3): electronStorage, idbStorage, ScenarioStorage

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (18): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+10 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.25
Nodes (9): GameMapContext, GameMapProvider(), describeIfExplored(), describeTile(), findEdgeStructure(), matchesType(), NEIGHBORS, GATED_FIELDS (+1 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 44 - "ImageLoader"
Cohesion: 0.07
Nodes (7): computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, WorldManager, runDebug()

### Community 46 - "Turret AI Testing"
Cohesion: 0.25
Nodes (5): ScenarioPickerWindow(), compressString(), decompressString(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.22
Nodes (4): log, NOTE: This only moves the camera view, not any entities, GameSaveSystem, verifyRestoration()

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
Cohesion: 0.15
Nodes (4): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.29
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

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
Cohesion: 0.35
Nodes (9): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+1 more)

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.11
Nodes (9): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), allErrors, generator, subtypes, gameMap, generator (+1 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

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
Cohesion: 0.31
Nodes (5): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, toSlimRoom()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (35): hashLocation(), hashNavigate(), useHashLocation(), NOTE: both modes must render the SAME element structure. Swapping between a, ScreenScaler(), ScreenScalerProps, Toast, ToastAction (+27 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.10
Nodes (16): _warnedCatchAllProps, getMeterPercent(), getWaterPercent(), PocketLayouts, testResults, CategoryDisplayName, CategoryPriority, FireMode (+8 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.14
Nodes (14): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), isCropItem() (+6 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.05
Nodes (59): CombatProvider(), AITargeting, BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION (+51 more)

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
Cohesion: 0.70
Nodes (4): make(), makeAutoWagon(), makePoweredTurret(), makeRcWagon()

### Community 84 - "JournalUI.tsx"
Cohesion: 0.15
Nodes (13): LeftPanelWindowProps, BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen (+5 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.11
Nodes (11): LootProgression, MapProgression, INIT_STATES, BaseMapGenerator, LAYOUT, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, isFloor(), gameRandom (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.22
Nodes (8): DECORATION_DENSITIES, getDecorationCategory(), isInsideCompound(), isRetiredDecoration(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS, ScenarioMapGenerator

### Community 87 - "MusicManager"
Cohesion: 0.36
Nodes (7): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), buildFullItem(), exportScenario()

### Community 91 - "apEconomy.js"
Cohesion: 0.31
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 94 - "DevConsole.tsx"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "TemplateConfig.js"
Cohesion: 0.21
Nodes (8): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, CorridorGenerator, PROFILE

### Community 98 - "TollGateSystem"
Cohesion: 0.08
Nodes (27): InventoryExtensionWindow(), InventoryExtensionWindowProps, MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, PlayerSkillsWindowProps, TradeDialog() (+19 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 101 - "Table UI Components"
Cohesion: 0.13
Nodes (7): CraftingManager, CraftingRecipes, getFuelValue(), computeBrainstemStewTreatment(), WAGONS, hammerRecipe, hatchetRecipe

### Community 103 - "RabbitAI"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 107 - "WeatherManager"
Cohesion: 0.06
Nodes (32): createItemFromDef(), make(), makeItems(), deployDrone(), freshBattery(), linkAutonomousWagon(), arm(), makeAutoWagon() (+24 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.08
Nodes (42): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+34 more)

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.04
Nodes (61): ShopItemRow(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, WeaponModPanel() (+53 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "react"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 119 - "Logger"
Cohesion: 0.07
Nodes (18): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainFlyable(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+10 more)

### Community 120 - "TileChunkCache"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 123 - "TurretAI.js"
Cohesion: 0.33
Nodes (7): FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), useWindowSize(), WindowSize

### Community 126 - "Drone"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.32
Nodes (7): dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemColor(), getBrainstemOverrides(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.15
Nodes (18): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+10 more)

### Community 131 - ".executeAction"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 132 - "._processCurrentStep"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 134 - "npcAttackOnSight.test.js"
Cohesion: 0.12
Nodes (17): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., EquipmentSlot, ItemCategory, Rarity, RarityWeights (+9 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 153 - "bench_houses.mjs"
Cohesion: 0.20
Nodes (9): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), roleOf() (+1 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 175 - "npcLoadout.test.js"
Cohesion: 0.06
Nodes (19): DevConsole(), Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., applyNpcAIMode(), logger (+11 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 180 - "ExplosionIntent"
Cohesion: 0.23
Nodes (5): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), AttributeProgressionManager

### Community 181 - ".addEntity"
Cohesion: 0.05
Nodes (20): GameMap, log, PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata(), basicResult, map, mutantResult (+12 more)

## Knowledge Gaps
- **724 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+719 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `WeatherManager` to `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `npcAttackOnSight.test.js`, `Action Intent System`, `Tooltip Components`, `Inventory and Skill Windows`, `Entity Spawning and Scent`, `Map Template Generation`, `MockGameMap`, `Game Initialization Manager`, `npcLoadout.test.js`, `bench_houses.mjs`, `Action Queue Processing`, `useGame`, `EventRunner`, `Options and Crafting UI`, `Road and Town Generation`, `Line of Sight System`, `Map Editor Tools`, `toast.tsx`, `ImageLoader`, `Asset Image Loader`, `npcLoadout.test.js`, `.pos`, `.addEntity`, `Entity Serialization Tests`, `DecorationPlanner.js`, `Crafting Recipe Verification`, `Carousel UI Components`, `World Object Spawning`, `Map Serialization Tests`, `DevConsole.tsx`, `context-menu.tsx`, `MusicManager`, `Weapon Attachment Logic`, `Table UI Components`, `RabbitAI`, `.runTurn`, `LineOfSight.js`, `navigation-menu.tsx`, `react`, `Logger`, `lineOfSight.test.js`, `MoveIntent`, `rcVehicleMovement.test.js`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `.executeAction`, `AI and Inventory Systems`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `Game Initialization Manager`, `Action Queue Processing`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `Line of Sight System`, `Crafting Manager Logic`, `Developer Console UI`, `Menubar UI Components`, `Entity Serialization Tests`, `PhoneWindow.tsx`, `Form UI Components`, `Toast Notification State`, `Toast UI Components`, `JournalUI.tsx`, `.generateFromScenario`, `TollGateSystem`, `toggle-group.tsx`, `TurretAI.js`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Form UI Components`, `toggle-group.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _741 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.052313883299798795 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07945566286215978 - nodes in this community are weakly interconnected._