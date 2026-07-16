# Graph Report - AndroidBuilder  (2026-07-15)

## Corpus Check
- 518 files · ~5,965,373 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3255 nodes · 8079 edges · 176 communities (125 shown, 51 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d75003d9`
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
- MapCanvas.jsx
- .getBeltContainers
- react
- RoadNetwork
- OTP Input Components
- test_safe_fix.js
- ScenarioMapGenerator.js
- Split Road Generation
- API Query Client
- test_frontage_fix.js
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
- test_exhaustive_los.js
- test_exhaustive_los_85.js
- Tile Listener Testing
- Row
- verify_army_tent.js
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- NPM Configuration Testing
- test_shopkeeper_hostility.mjs
- verify_army_tent.js
- Electron Preload Script
- verify_random_map_loops.mjs
- command.tsx
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_save_compression.js
- test_noise.js
- verify_firefighter_spawn.js
- verify_worldmanager_populate_p4_02.mjs
- verify_bookstats_init_derived.mjs
- verify_firefighter_spawn.js
- verify_p5_01_event_emitter.mjs
- .dropScent
- verify_flee_recovery.mjs

## God Nodes (most connected - your core abstractions)
1. `Item` - 127 edges
2. `GameMap` - 118 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 89 edges
6. `createItemFromDef()` - 88 edges
7. `engine` - 80 edges
8. `Entity` - 80 edges
9. `ItemDefs` - 62 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `testWindowOscillations()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_side_window.mjs → client/src/game/EntityFactory.js
- `testWindowBug()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_window_bug.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json

## Import Cycles
- None detected.

## Communities (176 total, 51 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.09
Nodes (28): ExplosionIntent, EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug() (+20 more)

### Community 1 - "UI Components"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.11
Nodes (13): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, createItemFromDef(), getFoodRejectionChance(), LootGenerator (+5 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (24): RabbitAI, getNPCType(), NPCTypes, getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity() (+16 more)

### Community 6 - "Action Intent System"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 7 - "Shop and Log UI"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (34): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+26 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.08
Nodes (31): BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel() (+23 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (19): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AISystem, AudioSystem, CombatSystem (+11 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.16
Nodes (8): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTests()

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.08
Nodes (38): StartModeDialog(), StartModeDialogProps, ActionContext, AudioContext, AudioProvider(), CameraContext, CameraProvider(), CombatContext (+30 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.05
Nodes (10): isInsideCompound(), TemplateMapGenerator, isInsideBuilding(), verifyMap4(), isInsideBuilding(), runTest(), generator, layout (+2 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot, formatTimestamp() (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry, idbStore, clear(), confirm() (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.10
Nodes (41): BarterWindow(), DefeatDialog(), EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+33 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (4): GameInitializationManager, assert(), verify(), runDebug()

### Community 23 - "Door"
Cohesion: 0.06
Nodes (19): MeleeWeapon, Door, EntityType, NOTE: do NOT force itemsModified for every container/attachment item., door, gm, player, z (+11 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.09
Nodes (22): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+14 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (15): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (59): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+51 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.08
Nodes (33): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO (+25 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.19
Nodes (11): compare(), evalAll(), evalCondition(), changeEvents, ctx, fakeInventoryManager, json, qs (+3 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.21
Nodes (4): MapBuilder, assert(), verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (31): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile (+23 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.12
Nodes (30): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta (+22 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.12
Nodes (10): CraftingManager, cm, container, inContainer, mockInv, singleItem, stack, stack2 (+2 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 45 - "Asset Image Loader"
Cohesion: 0.24
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 47 - "Game Engine State"
Cohesion: 0.20
Nodes (6): LineOfSight, main(), main(), main(), testWindowSide(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

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
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (14): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, DragPreviewLayer() (+6 more)

### Community 66 - "Form UI Components"
Cohesion: 0.23
Nodes (5): computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (23): downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro (+15 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.27
Nodes (10): applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 78 - "Item Movement Logic"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

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
Cohesion: 0.15
Nodes (5): DevConsole(), main(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.44
Nodes (6): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, assert(), verify()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "Dropdown UI Components"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.17
Nodes (7): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, runTest(), assert(), verify()

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 101 - "Table UI Components"
Cohesion: 0.06
Nodes (23): ItemCategory, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+15 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.19
Nodes (3): INIT_STATES, EventEmitter, initManager

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.14
Nodes (10): MAP_GEN_CONFIG, LootProgression, MapProgression, BuildingTypes, isSpecialBuilding(), BaseMapGenerator, LAYOUT, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+2 more)

### Community 106 - "Loot Generation Testing"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.04
Nodes (36): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Health, InventoryContainer, Item (+28 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "Map Transition Verification"
Cohesion: 0.05
Nodes (20): AIState, Rabbit, SequencerAction, gm, serialized, aiComp, ent, json (+12 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 119 - "EquippedArmor"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

### Community 120 - "MapCanvas.jsx"
Cohesion: 0.12
Nodes (21): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+13 more)

### Community 121 - ".getBeltContainers"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 123 - "RoadNetwork"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "test_safe_fix.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "test_frontage_fix.js"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.15
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.09
Nodes (20): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+12 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 143 - "Row"
Cohesion: 0.20
Nodes (4): logger, Quadrant, Row, slope()

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.07
Nodes (28): TurretAI, getItemName(), ItemDefs, testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode (+20 more)

### Community 153 - "verify_army_tent.js"
Cohesion: 0.20
Nodes (6): log, applyItemGrants(), dialogOnlySteps, mixedEvent, placedLog, step

### Community 157 - "command.tsx"
Cohesion: 0.30
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 170 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 172 - "verify_firefighter_spawn.js"
Cohesion: 0.10
Nodes (14): getSightRangeForHour(), findSouthTransitionTile(), isInsideTollGate(), logger, ZombieReplenishmentSystem, ZombieSpawner, main(), buildings (+6 more)

### Community 174 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 175 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 178 - "verify_firefighter_spawn.js"
Cohesion: 0.22
Nodes (4): getProgressionForMap(), MockMap, mockPlayer, verifySpawning()

### Community 186 - ".dropScent"
Cohesion: 0.06
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

## Knowledge Gaps
- **833 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+828 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `test_frontage_fix.js`, `verify_army_tent.js`, `Shop and Log UI`, `Inventory and Skill Windows`, `Shop and Pricing Config`, `Character and Menu Windows`, `World Progression and Spawning`, `Combat and Turn Management`, `command.tsx`, `Sidebar UI Components`, `Loot Generation System`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Save Game Management`, `Scenario Map Generation`, `context-menu.tsx`, `Item Stacking Verification`, `Book Stats Initialization`, `MapCanvas.jsx`, `.getBeltContainers`, `RoadNetwork`, `OTP Input Components`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Entity Mocking System`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `react` connect `Entity Mocking System` to `Action Intent System`, `External Dependencies`, `Entity Spawning and Scent`, `Developer Console UI`, `World Progression and Spawning`, `MapCanvas.jsx`, `RoadNetwork`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _843 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._