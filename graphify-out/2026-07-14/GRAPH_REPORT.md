# Graph Report - AndroidBuilder  (2026-07-14)

## Corpus Check
- 512 files · ~5,926,176 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3189 nodes · 7948 edges · 178 communities (123 shown, 55 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c37bd47f`
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
- toast.tsx
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
- context-menu.tsx
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
- sheet.tsx
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
- Consumable
- EquippedArmor
- Custom React Hooks
- .getBeltContainers
- react
- Storage Compression Testing
- OTP Input Components
- WindingRoadGenerator
- Road Generation Logic
- Split Road Generation
- API Query Client
- verify_army_tent.js
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- test_noise.js
- verify_army_tent.js
- .applyArmorAbsorption
- Extended LOS Testing
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- verify_loot_constraints.js
- test_stacking_bug.mjs
- Tile Listener Testing
- tmp_verify_clip.js
- .spawnFurniture
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- diagnose_sidestep3.mjs
- MockCanvasContext
- NPM Configuration Testing
- test_shopkeeper_hostility.mjs
- verify_army_tent.js
- Electron Preload Script
- test_exhaustive_los.js
- tmp_debug_los_transition.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_save_compression.js
- verify_firefighter_spawn.js
- verify_loadmap_dedup_p4_03.mjs
- verify_worldmanager_populate_p4_02.mjs
- tmp_verify_fix.js
- Quadrant
- verify_production_frontage.js
- verify_bookstats_init_derived.mjs

## God Nodes (most connected - your core abstractions)
1. `Item` - 126 edges
2. `GameMap` - 118 edges
3. `cn()` - 115 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 87 edges
7. `Entity` - 80 edges
8. `engine` - 77 edges
9. `ItemDefs` - 62 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json

## Import Cycles
- None detected.

## Communities (178 total, 55 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.10
Nodes (30): EntityFactory, ZombieSpawner, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug() (+22 more)

### Community 1 - "UI Components"
Cohesion: 0.12
Nodes (14): DamageIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, MovementSystem, VisionSystem (+6 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.15
Nodes (6): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideTollGate(), buildings

### Community 5 - "NPC AI Behavior"
Cohesion: 0.06
Nodes (25): NPCAI, RabbitAI, getNPCType(), floodFill(), getBeelineIntent(), getGreedyHuntIntent(), getMeleeReach(), huntPlayer() (+17 more)

### Community 6 - "Action Intent System"
Cohesion: 0.05
Nodes (32): removeDestroyedTurret(), gridItems(), SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player (+24 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.07
Nodes (12): ActionPoints, Consumable, EquippedArmor, Item, MeleeWeapon, SurvivalStats, Vision, COMPONENT_CLASSES (+4 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyStep(), EventWindow(), EventWindowProps (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.10
Nodes (37): BarterWindow(), BarterWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+29 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.11
Nodes (16): compare(), evalAll(), evalCondition(), log, changeEvents, ctx, fakeInventoryManager, json (+8 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (25): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, FireSystem, actionQueue, activeZombie, diedAny (+17 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (20): AIBehavior, Health, LightEmitter, Movable, Position, Renderable, aiCustom, aiDefault (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.12
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.11
Nodes (10): BlueprintRegistry, Inventory, InventoryContainer, RpgStats, __dirname, __filename, __dirname, __filename (+2 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.08
Nodes (47): EarbucksDisplay(), SpeechBubbleInput(), StartModeDialog(), StartModeDialogProps, AudioContext, AudioProvider(), CameraContext, GameContext (+39 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (9): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer (+1 more)

### Community 23 - "Door"
Cohesion: 0.14
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 24 - "Turret Combat Logic"
Cohesion: 0.28
Nodes (12): DevConsoleShopManager(), CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait() (+4 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (15): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (62): GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, AttributeCard(), AttributeCardProps (+54 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.07
Nodes (12): Container, testResults, CategoryDisplayName, CategoryPriority, FUEL_VALUES, ItemTrait, SlotDisplayName, TurnProcessingUtils (+4 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 31 - "Template and World Config"
Cohesion: 0.14
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, assert(), verify() (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.11
Nodes (8): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), assert(), generator

### Community 33 - "Options and Crafting UI"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.15
Nodes (9): AIState, aiComp, ent, json, npc, player, rabbit, restored (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

### Community 38 - "Building Layout Builder"
Cohesion: 0.23
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.07
Nodes (17): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity() (+9 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.12
Nodes (29): emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta, createEmptyGrid() (+21 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.07
Nodes (24): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), ItemCategory, cm (+16 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.12
Nodes (21): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, calculateBaseTileSize() (+13 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.15
Nodes (8): MapProgression, getSightRangeForHour(), NPCTypes, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, logger, ZombieReplenishmentSystem, gameRandom, testCases

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (21): AITargeting, TollGateSystem, attacker, dead, far, firstFarIdx, gameMap, gm2 (+13 more)

### Community 47 - "Game Engine State"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, slope(), main(), main(), main(), testWindowSide(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.10
Nodes (23): ActionContext, ActionProvider(), CombatContext, CombatProvider(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile() (+15 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 55 - "Dialog UI Components"
Cohesion: 0.12
Nodes (27): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+19 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.05
Nodes (34): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+26 more)

### Community 62 - "Save Game Management"
Cohesion: 0.07
Nodes (31): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps (+23 more)

### Community 66 - "Form UI Components"
Cohesion: 0.18
Nodes (5): getProgressionForMap(), findSouthTransitionTile(), AnimalSpawner, NPCSpawner, runDebug()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (21): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter (+13 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.16
Nodes (3): EventRunner, resolveMapEvents(), applyItemGrants()

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+12 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.20
Nodes (3): DevConsoleProps, TabType, CardFooter

### Community 79 - "Container Serialization Tests"
Cohesion: 0.06
Nodes (10): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, ImageLoader, MockCanvasContext (+2 more)

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

### Community 84 - "Canvas Context Mocking"
Cohesion: 0.20
Nodes (7): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.07
Nodes (12): DevConsole(), Burnable, Rabbit, SequencerAction, gm, serialized, map, mockTile (+4 more)

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.17
Nodes (9): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runTest(), assert(), verify() (+1 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 101 - "Table UI Components"
Cohesion: 0.09
Nodes (14): TurretAI, ItemDefs, EquipmentSlot, FireMode, Rarity, SafeEventEmitter, __dirname, __filename (+6 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.28
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 106 - "Loot Generation Testing"
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.27
Nodes (6): CameraProvider(), hasItemsInside(), InventoryProvider(), isClothingOrBackpack(), main(), testWallGapFix()

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 115 - "Book Stats Initialization"
Cohesion: 0.12
Nodes (13): OptionsWindow(), useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent (+5 more)

### Community 116 - "Map Transition Verification"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "Custom React Hooks"
Cohesion: 0.29
Nodes (5): log, map, player, tracker, zombie

### Community 123 - "Storage Compression Testing"
Cohesion: 0.17
Nodes (10): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EarbucksShopSystem, EMPTY_CATALOG, assert(), verify() (+2 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.23
Nodes (4): Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 134 - "verify_army_tent.js"
Cohesion: 0.15
Nodes (4): NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testResults

### Community 136 - "Extended LOS Testing"
Cohesion: 0.09
Nodes (19): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+11 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "test_stacking_bug.mjs"
Cohesion: 0.40
Nodes (3): { Item }, { ItemDefs }, { ItemTrait, ItemCategory }

### Community 149 - "diagnose_sidestep3.mjs"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.14
Nodes (8): PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map, player, shopkeeper

### Community 153 - "verify_army_tent.js"
Cohesion: 0.12
Nodes (9): testECSRefactor(), mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest(), testPhase1(), runVerification() (+1 more)

### Community 170 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 172 - "verify_firefighter_spawn.js"
Cohesion: 0.25
Nodes (5): m1, m2, m3, r1, r2

### Community 175 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 179 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

## Knowledge Gaps
- **816 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+811 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Game Engine Context`, `test_noise.js`, `Shop and Log UI`, `Extended LOS Testing`, `Inventory and Skill Windows`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Sidebar UI Components`, `Line of Sight System`, `Dialog UI Components`, `Menubar UI Components`, `Entity Mocking System`, `Save Game Management`, `Item Factory Methods`, `context-menu.tsx`, `Attribute Progression System`, `Item Stacking Verification`, `Book Stats Initialization`, `Map Transition Verification`, `OTP Input Components`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Book Stats Initialization`, `OTP Input Components`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `react` connect `Book Stats Initialization` to `sheet.tsx`, `External Dependencies`, `Loot Generation System`, `World Progression and Spawning`, `Attribute Progression System`, `Sidebar UI Components`, `Save Game Management`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _825 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09830866807610994 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.12470588235294118 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._