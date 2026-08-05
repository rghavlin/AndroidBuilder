# Graph Report - AndroidBuilder  (2026-08-05)

## Corpus Check
- 498 files · ~6,531,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3136 nodes · 8240 edges · 166 communities (109 shown, 57 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22770142`
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
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- MapConnectivityValidator.js
- test_noise_assert.js
- rcVehicleMovement.test.js
- API Query Client
- MirroredWindingRoadGenerator
- rcVehicle.test.js
- npcLoadout.test.js
- verify_army_tent.js
- tmp_verify_fix.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- index.js
- Container.test.js
- AudioSystem
- addItemToPlayer.test.js
- MockGameMap
- beltSearch.test.js
- Image Cropping Scripts
- ZombieTypes.js
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- eventMarkers.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `Item` - 125 edges
2. `createItemFromDef()` - 124 edges
3. `cn()` - 119 edges
4. `GameMap` - 97 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 71 edges
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
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (166 total, 57 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.05
Nodes (52): DroneConfig, RcVehicleConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost() (+44 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (77): EquipmentSlot, EquipmentSlotProps, SLOT_INFO, WeaponModPanel(), WeaponModPanelProps, AccordionContent, AccordionItem, AccordionTrigger (+69 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (30): BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), MapTransitionDialog(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+22 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.12
Nodes (10): getProgressionForMap(), findSouthTransitionTile(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run (+2 more)

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 9 - "Entity Component System"
Cohesion: 0.08
Nodes (25): ActionContext, CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), log, ExplosionIntent, ITEM_SERIALIZED_FIELDS (+17 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (23): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.20
Nodes (16): GameMapContext, GameMapProvider(), logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, isTurretPassableBy(), EntityType (+8 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (31): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+23 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (13): AudioContext, AudioProvider(), CameraContext, CameraProvider(), GameProvider(), LogProvider(), OverlayContext, OverlayContextType (+5 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (17): MapProgression, INIT_STATES, NOTE: do NOT force itemsModified for every container/attachment item., gameRandom, ZombieSpawner, logger, map, UNARMED_WEAPON (+9 more)

### Community 23 - "Door"
Cohesion: 0.08
Nodes (8): AIBehavior, Inventory, Position, Renderable, Vision, EntityFactory, npc(), runTest()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (22): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+14 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.10
Nodes (12): JournalUI(), SpeechBubbleContext, getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour(), engine, log (+4 more)

### Community 27 - "useGame"
Cohesion: 0.09
Nodes (22): DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent, LegacyBubbleEvent (+14 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.18
Nodes (13): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+5 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.11
Nodes (4): Container, isGroundPriority(), isPinnedInPlace(), make()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.22
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+34 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.17
Nodes (7): compressString(), decompressString(), GameSaveSystem, verifyRandomBuildings(), verifyRestoration(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.16
Nodes (6): LineOfSight, logger, Quadrant, Row, slope(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.29
Nodes (3): SimulationManager, VisionSystem, computeHearingZone()

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.06
Nodes (39): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+31 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.08
Nodes (9): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.18
Nodes (14): ZombieTooltip(), ZombieTooltipProps, getZombieType(), ZombieTypes, getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent() (+6 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.27
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 73 - "World Object Spawning"
Cohesion: 0.08
Nodes (31): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+23 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.11
Nodes (15): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideTollGate(), deployDrone(), equipPhone(), freshBattery() (+7 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.24
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.06
Nodes (30): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+22 more)

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
Cohesion: 0.12
Nodes (40): BarterWindow(), EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, GameControls(), GameControlsProps, STAT_COLORS, StatBar (+32 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.29
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.12
Nodes (23): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+15 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.07
Nodes (13): MAP_GEN_CONFIG, FIXED_TEMPLATE_ASSIGNMENTS, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, BaseMapGenerator, LAYOUT (+5 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+2 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (8): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TooltipContent, TREATMENT_EFFECTS

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.08
Nodes (9): RpgStats, PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity(), buildMap(), los() (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "Game.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 101 - "Table UI Components"
Cohesion: 0.21
Nodes (3): getBrainstemColor(), getBrainstemStewColors(), CraftingManager

### Community 103 - "RabbitAI"
Cohesion: 0.12
Nodes (24): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot (+16 more)

### Community 104 - ".runTurn"
Cohesion: 0.17
Nodes (5): runContainerTests(), runTest(), KNOWN_FAILURES, results, verifyLoadSwaps()

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (3): DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, Consumable, DamageIntent, EquippedArmor, Health, InventoryContainer, Item, LightEmitter (+7 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.08
Nodes (29): ItemTooltipProps, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, PocketLayouts (+21 more)

### Community 115 - "InventoryProvider"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 116 - "scratch_los_test.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 117 - "MoveIntent"
Cohesion: 0.29
Nodes (4): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 118 - "RoadGenerator"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 119 - "alert.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 123 - "EntityType"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 125 - "MapConnectivityValidator.js"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "MirroredWindingRoadGenerator"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 135 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "MockGameMap"
Cohesion: 0.18
Nodes (4): DevConsole(), exportScenario(), MockGameMap, testWallGapFix()

### Community 157 - "eventMarkers.test.js"
Cohesion: 0.20
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `AI and Inventory Systems`, `Rabbit AI State`, `HUD and Dialog UI`, `Character and Menu Windows`, `Action Queue Processing`, `Sidebar UI Components`, `EventRunner`, `Loot and Layout Estimation`, `Menubar UI Components`, `Audio Management System`, `Toast Notification State`, `Carousel UI Components`, `World Object Spawning`, `Campfire Visibility Tests`, `DevConsole.tsx`, `Game.tsx`, `RabbitAI`, `.generateNextMap`, `Electron Main Process`, `verify_firefighter_spawn.js`, `tmp_verify_zombie_loot.js`, `MapConnectivityValidator.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Map Serialization Tests` to `traits.js`, `Item Interaction Logic`, `rcVehicle.test.js`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `npcLoadout.test.js`, `Entity Component System`, `Entity and Item Types`, `Rabbit AI State`, `addItemToPlayer.test.js`, `beltSearch.test.js`, `Game Initialization Manager`, `Turret Combat Logic`, `eventMarkers.test.js`, `Container Grid Logic`, `Options and Crafting UI`, `Line of Sight System`, `Map Editor Tools`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Map Tile Logic`, `Item Factory Methods`, `.executeTransition`, `Campfire Visibility Tests`, `FurniturePlanner.js`, `.generateFromScenario`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `.runTurn`, `EarbucksShopSystem`, `verify_firefighter_spawn.js`, `InventoryProvider`, `scratch_los_test.js`, `wagonDrag.test.js`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `Audio Management System`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _714 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05468215994531784 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._