# Graph Report - AndroidBuilder  (2026-07-24)

## Corpus Check
- 584 files · ~6,400,147 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3601 nodes · 9154 edges · 203 communities (154 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac7bcdf6`
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
- verify_phase_3.mjs
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- MockCtx
- Electron Main Process
- EarbucksShopSystem
- test_ground_sync.mjs
- .addItem
- SurvivalCascade.js
- saveGameMapToEditorState
- test_stacking_bug.mjs
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- tmp_verify_zombie_loot.js
- verify_water_stacking.mjs
- OTP Input Components
- table.tsx
- test_inventory_ecs.mjs
- Split Road Generation
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- sheet.tsx
- Food Scarcity Logic
- test_noise.js
- .syncWithMap
- .applyArmorAbsorption
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RoadGenerator
- balance.js
- Tile Listener Testing
- DialogOverlay.tsx
- .getPocketContainers
- .runTurn
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- verify_road_template_p3_09.mjs
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- breadcrumb.tsx
- Electron Preload Script
- navigation-menu.tsx
- drawer.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- Place Icon Serialization
- test_noise_assert.js
- verify_saveload.mjs
- EventRunner.js
- test_exhaustive_los.js
- MockGameMap
- TestMapBuilder
- .spawnFurniture
- verify_bookstats_init_derived.mjs
- test_save_compression.js
- MusicManager
- check_template_furniture_plan.mjs
- verify_crop_rendering.js
- MockGameMap
- verify_book_pages_fallback_p3_08.mjs
- .dropScent
- verify_rain_collector_size.mjs
- verify_npc_weapon_stats.mjs
- mapRestoreParity.test.js
- verify_loadmap_dedup_p4_03.mjs
- verify_worldmanager_populate_p4_02.mjs
- bench_houses.mjs
- alert.tsx
- verify_loot_constraints.js
- tmp_verify_zombie_loot.mjs
- organizeByCategory.test.js
- verify

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 144 edges
2. `Item` - 133 edges
3. `EntityFactory` - 121 edges
4. `cn()` - 119 edges
5. `createItemFromDef()` - 100 edges
6. `InventoryManager` - 90 edges
7. `engine` - 85 edges
8. `Entity` - 85 edges
9. `ItemDefs` - 69 edges
10. `TemplateMapGenerator` - 59 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (203 total, 49 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.11
Nodes (13): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT (+5 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (50): BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE (+42 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (9): Item, MeleeWeapon, NOTE: do NOT force itemsModified for every container/attachment item., map, player, tracker, zombie, assert() (+1 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (36): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+28 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (6): getProgressionForMap(), LootProgression, MapProgression, EMPTY_CATALOG, AnimalSpawner, NPCSpawner

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (3): Tile, buildMap(), mapWithEdgeWindow()

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (21): AITargeting, TurretAI, attacker, dead, far, firstFarIdx, gameMap, gm2 (+13 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (24): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (41): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+33 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (19): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+11 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (18): MAP_GEN_CONFIG, ScenarioMapGenerator, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding(), verifyMap4(), assert() (+10 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.04
Nodes (34): ActionPoints, Consumable, EquippedArmor, Health, InventoryContainer, LightEmitter, Movable, PlayerSkills (+26 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (30): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, StartModeDialog(), StartModeDialogProps (+22 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (9): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer (+1 more)

### Community 23 - "Door"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.13
Nodes (5): ExplosionIntent, IntentQueue, runTest(), runTests(), testPhase1()

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (78): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor() (+70 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.19
Nodes (8): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.07
Nodes (8): Burnable, RpgStats, PlaceIcon, Item, TestEntity, runTest(), assert(), verify()

### Community 38 - "Building Layout Builder"
Cohesion: 0.18
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+34 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.21
Nodes (5): CharacterCreator(), PlayerSkillsUI(), CombatResolver, brokenScopeStats, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (10): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, getItem(), runTests(), runTest() (+2 more)

### Community 47 - "Game Engine State"
Cohesion: 0.19
Nodes (7): terrainBlocksSight(), LineOfSight, main(), main(), testWindowSide(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 50 - "Window and Door Interaction"
Cohesion: 0.15
Nodes (4): Window, testResults, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.23
Nodes (8): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, assert(), verify()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.14
Nodes (15): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry (+7 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.05
Nodes (20): AIState, Rabbit, SequencerAction, gm, serialized, aiComp, ent, json (+12 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.30
Nodes (7): AISystem, CombatSystem, MovementSystem, VisionSystem, computeHearingZone(), markHeardIfInRange(), cases

### Community 62 - "Save Game Management"
Cohesion: 0.15
Nodes (19): CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret() (+11 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.10
Nodes (39): EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+31 more)

### Community 66 - "Form UI Components"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.07
Nodes (36): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON is intentionally excluded — place icons render by, renderRain(), warnedMalformedEntityIds (+28 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.20
Nodes (6): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results, verifyLoadSwaps()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.21
Nodes (4): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isFloor()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.27
Nodes (7): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, main(), runVerification()

### Community 77 - "Item Factory Methods"
Cohesion: 0.11
Nodes (6): EntityType, NPCTypes, runTest(), runCycle(), emptyTiles(), loadScenario()

### Community 79 - ".executeTransition"
Cohesion: 0.10
Nodes (4): WorldManager, assert(), verify(), runDebug()

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
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.10
Nodes (28): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+20 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.05
Nodes (13): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+5 more)

### Community 90 - "Weather Management System"
Cohesion: 0.09
Nodes (8): AIBehavior, DamageIntent, MoveIntent, AudioSystem, MockGameMap, MockTile, mockEngine, MockTile

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 93 - "Command UI Components"
Cohesion: 0.09
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+14 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.21
Nodes (17): deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), applyKnob(), ATTR_KNOBS, avg(), cloneScenario() (+9 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.06
Nodes (34): RabbitAI, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), findAttackSlotPath() (+26 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.19
Nodes (6): SimulationManager, FireSystem, testZombieFireDeath(), verifyMolotov(), assert(), verify()

### Community 103 - "Inventory Item Management"
Cohesion: 0.06
Nodes (38): getSightRangeForHour(), engine, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, CategoryDisplayName (+30 more)

### Community 104 - "Starting Road Generation"
Cohesion: 0.19
Nodes (11): compare(), evalAll(), evalCondition(), changeEvents, ctx, fakeInventoryManager, json, qs (+3 more)

### Community 107 - "Music and Playlist Manager"
Cohesion: 0.17
Nodes (4): runReproduction(), testSerialization(), runTest(), testCharger()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.13
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, getScaleMode(), ErrorBoundary, GamePage() (+1 more)

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.29
Nodes (6): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, assert(), verify()

### Community 114 - "test_ground_sync.mjs"
Cohesion: 0.24
Nodes (5): Inventory, __dirname, __filename, __dirname, __filename

### Community 115 - ".addItem"
Cohesion: 0.20
Nodes (4): run(), run(), assert(), verify()

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 118 - "test_stacking_bug.mjs"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 119 - "EquippedArmor"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.11
Nodes (13): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map, player, shopkeeper (+5 more)

### Community 123 - "verify_water_stacking.mjs"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.16
Nodes (7): DevConsole(), CameraProvider(), main(), runTests(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.25
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), chargerContents(), runTest(), warnCalls

### Community 134 - ".syncWithMap"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 145 - ".runTurn"
Cohesion: 0.12
Nodes (26): EntityFactory, tryFollowScent(), addPlayer(), testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest() (+18 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 149 - "verify_road_template_p3_09.mjs"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 157 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 171 - "test_noise_assert.js"
Cohesion: 0.12
Nodes (5): BaseMapGenerator, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gameRandom, makeSeededRandom(), UNARMED_WEAPON

### Community 173 - "EventRunner.js"
Cohesion: 0.32
Nodes (3): applyNpcAIMode(), log, applyItemGrants()

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 175 - "MockGameMap"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 179 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 182 - "check_template_furniture_plan.mjs"
Cohesion: 0.17
Nodes (5): logger, Quadrant, Row, slope(), main()

### Community 183 - "verify_crop_rendering.js"
Cohesion: 0.33
Nodes (5): EntityRenderer, mockEngine, mockSprites, visibilitySet, runTest()

### Community 184 - "MockGameMap"
Cohesion: 0.06
Nodes (6): COMPONENT_NAME_BY_CTOR, Entity, get(), set(), assert(), verify()

### Community 185 - "verify_book_pages_fallback_p3_08.mjs"
Cohesion: 0.40
Nodes (3): ASSERT_FURNISHED, KNOWN_TYPES, REPORT_ONLY

### Community 186 - ".dropScent"
Cohesion: 0.08
Nodes (20): ScentTrail, gm, lead, player, trail, zs, cheb(), out() (+12 more)

### Community 188 - "verify_npc_weapon_stats.mjs"
Cohesion: 0.33
Nodes (4): mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 191 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 192 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 193 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 197 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 200 - "tmp_verify_zombie_loot.mjs"
Cohesion: 0.50
Nodes (3): clothingKeys, lootGen, subtypes

## Knowledge Gaps
- **933 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+928 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `traits.js`, `sheet.tsx`, `AI and Inventory Systems`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Character and Menu Windows`, `World Progression and Spawning`, `table.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `Sidebar UI Components`, `EventRunner`, `ImageLoader`, `MockGameMap`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Ground Item Management`, `alert.tsx`, `Toast Notification State`, `Carousel UI Components`, `context-menu.tsx`, `Command UI Components`, `OTP Input Components`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `.syncWithMap`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `react` connect `.syncWithMap` to `Ground Item Management`, `Dialog and Button UI`, `Toast Notification State`, `World Object Spawning`, `External Dependencies`, `Seeded Random Utilities`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _946 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.04900181488203267 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._