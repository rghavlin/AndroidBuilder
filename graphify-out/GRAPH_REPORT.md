# Graph Report - AndroidBuilder  (2026-07-21)

## Corpus Check
- 563 files · ~10,036,911 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3554 nodes · 8924 edges · 198 communities (145 shown, 53 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a36f7887`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Item Components
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
- Blueprint and Inventory Registry
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
- Inventory Persistence Tests
- Save Game Management
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
- Crop Growth Verification
- Chart UI Components
- Command UI Components
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- Registry Storage Tests
- Item Stacking Verification
- Building Hallway Tests
- sheet.tsx
- Table UI Components
- Faction Registry System
- Inventory Item Management
- Starting Road Generation
- LineOfSight.js
- Loot Generation Testing
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- navigation-menu.tsx
- Electron Main Process
- EarbucksShopSystem
- Safe Grid Data Testing
- Book Stats Initialization
- SurvivalCascade.js
- Zombie Interaction Testing
- Consumable
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- react
- MockMap
- OTP Input Components
- table.tsx
- alert.tsx
- Split Road Generation
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- test_noise.js
- verify_army_tent.js
- .applyArmorAbsorption
- test_exhaustive_los.js
- File Integrity Checks
- Zombie Bleeding Logic
- test_exhaustive_los_85.js
- balance.js
- Tile Listener Testing
- DialogOverlay.tsx
- Row
- .runTurn
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Quadrant
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- verify_army_tent.js
- Electron Preload Script
- navigation-menu.tsx
- test_noise.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_noise.js
- test_noise_assert.js
- verify_saveload.mjs
- MockTile
- MockGameMap
- TestMapBuilder
- verify_loadmap_dedup_p4_03.mjs
- verify_bookstats_init_derived.mjs
- verify_south_transition_p4_07.mjs
- MusicManager
- Logger
- test_save_compression.js
- test_noise.js
- MockGameMap
- verify_firefighter_spawn.js
- .dropScent
- test_noise_assert.js
- verify_saveload.mjs
- tmp_verify_random_map.js
- npcLoadout.test.js
- verify_production_frontage.js
- .canSeePosition

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 134 edges
2. `Item` - 131 edges
3. `EntityFactory` - 118 edges
4. `cn()` - 117 edges
5. `createItemFromDef()` - 97 edges
6. `InventoryManager` - 90 edges
7. `engine` - 84 edges
8. `Entity` - 83 edges
9. `ItemDefs` - 66 edges
10. `TemplateMapGenerator` - 59 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json
- `MapCanvas()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/MapCanvas.jsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (198 total, 53 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.07
Nodes (19): ExplosionIntent, EntityFactory, build(), runTest(), testHuntingDoorBug(), testWindowOscillations(), testWindowBug(), main() (+11 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14, COTTAGE_1BED (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.09
Nodes (14): Door, door, gm, player, z, testZombieBug(), testResults, door (+6 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.18
Nodes (3): MovementHelper, Pathfinding, testWindowCost()

### Community 6 - "Action Intent System"
Cohesion: 0.08
Nodes (33): MapTransitionDialogProps, NPCDemandDialogProps, OptionsWindowProps, TutorialEndDialog(), TutorialEndDialogProps, CraftingCategory, Button, Command (+25 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.06
Nodes (31): CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, getFuelValue(), ItemCategory, ItemTrait, Rarity (+23 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.21
Nodes (3): createItemFromDef(), getFoodRejectionChance(), LootGenerator

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (37): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+29 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+7 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.04
Nodes (16): ScenarioMapGenerator, isInsideCompound(), TemplateMapGenerator, ASSERT_FURNISHED, KNOWN_TYPES, REPORT_ONLY, isInsideBuilding(), verifyMap4() (+8 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.18
Nodes (6): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename

### Community 18 - "Map Template Generation"
Cohesion: 0.10
Nodes (27): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameControlsProps, STAT_COLORS (+19 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+17 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (7): GameInitializationManager, INIT_STATES, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 23 - "Door"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (12): Rabbit, SequencerAction, AnimalSpawner, gm, serialized, map, mockTile, npc (+4 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (15): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (74): JournalUI(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog() (+66 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.27
Nodes (5): clear(), confirm(), setItem(), store, testRegistry()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.36
Nodes (10): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+2 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.10
Nodes (12): BaseMapGenerator, LAYOUT, deriveRoadBands(), WindingRoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, isFloor(), NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gameRandom (+4 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.19
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), EventRunner, QuestState, applyItemGrants(), changeEvents, ctx (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (41): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+33 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (10): OptionsWindow(), formatTimestamp(), SaveGameWindow(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, IndexedDBStore, runTest() (+2 more)

### Community 47 - "Game Engine State"
Cohesion: 0.22
Nodes (5): LineOfSight, main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.07
Nodes (35): FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot, GridSlotProps, ItemContextMenu(), ItemContextMenuProps (+27 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.08
Nodes (20): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, compressString(), idbStore, logger, gm, wm (+12 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.03
Nodes (44): ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health, InventoryContainer (+36 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.15
Nodes (21): DefeatDialog(), GameControls(), GameScreenContent(), InfectionHUD(), MainMenuWindow(), MainMenuWindowProps, MapInterface(), MapTransitionDialog() (+13 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.09
Nodes (22): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+14 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.11
Nodes (15): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AISystem, AudioSystem, CombatSystem (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.06
Nodes (55): StartModeDialog(), StartModeDialogProps, ActionContext, ActionProvider(), AudioContext, AudioProvider(), CameraContext, CameraProvider() (+47 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.10
Nodes (34): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid() (+26 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (5): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.25
Nodes (7): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage()

### Community 74 - "Map Tile Logic"
Cohesion: 0.09
Nodes (15): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+7 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.08
Nodes (20): TurretAI, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, FireMode, SafeEventEmitter, TurnProcessingUtils, __dirname (+12 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.15
Nodes (11): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, m1, m2, m3 (+3 more)

### Community 79 - ".executeTransition"
Cohesion: 0.08
Nodes (12): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, WorldManager, assert() (+4 more)

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (18): scripts, ap-economy, balance, build, build-electron, check, dev, electron (+10 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.17
Nodes (10): campfire, groundItemsInContainer, isCampfireVisible, isCampfireVisibleInitially, isTileAroundCampfireVisible, isTileAroundCampfireVisibleCase2, items, map (+2 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.12
Nodes (24): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+16 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.09
Nodes (10): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+2 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 93 - "Command UI Components"
Cohesion: 0.27
Nodes (10): applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.23
Nodes (5): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 99 - "Building Hallway Tests"
Cohesion: 0.13
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.22
Nodes (9): LootProgression, MapProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT (+1 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.14
Nodes (15): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry (+7 more)

### Community 104 - "Starting Road Generation"
Cohesion: 0.44
Nodes (7): getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), wander(), runTest()

### Community 105 - "LineOfSight.js"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.31
Nodes (5): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, assert()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), chargerContents(), runTest(), warnCalls

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.24
Nodes (6): ScenarioInfo, ScenarioPickerWindow(), ScenarioPickerWindowProps, electronStorage, idbStorage, ScenarioStorage

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "EquippedArmor"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.19
Nodes (6): DevConsole(), exportScenario(), main(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 126 - "alert.tsx"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.14
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "test_exhaustive_los_85.js"
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 141 - "balance.js"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 145 - ".runTurn"
Cohesion: 0.14
Nodes (18): VisionSystem, testCornerBug(), testDiagonalBug(), run(), runOscillationTest(), runTest(), main(), runEdgeTest() (+10 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 149 - "Quadrant"
Cohesion: 0.29
Nodes (6): runReproduction(), runTests(), runTest(), testCharger(), assert(), verify()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "verify_army_tent.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 170 - "test_noise.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 171 - "test_noise_assert.js"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "verify_loadmap_dedup_p4_03.mjs"
Cohesion: 0.07
Nodes (7): Item, MeleeWeapon, NOTE: do NOT force itemsModified for every container/attachment item., gm, wm, { GameMap }, { TemplateMapGenerator }

### Community 178 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 181 - "Logger"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 182 - "test_save_compression.js"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 183 - "test_noise.js"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+14 more)

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

### Community 187 - "test_noise_assert.js"
Cohesion: 0.18
Nodes (4): logger, Quadrant, Row, slope()

### Community 189 - "tmp_verify_random_map.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 190 - "npcLoadout.test.js"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

## Knowledge Gaps
- **916 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+911 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Action Intent System`, `Map Template Generation`, `Character and Menu Windows`, `table.tsx`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Blueprint and Inventory Registry`, `Logger`, `test_noise.js`, `Menubar UI Components`, `Entity Serialization Tests`, `Ground Item Management`, `Carousel UI Components`, `Map Tile Logic`, `context-menu.tsx`, `Seeded Random Utilities`, `Safe Grid Data Testing`, `OTP Input Components`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `context-menu.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `react` connect `context-menu.tsx` to `Ground Item Management`, `Toast UI Components`, `External Dependencies`, `Inventory and Skill Windows`, `Turret AI Testing`, `Safe Grid Data Testing`, `Sidebar UI Components`, `Save Game Management`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _928 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06866002214839424 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06423034330011074 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._