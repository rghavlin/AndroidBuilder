# Graph Report - AndroidBuilder  (2026-07-26)

## Corpus Check
- 591 files · ~6,484,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3630 nodes · 9243 edges · 183 communities (135 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62632309`
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
- .generateNextMap
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- MockCtx
- Electron Main Process
- EarbucksShopSystem
- MockGameMap
- .addItem
- SurvivalCascade.js
- saveGameMapToEditorState
- log
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- tmp_verify_zombie_loot.js
- verify_water_stacking.mjs
- OTP Input Components
- table.tsx
- test_inventory_ecs.mjs
- test_exhaustive_los.js
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- chart.tsx
- Food Scarcity Logic
- test_noise.js
- command.tsx
- .applyArmorAbsorption
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RoadGenerator
- verify_flee_recovery.mjs
- Tile Listener Testing
- DialogOverlay.tsx
- ZombieTypes.js
- .runTurn
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- TerrainTypes.js
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- Electron Preload Script
- navigation-menu.tsx
- get
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- Place Icon Serialization
- ._interpolateStep
- Row
- test_exhaustive_los.js
- TestMapBuilder
- drawer.tsx
- test_safe_fix.js
- MusicManager
- verify_bookstats_init_derived.mjs
- MockGameMap
- .dropScent
- verify_rain_collector_size.mjs

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 145 edges
2. `Item` - 135 edges
3. `EntityFactory` - 122 edges
4. `cn()` - 119 edges
5. `createItemFromDef()` - 103 edges
6. `InventoryManager` - 91 edges
7. `Entity` - 87 edges
8. `engine` - 86 edges
9. `ItemDefs` - 70 edges
10. `TemplateMapGenerator` - 59 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (183 total, 48 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (44): CreditsWindow(), EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor() (+36 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (36): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid() (+28 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (8): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, assert(), verify()

### Community 6 - "Action Intent System"
Cohesion: 0.03
Nodes (45): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, Inventory, InventoryContainer, Item (+37 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (20): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+12 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.10
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 9 - "Entity Component System"
Cohesion: 0.09
Nodes (19): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, engine, IntentQueue, AISystem, AudioSystem (+11 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (39): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+31 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (23): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, ASSERT_FURNISHED (+15 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.03
Nodes (42): AIState, Burnable, Rabbit, SequencerAction, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gm, serialized (+34 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.16
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.14
Nodes (5): JournalUI(), log, log, interpolateText(), Logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.12
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (5): BaseMapGenerator, gameRandom, makeSeededRandom(), map, brokenScopeStats

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (10): getProgressionForMap(), LootProgression, MapProgression, GameInitializationManager, INIT_STATES, initManager, runDebug(), MockMap (+2 more)

### Community 23 - "Door"
Cohesion: 0.29
Nodes (7): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, dropCorpse(), fakeMap

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), run(), run(), testSerialization(), assert() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

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
Cohesion: 0.06
Nodes (23): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+15 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.16
Nodes (15): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps (+7 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.06
Nodes (16): Container, _warnedCatchAllProps, testResults, CategoryDisplayName, CategoryPriority, FUEL_VALUES, ItemTrait, SlotDisplayName (+8 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.09
Nodes (43): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), MapTransitionDialog() (+35 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.14
Nodes (7): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input, Label, labelVariants

### Community 38 - "Building Layout Builder"
Cohesion: 0.19
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), applyNpcAIMode(), EventRunner, QuestState, changeEvents, ctx (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (24): EntityRegistry, GameEvent, QuestRegistry, BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta, DialogEventDef (+16 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.06
Nodes (27): CharacterRegistryWindow(), MainMenuWindow(), OptionsWindow(), StartMenu(), StartMenuProps, CharacterRegistry, compressString(), decompressString() (+19 more)

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (9): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test() (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.23
Nodes (7): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, runVerification()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.14
Nodes (15): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry (+7 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.16
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+7 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.17
Nodes (20): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), createEmptyGrid(), createEmptyTile(), ENTITY_TYPES (+12 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 62 - "TestEntity"
Cohesion: 0.22
Nodes (4): Item, TestEntity, assert(), verify()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.08
Nodes (9): EntityType, PlaceIcon, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testResults, buildMap(), mapWithEdgeWindow() (+1 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (5): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 66 - "Form UI Components"
Cohesion: 0.19
Nodes (10): hashLocation(), hashNavigate(), useHashLocation(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), ThemeProviderProps (+2 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.30
Nodes (7): DevConsole(), MapInterface(), CameraProvider(), main(), runTests(), testWallGapFix(), verifyRestoration()

### Community 73 - "World Object Spawning"
Cohesion: 0.07
Nodes (33): ActionContext, ActionProvider(), AudioContext, AudioProvider(), CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget() (+25 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.08
Nodes (19): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), __dirname, __filename (+11 more)

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
Cohesion: 0.17
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gen, generatorTemplates, mapData, northX (+4 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.08
Nodes (32): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+24 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.06
Nodes (13): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+5 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "DevConsole.tsx"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.06
Nodes (32): RabbitAI, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), findAttackSlotPath() (+24 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.08
Nodes (23): CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), ItemCategory, computeBrainstemStewTreatment(), cm, container (+15 more)

### Community 103 - "Inventory Item Management"
Cohesion: 0.07
Nodes (20): AITargeting, TurretAI, NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., ItemDefs, EquipmentSlot, FireMode (+12 more)

### Community 104 - "Starting Road Generation"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 106 - ".generateNextMap"
Cohesion: 0.25
Nodes (5): m1, m2, m3, r1, r2

### Community 107 - "Music and Playlist Manager"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "MockCtx"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 114 - "MockGameMap"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 115 - ".addItem"
Cohesion: 0.29
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), chargerContents(), runTest(), warnCalls

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 117 - "saveGameMapToEditorState"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 118 - "log"
Cohesion: 0.36
Nodes (7): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), buildFullItem(), exportScenario()

### Community 119 - "EquippedArmor"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 123 - "verify_water_stacking.mjs"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.08
Nodes (31): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO (+23 more)

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.36
Nodes (10): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+2 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 145 - ".runTurn"
Cohesion: 0.08
Nodes (33): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), testWindowOscillations() (+25 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 149 - "TerrainTypes.js"
Cohesion: 0.44
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "drawer.tsx"
Cohesion: 0.08
Nodes (28): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+20 more)

### Community 178 - "test_safe_fix.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 183 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

## Knowledge Gaps
- **935 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+930 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `drawer.tsx` to `Game Engine Context`, `AI and Inventory Systems`, `chart.tsx`, `Shop and Log UI`, `Inventory and Skill Windows`, `ZombieTypes.js`, `Entity Spawning and Scent`, `Map Template Generation`, `Character and Menu Windows`, `table.tsx`, `Action Queue Processing`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Dialog and Button UI`, `Road and Town Generation`, `ImageLoader`, `Menubar UI Components`, `Toast Notification State`, `Item Stacking Verification`, `Starting Road Generation`, `SurvivalCascade.js`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `MockCtx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `react` connect `MockCtx` to `Form UI Components`, `Dialog and Button UI`, `AI and Inventory Systems`, `Toast Notification State`, `World Object Spawning`, `External Dependencies`, `Turret AI Testing`, `pagination.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _950 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.053923541247484906 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.04794210764360018 - nodes in this community are weakly interconnected._