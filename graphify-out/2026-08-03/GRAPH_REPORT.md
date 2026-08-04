# Graph Report - AndroidBuilder  (2026-08-03)

## Corpus Check
- 491 files · ~6,606,460 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3091 nodes · 8052 edges · 175 communities (118 shown, 57 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee558df1`
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
- Shop and Log UI
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
- Combat and Turn Management
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
- Rendering Optimization Tests
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
- TestEntity
- Crafting Recipe Verification
- Ground Item Management
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
- Campfire Visibility Tests
- verify_molotov.mjs
- context-menu.tsx
- FurniturePlanner.js
- TurretCombat.js
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
- ExplosionIntent
- Building Hallway Tests
- Game.tsx
- Table UI Components
- WeatherManager
- RabbitAI
- .runTurn
- LineOfSight.js
- .generateNextMap
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- Electron Main Process
- EarbucksShopSystem
- verify_firefighter_spawn.js
- InventoryProvider
- scratch_los_test.js
- MoveIntent
- RoadGenerator
- alert.tsx
- tmp_verify_zombie_loot.js
- wagonDrag.test.js
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- .recordHit
- Health
- Inventory
- API Query Client
- MirroredWindingRoadGenerator
- InventoryContainer
- chart.tsx
- PlayerWallet
- Renderable
- SurvivalStats
- groundPriority.test.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RpgStats
- Container.test.js
- ConfigManager
- npcLoadout.test.js
- MockGameMap
- Image Cropping Scripts
- ZombieTypes.js
- alert.tsx
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- ActionPoints
- AIBehavior
- Electron Preload Script
- Movable
- Position
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- droneMovement.test.js
- index.js
- beltSearch.test.js
- TestMapBuilder
- MusicManager

## God Nodes (most connected - your core abstractions)
1. `cn()` - 119 edges
2. `Item` - 118 edges
3. `createItemFromDef()` - 112 edges
4. `GameMap` - 95 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 82 edges
7. `engine` - 66 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (175 total, 57 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.08
Nodes (31): DroneConfig, Drone, SequencerAction, droneEntityFilter(), ease(), findDronePath(), finishFlight(), moveActiveDevice() (+23 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (49): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+41 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (29): InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI(), CampfireUIProps, ClothingContainerPanel(), ClothingContainerPanelProps (+21 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (18): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, NPCTypes, findSouthTransitionTile(), isInsideTollGate() (+10 more)

### Community 6 - "Action Intent System"
Cohesion: 0.15
Nodes (5): DevConsole(), RpgStats, EntityFactory, npc(), runTest()

### Community 8 - "Tooltip Components"
Cohesion: 0.16
Nodes (18): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, NPCDemandDialog(), CraftingUI(), AudioContext (+10 more)

### Community 9 - "Entity Component System"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (17): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), isInsideCompound() (+9 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (23): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.11
Nodes (21): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+13 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.16
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+7 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (36): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), DevConsoleProps, DevConsoleShopManager() (+28 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.23
Nodes (5): gameRandom, makeSeededRandom(), map, UNARMED_WEAPON, brokenScopeStats

### Community 23 - "Door"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 24 - "Turret Combat Logic"
Cohesion: 0.21
Nodes (14): StartModeDialog(), StartModeDialogProps, GameContext, GameContextInner(), logger, NOTE: do NOT sync `condition` here — it is a DERIVED getter, and, SleepContext, SleepProvider() (+6 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (8): JournalUI(), getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour(), engine, log, interpolateText()

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (20): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+12 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.06
Nodes (27): GridSlot, GridSlotProps, ItemTooltip(), ItemTooltipProps, getAdjustedBgColor(), UniversalGridProps, WorkspaceSlot, WorkspaceSlotProps (+19 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.08
Nodes (30): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, PocketLayouts, testResults (+22 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.13
Nodes (8): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, INIT_STATES, EventEmitter, logger

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.09
Nodes (20): InventoryExtensionWindowProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps (+12 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (48): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents() (+40 more)

### Community 42 - "toast.tsx"
Cohesion: 0.11
Nodes (11): SeededRandom, args, config, secs, seeds, startSeed, t0, fuzzSeed() (+3 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.18
Nodes (3): PlaceIcon, ENTITY_RESTORERS, restoreEntity()

### Community 45 - "Asset Image Loader"
Cohesion: 0.17
Nodes (3): IntentQueue, CombatSystem, ExplosionSystem

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (8): CharacterRegistryWindow(), CharacterRegistry, compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, json

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.20
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.10
Nodes (27): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+19 more)

### Community 62 - "TestEntity"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 64 - "Ground Item Management"
Cohesion: 0.13
Nodes (15): logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, log, isTurretPassableBy(), EntityType, ITEM_SERIALIZED_FIELDS (+7 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 66 - "Form UI Components"
Cohesion: 0.13
Nodes (3): Burnable, Rabbit, testCases

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.23
Nodes (12): getZombieType(), floodFill(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.09
Nodes (29): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+21 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.08
Nodes (18): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+10 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.11
Nodes (15): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), DEF_IDS, makeItems() (+7 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.06
Nodes (18): GameMap, log, basicResult, map, mutantResult, player, windowEntity, zombieBasic (+10 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.16
Nodes (8): DestroyIntent, NoiseEvent, DestructionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem, computeHearingZone(), markHeardIfInRange()

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (19): scripts, ap-economy, balance, budget:update, build, build-electron, check, dev (+11 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.24
Nodes (15): GameControls(), GameScreenContent(), InfectionHUD(), MapInterface(), MapTransitionDialog(), OverlayManager(), SleepModal(), SleepOverlay() (+7 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.19
Nodes (4): runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 85 - "context-menu.tsx"
Cohesion: 0.10
Nodes (24): ActionContext, ActionProvider(), CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), GameProvider(), GameMapContext (+16 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 93 - "EntityRenderer.js"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.13
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "Game.tsx"
Cohesion: 0.42
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 101 - "Table UI Components"
Cohesion: 0.15
Nodes (4): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, computeBrainstemStewTreatment()

### Community 103 - "RabbitAI"
Cohesion: 0.26
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 104 - ".runTurn"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 107 - "WeatherManager"
Cohesion: 0.18
Nodes (11): ItemContextMenu(), ItemContextMenuProps, UniversalGrid(), useAction(), CameraProvider(), GameMapProvider(), getActiveGroundedDevice(), VehicleUtils (+3 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.05
Nodes (10): CharacterCreator(), PlayerSkillsUI(), FactionRegistry, COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set() (+2 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.07
Nodes (10): Consumable, DamageIntent, EquippedArmor, Item, LightEmitter, MeleeWeapon, PlayerWallet, COMPONENT_CLASSES (+2 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 116 - "scratch_los_test.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 117 - "MoveIntent"
Cohesion: 0.16
Nodes (5): MoveIntent, findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem, runCycle()

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.29
Nodes (7): collectDeviceFov(), deviceFovHashPart(), devicePos(), listAirborneDevices(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 121 - "wagonDrag.test.js"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 124 - "OTP Input Components"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 125 - ".recordHit"
Cohesion: 0.20
Nodes (4): logger, Quadrant, Row, slope()

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 132 - "PlayerWallet"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "RpgStats"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 147 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 148 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 169 - "droneMovement.test.js"
Cohesion: 1.00
Nodes (3): deployDrone(), equipPhone(), freshBattery()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `ZombieTypes.js`, `alert.tsx`, `Character and Menu Windows`, `Door`, `Action Queue Processing`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Menubar UI Components`, `TestEntity`, `World Object Spawning`, `App Routing and Scaling`, `Campfire Visibility Tests`, `.generateFromScenario`, `WeatherManager`, `verify_firefighter_spawn.js`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Map Serialization Tests` to `traits.js`, `Item Interaction Logic`, `NPC AI Behavior`, `groundPriority.test.js`, `Tooltip Components`, `Entity and Item Types`, `Rabbit AI State`, `npcLoadout.test.js`, `World Progression and Spawning`, `Game Initialization Manager`, `Inventory Management System`, `Combat and Turn Management`, `eventMarkers.test.js`, `Map Generation Config`, `Container Grid Logic`, `Dialog and Button UI`, `Line of Sight System`, `Map Editor Tools`, `droneMovement.test.js`, `beltSearch.test.js`, `Asset Image Loader`, `pagination.tsx`, `Map Tile Logic`, `Item Factory Methods`, `.executeTransition`, `Campfire Visibility Tests`, `context-menu.tsx`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `WeatherManager`, `EarbucksShopSystem`, `wagonDrag.test.js`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `Loot and Layout Estimation`, `Tooltip Components`, `Entity Component System`, `.runTurn`, `External Dependencies`, `Entity Spawning and Scent`, `Campfire Visibility Tests`, `context-menu.tsx`, `Sidebar UI Components`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _713 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._