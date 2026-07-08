# Graph Report - .  (2026-07-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2978 nodes · 7535 edges · 170 communities (111 shown, 59 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.79)
- Token cost: 7,536 input · 2,007 output

## Graph Freshness
- Built from commit: `f89b8738`
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
- Core Camera and Context
- Turret Combat Logic
- Inventory Management System
- Action Queue Processing
- World and Map Transitions
- Combat and Turn Management
- Sidebar UI Components
- Map Generation Config
- Template and World Config
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
- Map Data Export
- Crafting Manager Logic
- Loot Generation System
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
- Dialog UI Components
- Menubar UI Components
- Entity Serialization Tests
- Audio Management System
- UI Framework Config
- Entity Mocking System
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
- Container Serialization Tests
- Electron Build Config
- Server and Vite Config
- NPM Build Scripts
- Campfire Visibility Tests
- Canvas Context Mocking
- Item Power Tests
- Attribute Progression System
- Item Lifecycle Management
- ASCII Map Renderer
- Lab Map Generation
- Weather Management System
- Crop Growth Verification
- Chart UI Components
- Command UI Components
- Dropdown UI Components
- Weapon Attachment Logic
- Project Package Metadata
- Registry Storage Tests
- Item Stacking Verification
- Building Hallway Tests
- Sheet UI Components
- Table UI Components
- Faction Registry System
- Inventory Item Management
- Starting Road Generation
- Winding Road Generation
- Loot Generation Testing
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- Navigation Menu Components
- Electron Main Process
- Line-of-Sight Logic Tests
- Safe Grid Data Testing
- Book Stats Initialization
- Map Transition Verification
- Zombie Interaction Testing
- App Entry and Error Handling
- Scenario Storage Management
- Custom React Hooks
- Logging Utility
- Mock Entity System
- Storage Compression Testing
- OTP Input Components
- Explosion Intent System
- Road Generation Logic
- Split Road Generation
- API Query Client
- String Compression Utilities
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- Mock Game Map
- Mock Tile System
- Exhaustive LOS Testing
- Extended LOS Testing
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- Dialog Overlay Components
- Map Row Management
- Tile Listener Testing
- Army Tent Generation
- Map Loading Verification
- Quadrant Transformation
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Building Frontage Verification
- Map Loop Verification
- NPM Configuration Testing
- Loot Generator Verification
- Loot Summary Testing
- Electron Preload Script
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization

## God Nodes (most connected - your core abstractions)
1. `Item` - 122 edges
2. `cn()` - 115 edges
3. `GameMap` - 112 edges
4. `EntityFactory` - 97 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 82 edges
7. `Entity` - 80 edges
8. `engine` - 66 edges
9. `ItemDefs` - 61 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `main()` --references--> `json`  [EXTRACTED]
  scratch/check_lab_map.js → verify_phase_2.mjs
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json

## Import Cycles
- None detected.

## Communities (170 total, 59 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.04
Nodes (36): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Health, InventoryContainer, LightEmitter (+28 more)

### Community 1 - "UI Components"
Cohesion: 0.04
Nodes (61): CompactSkillCard(), CompactSkillCardProps, SkillProgressBar(), SkillProgressBarProps, StatCard(), StatCardProps, TradeDialog(), TradeDialogProps (+53 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.08
Nodes (39): GameScreenContent(), MapTransitionDialog(), ActionContext, AudioContext, AudioProvider(), CombatContext, CombatProvider(), resolveTileTarget() (+31 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (23): AITargeting, TurretAI, getItemName(), ItemDefs, FireMode, getFuelValue(), ItemCategory, SafeEventEmitter (+15 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.08
Nodes (16): NPCAI, RabbitAI, getNPCType(), floodFill(), getBeelineIntent(), getGreedyHuntIntent(), getMeleeReach(), huntPlayer() (+8 more)

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (16): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AISystem, AudioSystem, CombatSystem (+8 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.06
Nodes (44): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+36 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (39): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+31 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, Entity, assert(), verify()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (31): testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemTrait, Rarity, RarityWeights (+23 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (33): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+25 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.08
Nodes (17): Item, MeleeWeapon, EntityType, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, ScentTrail, runTest() (+9 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.05
Nodes (19): AIState, Rabbit, SequencerAction, FireSystem, gm, serialized, aiComp, ent (+11 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.13
Nodes (33): DefeatDialog(), EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, InfectionHUD() (+25 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (23): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+15 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.09
Nodes (29): EntityFactory, tryFollowScent(), ZombieSpawner, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest() (+21 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (10): isInsideCompound(), TemplateMapGenerator, main(), isInsideBuilding(), verifyMap4(), generator, layout, mapData (+2 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (28): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+20 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.11
Nodes (14): getProgressionForMap(), LootProgression, MapProgression, findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner (+6 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (9): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer (+1 more)

### Community 23 - "Core Camera and Context"
Cohesion: 0.11
Nodes (15): inputContent, runInspector(), GameContextInner(), NOTE: This only moves the camera view, not any entities, compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.10
Nodes (25): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile (+17 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (23): ExplosionSystem, runTest(), testPhase1(), actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent (+15 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.09
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.15
Nodes (7): CharacterCreator(), PlayerSkillsUI(), getZombieType(), TurnManager, spitAtPlayer(), CombatResolver, previewDerivedStats()

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.16
Nodes (11): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), LAYOUT, doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+3 more)

### Community 31 - "Template and World Config"
Cohesion: 0.09
Nodes (18): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gen, generatorTemplates (+10 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.12
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.21
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.10
Nodes (9): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, MockCanvasContext, mockEngine (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.19
Nodes (7): LineOfSight, logger, slope(), main(), main(), main(), test()

### Community 41 - "Map Editor Tools"
Cohesion: 0.16
Nodes (21): btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid(), createEmptyTile(), Edge, EDGE_COLORS, EdgeState (+13 more)

### Community 42 - "Map Data Export"
Cohesion: 0.14
Nodes (5): exportScenario(), main(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.13
Nodes (10): CraftingManager, cm, container, inContainer, mockInv, singleItem, stack, stack2 (+2 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.16
Nodes (8): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTests()

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.15
Nodes (9): DevConsole(), DevConsoleProps, TabType, CardFooter, Input, applySurvivalCascade(), deriveSecondaryStats(), recalcCharacter() (+1 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.26
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+3 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.16
Nodes (4): Item, TestEntity, assert(), verify()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.23
Nodes (6): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.22
Nodes (9): CraftingRecipes, runTest(), runVerification(), assert(), verify(), verifyMolotov(), runTest(), hammerRecipe (+1 more)

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.21
Nodes (5): isInsideAnyBuilding(), isInsideTollGate(), logger, ZombieReplenishmentSystem, buildings

### Community 76 - "App Routing and Scaling"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 77 - "Item Factory Methods"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 79 - "Container Serialization Tests"
Cohesion: 0.21
Nodes (5): runContainerTests(), runTest(), testSerialization(), results, verifyLoadSwaps()

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, build-electron, check, dev, electron, electron-build, electron-dev (+4 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.17
Nodes (10): campfire, groundItemsInContainer, isCampfireVisible, isCampfireVisibleInitially, isTileAroundCampfireVisible, isTileAroundCampfireVisibleCase2, items, map (+2 more)

### Community 85 - "Item Power Tests"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.20
Nodes (3): testCharger(), assert(), verify()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 93 - "Command UI Components"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 94 - "Dropdown UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (4): run(), run(), assert(), verify()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.27
Nodes (5): clear(), confirm(), setItem(), store, testRegistry()

### Community 98 - "Item Stacking Verification"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "Sheet UI Components"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 101 - "Table UI Components"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 102 - "Faction Registry System"
Cohesion: 0.28
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 106 - "Loot Generation Testing"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 116 - "Map Transition Verification"
Cohesion: 0.25
Nodes (5): m1, m2, m3, r1, r2

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "Scenario Storage Management"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "Custom React Hooks"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 123 - "Storage Compression Testing"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "String Compression Utilities"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

## Knowledge Gaps
- **751 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+746 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components` to `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Character and Menu Windows`, `Sidebar UI Components`, `Options and Crafting UI`, `Dialog and Button UI`, `Developer Console UI`, `Dialog UI Components`, `Menubar UI Components`, `Form UI Components`, `Carousel UI Components`, `Toast UI Components`, `Chart UI Components`, `Command UI Components`, `Dropdown UI Components`, `Sheet UI Components`, `Table UI Components`, `Navigation Menu Components`, `OTP Input Components`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Custom React Hooks`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `react` connect `Custom React Hooks` to `Game Engine Context`, `Tooltip Components`, `Toast UI Components`, `External Dependencies`, `App Routing and Scaling`, `HUD and Dialog UI`, `Save Game Management`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _760 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.03807390817469205 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.03581929965249933 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.053830227743271224 - nodes in this community are weakly interconnected._