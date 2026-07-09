# Graph Report - AndroidBuilder  (2026-07-09)

## Corpus Check
- 491 files · ~461,847 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3027 nodes · 7678 edges · 175 communities (121 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `002e312e`
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
- verify
- Tile Listener Testing
- Army Tent Generation
- Map Loading Verification
- removeDestroyedTurret
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Map Loop Verification
- NPM Configuration Testing
- index.js
- verify_map4_frontage.js
- Electron Preload Script
- Noise Assertion Tests
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- .applyArmorAbsorption
- verify_firefighter_spawn.js
- .updateCropMetadata
- ScenarioMapGenerator.js
- .setItemsOnTile

## God Nodes (most connected - your core abstractions)
1. `Item` - 122 edges
2. `GameMap` - 118 edges
3. `cn()` - 115 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 82 edges
7. `Entity` - 80 edges
8. `engine` - 72 edges
9. `ItemDefs` - 61 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `testWindowOscillations()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_side_window.mjs → client/src/game/EntityFactory.js
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js

## Import Cycles
- None detected.

## Communities (175 total, 54 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.07
Nodes (20): AIBehavior, Health, LightEmitter, Movable, Position, Renderable, aiCustom, aiDefault (+12 more)

### Community 1 - "UI Components"
Cohesion: 0.14
Nodes (14): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, applySurvivalCascade() (+6 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.08
Nodes (47): EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, StartModeDialog(), StartModeDialogProps, ActionContext, AudioContext, AudioProvider() (+39 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.05
Nodes (27): Container, testResults, CategoryDisplayName, CategoryPriority, FireMode, FUEL_VALUES, ItemTrait, SlotDisplayName (+19 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.06
Nodes (28): NPCAI, RabbitAI, getNPCType(), NPCTypes, getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS (+20 more)

### Community 6 - "Action Intent System"
Cohesion: 0.18
Nodes (10): IntentQueue, AISystem, CombatSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem, VisionSystem, computeHearingZone(), markHeardIfInRange() (+2 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.08
Nodes (34): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), BeltContainerPanel(), BeltContainerPanelProps, DragPreviewLayer(), EquipmentSlot, EquipmentSlotProps (+26 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (13): InventoryExtensionWindowProps, ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps (+5 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (34): CraftingUI(), TurretAI, CraftingRecipes, createItemFromDef(), getItemName(), ItemDefs, EquipmentSlot, getFuelValue() (+26 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (24): BarterWindow(), BarterWindowProps, InventoryPanel(), NPCDemandDialog(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+16 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.05
Nodes (19): AIState, Rabbit, SequencerAction, gm, serialized, aiComp, ent, npc (+11 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.10
Nodes (25): DefeatDialog(), DialogOverlayProps, DialogStep, GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+17 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (22): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+14 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.13
Nodes (22): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), main() (+14 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.05
Nodes (12): isInsideCompound(), TemplateMapGenerator, main(), isInsideBuilding(), runTest(), assert(), verify(), generator (+4 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.16
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+17 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.18
Nodes (5): getProgressionForMap(), AnimalSpawner, NPCSpawner, ZombieSpawner, runVerification()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (9): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer (+1 more)

### Community 23 - "Core Camera and Context"
Cohesion: 0.25
Nodes (5): OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 24 - "Turret Combat Logic"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.05
Nodes (23): SimulationManager, gm, lead, player, trail, zs, door, gm (+15 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.07
Nodes (9): WorldManager, gm, wm, assert(), verify(), entities, wm, wm2 (+1 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatProvider(), CombatResolver

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.27
Nodes (5): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), assert(), verify()

### Community 31 - "Template and World Config"
Cohesion: 0.12
Nodes (14): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gen, generatorTemplates (+6 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.13
Nodes (4): DamageIntent, MoveIntent, Vision, AudioSystem

### Community 33 - "Options and Crafting UI"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.03
Nodes (67): GameEventLog(), GameEventLogProps, getLogColor(), AttachmentSlot, AttachmentSlotProps, FloatingContainerOverlayProps, AccordionContent, AccordionItem (+59 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.10
Nodes (9): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, MockCanvasContext, mockEngine (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.14
Nodes (10): getSightRangeForHour(), LineOfSight, logger, Quadrant, slope(), main(), main(), main() (+2 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.14
Nodes (24): ScenarioPickerWindow(), ScenarioStorage, btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid(), createEmptyTile(), Edge (+16 more)

### Community 42 - "Map Data Export"
Cohesion: 0.07
Nodes (25): DestroyIntent, NoiseEvent, DestructionSystem, mockEngine, MockTile, actionQueue, activeZombie, diedAny (+17 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.25
Nodes (7): GameContextInner(), compressString(), decompressString(), runTest(), runVerification(), runDebug(), json

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (22): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+14 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.15
Nodes (11): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+3 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.10
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.14
Nodes (6): log, PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.14
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.18
Nodes (7): DevConsole(), CameraProvider(), main(), runTests(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.12
Nodes (14): hashLocation(), hashNavigate(), useHashLocation(), EarbucksDisplay(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, Theme (+6 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.19
Nodes (5): MapProgression, BaseMapGenerator, LAYOUT, gameRandom, makeSeededRandom()

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.14
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.07
Nodes (36): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+28 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.15
Nodes (13): BlueprintRegistry, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical() (+5 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.27
Nodes (10): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+2 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.21
Nodes (10): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), invertedImageCache (+2 more)

### Community 79 - "Container Serialization Tests"
Cohesion: 0.23
Nodes (3): log, NOTE: This only moves the camera view, not any entities, GameSaveSystem

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

### Community 90 - "Weather Management System"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

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

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.15
Nodes (11): CharacterRegistryWindow(), CharacterRegistry, DEFAULT_PLAYER_STATS, idbStore, clear(), confirm(), setItem(), store (+3 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 101 - "Table UI Components"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

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
Cohesion: 0.12
Nodes (12): findSouthTransitionTile(), isInsideTollGate(), computeTollGateLayout(), TOLLGATE_DEFAULTS, logger, ZombieReplenishmentSystem, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, m1 (+4 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "Scenario Storage Management"
Cohesion: 0.43
Nodes (4): ScentTrail, cheb(), out(), run()

### Community 120 - "Custom React Hooks"
Cohesion: 0.40
Nodes (5): dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemOverrides(), getCorpseOverrides(), ZombieCorpseConfig

### Community 123 - "Storage Compression Testing"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 134 - "Mock Tile System"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "Dialog Overlay Components"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 145 - "removeDestroyedTurret"
Cohesion: 0.67
Nodes (3): removeDestroyedTurret(), runTest(), warnCalls

### Community 150 - "Map Loop Verification"
Cohesion: 0.50
Nodes (3): clothingKeys, lootGen, subtypes

### Community 157 - "Noise Assertion Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 169 - "Place Icon Serialization"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 170 - ".applyArmorAbsorption"
Cohesion: 0.15
Nodes (5): TurnManager, runTest(), testECSRefactor(), testPhase1(), runTest()

### Community 181 - ".setItemsOnTile"
Cohesion: 0.05
Nodes (19): ActionPoints, Burnable, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, MeleeWeapon (+11 more)

## Knowledge Gaps
- **768 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+763 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Dialog and Button UI` to `UI Components`, `Game Engine Context`, `Shop and Log UI`, `Tooltip Components`, `Item Metadata and Traits`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Character and Menu Windows`, `Sidebar UI Components`, `Options and Crafting UI`, `Place Icon Serialization`, `Developer Console UI`, `Dialog UI Components`, `Menubar UI Components`, `Save Game Management`, `Form UI Components`, `Toast Notification State`, `Carousel UI Components`, `Toast UI Components`, `Weather Management System`, `Chart UI Components`, `Command UI Components`, `Dropdown UI Components`, `Table UI Components`, `Navigation Menu Components`, `OTP Input Components`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Item Metadata and Traits` to `String Compression Utilities`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Shop and Log UI`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Shop and Pricing Config`, `Map Template Generation`, `Game Map Management`, `World Progression and Spawning`, `Inventory Management System`, `Combat and Turn Management`, `Road and Town Generation`, `Map Editor Tools`, `Map Data Export`, `Crafting Manager Logic`, `Loot Generation System`, `Blueprint and Inventory Registry`, `Scenario Map Generation`, `Toast UI Components`, `World Object Spawning`, `Item Movement Logic`, `Canvas Context Mocking`, `Item Power Tests`, `Crop Growth Verification`, `Loot Generation Testing`, `Safe Grid Data Testing`, `Map Transition Verification`, `Custom React Hooks`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Inventory Item Management`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _777 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06951219512195123 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.056189640035118525 - nodes in this community are weakly interconnected._