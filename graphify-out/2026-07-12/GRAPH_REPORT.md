# Graph Report - AndroidBuilder  (2026-07-12)

## Corpus Check
- 491 files · ~467,647 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3042 nodes · 7724 edges · 165 communities (120 shown, 45 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58c1468a`
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
- App Entry and Error Handling
- test_save_compression.js
- Custom React Hooks
- Logging Utility
- Mock Entity System
- Storage Compression Testing
- OTP Input Components
- WindingRoadGenerator
- Road Generation Logic
- Split Road Generation
- API Query Client
- gridItems
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- Mock Game Map
- verify_army_tent.js
- tmp_verify_fix.js
- Extended LOS Testing
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- verify_map4_frontage.js
- test_explosions.mjs
- Tile Listener Testing
- DialogOverlay.tsx
- verify_crop_rendering.js
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- index.js
- NPM Configuration Testing
- Electron Preload Script
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- .applyArmorAbsorption

## God Nodes (most connected - your core abstractions)
1. `Item` - 124 edges
2. `GameMap` - 118 edges
3. `cn()` - 115 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 85 edges
7. `Entity` - 80 edges
8. `engine` - 73 edges
9. `ItemDefs` - 61 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `testWindowOscillations()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_side_window.mjs → client/src/game/EntityFactory.js
- `test911()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_9_11.mjs → client/src/game/EntityFactory.js
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js

## Import Cycles
- None detected.

## Communities (165 total, 45 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.08
Nodes (33): inputContent, runInspector(), EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest() (+25 more)

### Community 1 - "UI Components"
Cohesion: 0.12
Nodes (19): AudioContext, AudioProvider(), CombatContext, GameMapContext, GameMapProvider(), logger, PlayerContext, NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame (+11 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.07
Nodes (41): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+33 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (6): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), gameMap, generator, generator

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (19): NPCAI, RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getBeelineIntent() (+11 more)

### Community 6 - "Action Intent System"
Cohesion: 0.07
Nodes (21): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, Vision, IntentQueue, AISystem, AudioSystem (+13 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.16
Nodes (7): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename, runTest()

### Community 8 - "Tooltip Components"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (22): TurretAI, createItemFromDef(), ItemDefs, FireMode, getFuelValue(), SafeEventEmitter, TurnProcessingUtils, __dirname (+14 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (33): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+25 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.08
Nodes (12): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS (+4 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.04
Nodes (33): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, InventoryContainer, LightEmitter, Movable (+25 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.07
Nodes (21): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+13 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.15
Nodes (9): InventoryExtensionWindowProps, PlayerSkillsWindowProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps, GridSlotSizeConfig, useGridSlotSize(), useWindowSize() (+1 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.05
Nodes (18): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), TemplateMapGenerator, isInsideBuilding(), verifyMap4(), isInsideBuilding() (+10 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+17 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (8): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 23 - "Door"
Cohesion: 0.14
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 24 - "Turret Combat Logic"
Cohesion: 0.09
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+14 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (10): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+2 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (34): getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, Badge(), BadgeProps, badgeVariants, Breadcrumb, BreadcrumbEllipsis() (+26 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.12
Nodes (3): WorldManager, assert(), verify()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "Template and World Config"
Cohesion: 0.17
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gen, generatorTemplates, mapData, northX (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.12
Nodes (8): DevConsole(), main(), runTests(), assert(), verify(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.20
Nodes (9): ActionContext, ActionProvider(), PlayerProvider(), dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemOverrides(), getCorpseOverrides(), ZombieCorpseConfig (+1 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.20
Nodes (6): getSightRangeForHour(), LineOfSight, main(), main(), main(), test()

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (26): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage, btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid() (+18 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.12
Nodes (13): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes() (+5 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 45 - "Asset Image Loader"
Cohesion: 0.18
Nodes (4): INIT_STATES, EventEmitter, assert(), verify()

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (22): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+14 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (5): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

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
Cohesion: 0.23
Nodes (4): Item, TestEntity, assert(), verify()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.13
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (10): Item, MeleeWeapon, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testWindowOscillations(), test911() (+2 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (33): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+25 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.09
Nodes (42): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+34 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.06
Nodes (30): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile (+22 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.27
Nodes (9): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, EffectRenderer (+1 more)

### Community 79 - "Container Serialization Tests"
Cohesion: 0.25
Nodes (8): CraftingRecipes, runTest(), runVerification(), assert(), verify(), runTest(), hammerRecipe, hatchetRecipe

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
Cohesion: 0.12
Nodes (3): COMPONENT_NAME_BY_CTOR, assert(), verify()

### Community 85 - "Item Power Tests"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 90 - "Weather Management System"
Cohesion: 0.20
Nodes (4): logger, Quadrant, Row, slope()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.12
Nodes (13): OptionsWindow(), useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent (+5 more)

### Community 93 - "Command UI Components"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 94 - "Dropdown UI Components"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.11
Nodes (15): MainMenuWindow(), formatTimestamp(), SaveGameWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore (+7 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 101 - "Table UI Components"
Cohesion: 0.07
Nodes (29): testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, Rarity (+21 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.13
Nodes (6): LootProgression, MapProgression, BaseMapGenerator, ScenarioMapGenerator, gameRandom, makeSeededRandom()

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.05
Nodes (20): AIState, Burnable, Rabbit, SequencerAction, gm, serialized, aiComp, ent (+12 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 116 - "Map Transition Verification"
Cohesion: 0.11
Nodes (11): isInsideTollGate(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, m1, m2, m3 (+3 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "test_save_compression.js"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 120 - "Custom React Hooks"
Cohesion: 0.05
Nodes (28): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+20 more)

### Community 123 - "Storage Compression Testing"
Cohesion: 0.09
Nodes (22): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+14 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "gridItems"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 134 - "verify_army_tent.js"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 145 - "verify_crop_rendering.js"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 149 - "index.js"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **769 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+764 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Game Engine Context`, `Event Emitter Utility`, `Inventory and Skill Windows`, `Entity and Item Types`, `Shop and Pricing Config`, `verify_crop_rendering.js`, `Character and Menu Windows`, `index.js`, `Turret Combat Logic`, `Sidebar UI Components`, `Dialog and Button UI`, `Loot Generation System`, `Dialog UI Components`, `Menubar UI Components`, `Entity Mocking System`, `Save Game Management`, `Form UI Components`, `Toast Notification State`, `Carousel UI Components`, `Toast UI Components`, `Chart UI Components`, `Dropdown UI Components`, `Item Stacking Verification`, `sheet.tsx`, `Inventory Item Management`, `test_save_compression.js`, `OTP Input Components`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Item Metadata and Traits` to `Item Components`, `UI Components`, `Item Interaction Logic`, `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `Map Template Generation`, `Game Map Management`, `World Progression and Spawning`, `Turret Combat Logic`, `Inventory Management System`, `Options and Crafting UI`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Crafting Recipe Verification`, `Door Interaction Logic`, `Toast UI Components`, `World Object Spawning`, `Container Serialization Tests`, `Item Power Tests`, `Crop Growth Verification`, `Table UI Components`, `Starting Road Generation`, `Winding Road Generation`, `Custom React Hooks`, `Storage Compression Testing`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `InventoryManager` connect `Inventory Management System` to `UI Components`, `Table UI Components`, `Shop and Log UI`, `Tooltip Components`, `World Object Spawning`, `Item Metadata and Traits`, `Container Serialization Tests`, `Item Power Tests`, `Inventory Persistence Tests`, `Map Generation Config`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _778 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11707317073170732 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._