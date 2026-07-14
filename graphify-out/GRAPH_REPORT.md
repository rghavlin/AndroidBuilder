# Graph Report - AndroidBuilder  (2026-07-13)

## Corpus Check
- 512 files · ~5,925,137 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3185 nodes · 7938 edges · 184 communities (128 shown, 56 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b39ee06`
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
- ConfigManager
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
- verify_p5_01_event_emitter.mjs
- verify_firefighter_spawn.js
- verify_loadmap_dedup_p4_03.mjs
- verify_worldmanager_populate_p4_02.mjs
- tmp_verify_fix.js
- tmp_verify_zombie_loot.mjs
- Quadrant
- verify_production_frontage.js
- verify_bookstats_init_derived.mjs
- tmp_verify_loot.js
- verify_questsystem_p3.mjs

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
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json
- `MapCanvas()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/MapCanvas.jsx → package.json
- `OptionsWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/OptionsWindow.tsx → package.json

## Import Cycles
- None detected.

## Communities (184 total, 56 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.17
Nodes (18): testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), runTest(), main() (+10 more)

### Community 1 - "UI Components"
Cohesion: 0.13
Nodes (13): DamageIntent, getZombieType(), IntentQueue, AISystem, spitAtPlayer(), CombatSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem (+5 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.18
Nodes (3): getFoodRejectionChance(), LootGenerator, isInsideTollGate()

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (19): NPCAI, RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getBeelineIntent() (+11 more)

### Community 6 - "Action Intent System"
Cohesion: 0.04
Nodes (49): getSightRangeForHour(), NPCTypes, EntityFactory, engine, NOTE: do NOT force itemsModified for every container/attachment item., findSouthTransitionTile(), logger, ZombieReplenishmentSystem (+41 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.05
Nodes (16): ActionPoints, Consumable, DestroyIntent, EquippedArmor, Item, MeleeWeapon, NoiseEvent, RpgStats (+8 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.13
Nodes (23): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyStep(), EventWindow(), EventWindowProps (+15 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.10
Nodes (29): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+21 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.17
Nodes (12): compare(), evalAll(), evalCondition(), log, changeEvents, ctx, fakeInventoryManager, json (+4 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (21): AIBehavior, Health, InventoryContainer, LightEmitter, Movable, Position, Renderable, aiCustom (+13 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.14
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (11): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), TemplateMapGenerator, isInsideBuilding(), verifyMap4(), assert() (+3 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (21): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot, formatTimestamp() (+13 more)

### Community 20 - "Game Map Management"
Cohesion: 0.10
Nodes (19): BlueprintRegistry, Inventory, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem() (+11 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.07
Nodes (50): StartModeDialog(), StartModeDialogProps, ActionContext, ActionProvider(), AudioContext, AudioProvider(), CombatContext, CombatProvider() (+42 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (7): GameInitializationManager, INIT_STATES, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (59): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+51 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.10
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.11
Nodes (3): Container, im, tiny

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.26
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 31 - "Template and World Config"
Cohesion: 0.09
Nodes (18): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gen, generatorTemplates (+10 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 33 - "Options and Crafting UI"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 35 - "Dialog and Button UI"
Cohesion: 0.10
Nodes (11): AIState, PlayerSkills, PlayerWallet, aiComp, ent, json, npc, player (+3 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.12
Nodes (5): BranchingRoadGenerator, RoadNetwork, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 38 - "Building Layout Builder"
Cohesion: 0.23
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.08
Nodes (14): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), invertedImageCache (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (31): emptyEvent(), GameEvent, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta (+23 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.11
Nodes (23): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+15 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 47 - "Game Engine State"
Cohesion: 0.19
Nodes (7): LineOfSight, logger, slope(), main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.13
Nodes (18): AITargeting, TurretAI, getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile, removeDestroyedTurret() (+10 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.15
Nodes (6): PlayerZombieTracker, main(), map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.15
Nodes (22): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+14 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.13
Nodes (12): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+4 more)

### Community 62 - "Save Game Management"
Cohesion: 0.05
Nodes (50): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog() (+42 more)

### Community 66 - "Form UI Components"
Cohesion: 0.16
Nodes (6): getProgressionForMap(), MapProgression, AnimalSpawner, NPCSpawner, ZombieSpawner, runVerification()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.30
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 79 - "Container Serialization Tests"
Cohesion: 0.10
Nodes (9): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, MockCanvasContext, mockEngine (+1 more)

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
Cohesion: 0.14
Nodes (9): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore, clear(), confirm(), setItem(), store (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.07
Nodes (12): Burnable, Rabbit, SequencerAction, gm, serialized, map, mockTile, npc (+4 more)

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 93 - "Command UI Components"
Cohesion: 0.18
Nodes (4): MoveIntent, AudioSystem, mockEngine, MockTile

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.10
Nodes (11): log, NOTE: This only moves the camera view, not any entities, compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, Logger, runTest() (+3 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 101 - "Table UI Components"
Cohesion: 0.06
Nodes (41): DevConsole(), CraftingRecipes, createItemFromDef(), getItemName(), ItemDefs, CategoryDisplayName, CategoryPriority, EquipmentSlot (+33 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.17
Nodes (3): BaseMapGenerator, ScenarioMapGenerator, gameRandom

### Community 106 - "Loot Generation Testing"
Cohesion: 0.33
Nodes (6): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry, idbStore

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.22
Nodes (7): CameraContext, CameraProvider(), hasItemsInside(), InventoryProvider(), isClothingOrBackpack(), main(), testWallGapFix()

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "Map Transition Verification"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.24
Nodes (6): ScenarioInfo, ScenarioPickerWindow(), ScenarioPickerWindowProps, electronStorage, idbStorage, ScenarioStorage

### Community 120 - "Custom React Hooks"
Cohesion: 0.27
Nodes (10): applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 122 - "react"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 123 - "Storage Compression Testing"
Cohesion: 0.22
Nodes (9): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify(), assert() (+1 more)

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
Cohesion: 0.14
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 136 - "Extended LOS Testing"
Cohesion: 0.09
Nodes (20): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+12 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "test_stacking_bug.mjs"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 143 - "tmp_verify_clip.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 149 - "diagnose_sidestep3.mjs"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 153 - "verify_army_tent.js"
Cohesion: 0.33
Nodes (3): testECSRefactor(), runVerification(), runTest()

### Community 170 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 172 - "verify_firefighter_spawn.js"
Cohesion: 0.25
Nodes (5): m1, m2, m3, r1, r2

### Community 175 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 176 - "tmp_verify_zombie_loot.mjs"
Cohesion: 0.50
Nodes (3): clothingKeys, lootGen, subtypes

### Community 179 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 186 - "verify_questsystem_p3.mjs"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

## Knowledge Gaps
- **814 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+809 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Game Engine Context`, `test_noise.js`, `Shop and Log UI`, `Extended LOS Testing`, `Inventory and Skill Windows`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Sidebar UI Components`, `Loot Generation System`, `Dialog UI Components`, `Menubar UI Components`, `Entity Mocking System`, `Save Game Management`, `Item Factory Methods`, `Item Movement Logic`, `context-menu.tsx`, `Attribute Progression System`, `Item Stacking Verification`, `Book Stats Initialization`, `Map Transition Verification`, `OTP Input Components`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `react`, `OTP Input Components`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Table UI Components` to `UI Components`, `Item Interaction Logic`, `AI and Inventory Systems`, `Action Intent System`, `Extended LOS Testing`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `.spawnFurniture`, `Map Template Generation`, `Game Map Management`, `World Progression and Spawning`, `diagnose_sidestep3.mjs`, `Turret Combat Logic`, `Inventory Management System`, `Container Grid Logic`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Blueprint and Inventory Registry`, `Developer Console UI`, `Dialog UI Components`, `Inventory Persistence Tests`, `Save Game Management`, `Crafting Recipe Verification`, `Form UI Components`, `World Object Spawning`, `Crop Growth Verification`, `Starting Road Generation`, `Navigation Menu Components`, `.getBeltContainers`, `Storage Compression Testing`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _823 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13429951690821257 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.10507246376811594 - nodes in this community are weakly interconnected._