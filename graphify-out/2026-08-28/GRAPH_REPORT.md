# Graph Report - AndroidBuilder  (2026-08-28)

## Corpus Check
- 565 files · ~7,280,875 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3413 nodes · 9378 edges · 165 communities (118 shown, 47 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01c4fb86`
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
1. `createItemFromDef()` - 182 edges
2. `Item` - 151 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 94 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 55 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (165 total, 47 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.06
Nodes (49): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+41 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.16
Nodes (6): computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (44): BarterWindow(), BarterWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, AttachmentSlot, AttachmentSlotProps (+36 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.17
Nodes (18): consumeDeployCharge(), isWagon(), listRcVehicles(), hasAutonomy(), canOperate(), deploy(), deployedPosition(), focusPointOf() (+10 more)

### Community 6 - "Action Intent System"
Cohesion: 0.15
Nodes (25): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+17 more)

### Community 7 - "CombatResolver"
Cohesion: 0.21
Nodes (6): CharacterCreator(), PlayerSkillsUI(), CombatResolver, buildScriptedAttackAction(), resolveAttackMode(), fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (29): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem, computeHearingZone() (+21 more)

### Community 9 - "Entity Component System"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.14
Nodes (17): DroneConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+9 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.11
Nodes (6): DevConsole(), WeatherManager, exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (11): LootProgression, MapProgression, getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, ZombieTypes, gameRandom (+3 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.08
Nodes (20): Container, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getMeterPercent(), getWaterPercent(), synthesizeZombieVirusCure() (+12 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.16
Nodes (3): debugLog(), ImageLoader, TILESET_MISSING_TERRAINS

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.13
Nodes (19): ActionSlotButton(), EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps (+11 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (10): Health, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, engine, NOTE: Structural damage (hp reduction, break/open flags) was already (+2 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.11
Nodes (17): getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent() (+9 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.17
Nodes (16): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+8 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (13): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS, TemplateMapGenerator (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.33
Nodes (12): canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower(), IDLE (+4 more)

### Community 27 - "useGame"
Cohesion: 0.12
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, RoadGenerator, SplitRoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+1 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.10
Nodes (21): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+13 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 31 - "EventRunner"
Cohesion: 0.32
Nodes (9): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), hasReceiver(), isLinkedDevice() (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.15
Nodes (3): getLightMode(), BaseMapGenerator, ScenarioMapGenerator

### Community 33 - "Options and Crafting UI"
Cohesion: 0.13
Nodes (9): AIState, SequencerAction, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.27
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+3 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.06
Nodes (62): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+54 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+36 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.29
Nodes (4): PlayerSkills, onItemCrafted(), recordDefense(), recordHit()

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (9): MainMenuWindow(), OptionsWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, IndexedDBStore (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.04
Nodes (50): createItemFromDef(), SimulationManager, applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), GameHarness, UNARMED_WEAPON (+42 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.20
Nodes (7): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, TEMPLATE_METADATA, logger

### Community 55 - "pagination.tsx"
Cohesion: 0.09
Nodes (27): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, FloatingContainerOverlay(), FloatingContainerOverlayProps (+19 more)

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

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.17
Nodes (3): getSightRangeForHour(), GameEngine, log

### Community 61 - "MapBuilder.js"
Cohesion: 0.11
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.26
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.13
Nodes (15): InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps, BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader() (+7 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.05
Nodes (29): getProgressionForMap(), CorridorLootGenerator, getFoodRejectionChance(), LootGenerator, findSouthTransitionTile(), isInsideAnyBuilding(), isInsideCompound(), isInsideTollGate() (+21 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.09
Nodes (6): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.13
Nodes (16): FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta(), showsAsPoweredTurret() (+8 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.08
Nodes (32): FactionRegistry, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+24 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.30
Nodes (17): CombatProvider(), getAttackableTurretOnTile(), removeDestroyedTurret(), dropZombieDeathLoot(), applyHitProgression(), lx(), ly(), NOOP_UI (+9 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.14
Nodes (5): PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

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
Cohesion: 0.06
Nodes (17): PlayerWallet, Position, RpgStats, SurvivalStats, EntityFactory, AISystem, npc(), emptyTiles() (+9 more)

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

### Community 94 - "DevConsole.tsx"
Cohesion: 0.17
Nodes (4): log, NOTE: This only moves the camera view, not any entities, INIT_STATES, EventEmitter

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

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

### Community 103 - "RabbitAI"
Cohesion: 0.19
Nodes (5): applyNpcAIMode(), log, cureInfection(), infectPlayer(), runCycle()

### Community 104 - ".runTurn"
Cohesion: 0.07
Nodes (28): ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., ItemCategory, Rarity, RarityWeights, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS (+20 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, DamageIntent, EquippedArmor, Inventory, InventoryContainer, Item (+7 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (85): ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, ZombieTooltip(), ZombieTooltipProps, EquipmentSlot, EquipmentSlotProps (+77 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 118 - "context-menu.tsx"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 119 - "Logger"
Cohesion: 0.06
Nodes (24): AITargeting, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), Tile (+16 more)

### Community 120 - "TileChunkCache"
Cohesion: 0.06
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, AudioManager (+3 more)

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 123 - "TurretAI.js"
Cohesion: 0.52
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 126 - "rcVehicleMovement.test.js"
Cohesion: 0.38
Nodes (9): clearControlMode(), CONTROL_MODES, getControlMode(), modes(), restoreControlModes(), serializeControlModes(), setControlMode(), dropWagon() (+1 more)

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.13
Nodes (10): MoveIntent, getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, LIVING_TARGETS, log (+2 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "stairsTransition.test.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "bench_houses.mjs"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 170 - "test_noise_assert.js"
Cohesion: 0.26
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 182 - "MapMetadata.js"
Cohesion: 0.40
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

## Knowledge Gaps
- **721 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `DevConsole.tsx` to `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Tooltip Components`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `Map Template Generation`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `useGame`, `Tile Rendering and Cache`, `Map Editor Tools`, `toast.tsx`, `test_noise_assert.js`, `Game Engine State`, `Window and Door Interaction`, `.addEntity`, `Scenario Map Generation`, `Carousel UI Components`, `World Object Spawning`, `Map Tile Logic`, `Map Serialization Tests`, `context-menu.tsx`, `Weapon Attachment Logic`, `Table UI Components`, `.runTurn`, `EarbucksShopSystem`, `MoveIntent`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `AI and Inventory Systems`, `Entity Spawning and Scent`, `Character and Menu Windows`, `stairsTransition.test.js`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `PhoneWindow.tsx`, `Road Generation Logic`, `Toast Notification State`, `JournalUI.tsx`, `FurniturePlanner.js`, `MusicManager`, `MapConnectivityValidator.js`, `TollGateSystem`, `.isEdgeBlocked`, `toggle-group.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `rcVehicle.test.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _738 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0593607305936073 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0496156533892383 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.052313883299798795 - nodes in this community are weakly interconnected._