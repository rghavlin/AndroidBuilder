# Graph Report - AndroidBuilder  (2026-07-09)

## Corpus Check
- 491 files · ~461,026 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3025 nodes · 7669 edges · 174 communities (118 shown, 56 thin omitted)
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
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Map Loop Verification
- NPM Configuration Testing
- Electron Preload Script
- Noise Assertion Tests
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- .applyArmorAbsorption
- verify_firefighter_spawn.js
- .updateCropMetadata
- ScenarioMapGenerator.js
- ZombieTypes.js
- alert.tsx
- .setItemsOnTile
- avatar.tsx
- tmp_verify_fix.js

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
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `main()` --references--> `json`  [EXTRACTED]
  scratch/check_lab_map.js → verify_phase_2.mjs
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `runTest()` --references--> `json`  [EXTRACTED]
  verify_saveload.mjs → verify_phase_2.mjs
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs

## Import Cycles
- None detected.

## Communities (174 total, 56 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.04
Nodes (38): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, InventoryContainer, Item, LightEmitter (+30 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (20): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+12 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.09
Nodes (36): ActionContext, ActionProvider(), AudioProvider(), CombatContext, CombatProvider(), resolveTileTarget(), GameMapContext, GameMapProvider() (+28 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (32): AITargeting, TurretAI, ItemDefs, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode, FUEL_VALUES (+24 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (20): NPCAI, RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getBeelineIntent() (+12 more)

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (15): DamageIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+7 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.13
Nodes (17): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps (+9 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.24
Nodes (11): FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, useAction(), GridSlotSizeConfig, useGridSlotSize(), getScaleFactor() (+3 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (36): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel() (+28 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 14 - "Rabbit AI State"
Cohesion: 0.05
Nodes (20): AIState, Burnable, Rabbit, SequencerAction, gm, serialized, aiComp, ent (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.16
Nodes (22): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+14 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.11
Nodes (22): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+14 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (39): inputContent, runInspector(), EntityFactory, tryFollowScent(), addPlayer(), addPlayer(), testCornerBug(), testDiagonalBug() (+31 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.11
Nodes (5): isInsideCompound(), TemplateMapGenerator, isInsideBuilding(), verifyMap4(), generator

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+17 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.17
Nodes (6): getProgressionForMap(), LootProgression, MapProgression, AnimalSpawner, NPCSpawner, runDebug()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 23 - "Core Camera and Context"
Cohesion: 0.11
Nodes (13): MainMenuWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+5 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (15): gridItems(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+7 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (14): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+6 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.06
Nodes (36): EarbucksShopWindowProps, ShopItemRowProps, getSightRangeForHour(), engine, SimulationManager, NOTE: Structural damage (hp reduction, break/open flags) was already, NOTE: do NOT force itemsModified for every container/attachment item., logger (+28 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, previewDerivedStats()

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.11
Nodes (7): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), main(), isInsideBuilding(), runTest(), verifyRandomBuildings()

### Community 31 - "Template and World Config"
Cohesion: 0.17
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gen, generatorTemplates, mapData, northX (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.09
Nodes (28): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), ButtonProps (+20 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.06
Nodes (10): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, ImageLoader, MockCanvasContext (+2 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, slope(), main(), main(), main(), testWindowSide(), test()

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (25): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage, btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid() (+17 more)

### Community 42 - "Map Data Export"
Cohesion: 0.07
Nodes (24): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.13
Nodes (11): CraftingManager, getItemName(), cm, container, inContainer, mockInv, singleItem, stack (+3 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.06
Nodes (22): createItemFromDef(), RarityWeights, FOOD_SCARCITY, getFoodRejectionChance(), LOOT_CONSTANTS, LootGenerator, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES (+14 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.17
Nodes (6): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename

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
Cohesion: 0.18
Nodes (4): DevConsoleProps, TabType, CardFooter, Input

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

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
Cohesion: 0.13
Nodes (8): DevConsole(), exportScenario(), main(), assert(), verify(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.18
Nodes (14): EarbucksDisplay(), EarbucksShopWindow(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps (+6 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.22
Nodes (3): BaseMapGenerator, gameRandom, makeSeededRandom()

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (33): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+25 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.06
Nodes (33): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+25 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 79 - "Container Serialization Tests"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

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
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 85 - "Item Power Tests"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.11
Nodes (25): StartModeDialog(), StartModeDialogProps, GameContext, GameContextInner(), GameProvider(), logger, hasItemsInside(), InventoryProvider() (+17 more)

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.12
Nodes (13): OptionsWindow(), useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent (+5 more)

### Community 93 - "Command UI Components"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 94 - "Dropdown UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.47
Nodes (4): hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 98 - "Item Stacking Verification"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "Sheet UI Components"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 101 - "Table UI Components"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

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
Cohesion: 0.10
Nodes (15): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map, player, shopkeeper (+7 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 120 - "Custom React Hooks"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 123 - "Storage Compression Testing"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 128 - "API Query Client"
Cohesion: 0.24
Nodes (10): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior, base64ToBuffer(), bufferToBase64(), compressString() (+2 more)

### Community 129 - "String Compression Utilities"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 157 - "Noise Assertion Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 169 - "Place Icon Serialization"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 171 - "verify_firefighter_spawn.js"
Cohesion: 0.18
Nodes (5): ZombieSpawner, runVerification(), MockMap, mockPlayer, verifySpawning()

### Community 179 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 180 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 181 - ".setItemsOnTile"
Cohesion: 0.10
Nodes (7): PlayerSkills, PlayerWallet, INIT_STATES, runTest(), testECSRefactor(), testPhase1(), runTest()

### Community 185 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 188 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **768 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+763 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Dialog and Button UI` to `UI Components`, `String Compression Utilities`, `Food Scarcity Logic`, `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Character and Menu Windows`, `Action Queue Processing`, `Sidebar UI Components`, `Options and Crafting UI`, `Place Icon Serialization`, `ZombieTypes.js`, `alert.tsx`, `Developer Console UI`, `Dialog UI Components`, `Menubar UI Components`, `avatar.tsx`, `Save Game Management`, `Form UI Components`, `Toast Notification State`, `Carousel UI Components`, `Toast UI Components`, `Container Serialization Tests`, `Canvas Context Mocking`, `Chart UI Components`, `Command UI Components`, `Dropdown UI Components`, `Table UI Components`, `Navigation Menu Components`, `Custom React Hooks`, `OTP Input Components`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Loot Generation System` to `Game Engine Context`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Item Metadata and Traits`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Map Template Generation`, `Game Map Management`, `World Progression and Spawning`, `Inventory Management System`, `Action Queue Processing`, `Map Generation Config`, `Road and Town Generation`, `Map Editor Tools`, `Map Data Export`, `Crafting Manager Logic`, `Blueprint and Inventory Registry`, `Entity Mocking System`, `Scenario Map Generation`, `Toast UI Components`, `World Object Spawning`, `Item Movement Logic`, `Item Power Tests`, `Attribute Progression System`, `Crop Growth Verification`, `Safe Grid Data Testing`, `Map Transition Verification`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `react` connect `Chart UI Components` to `Game Engine Context`, `Toast Notification State`, `Toast UI Components`, `External Dependencies`, `Sidebar UI Components`, `Save Game Management`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _777 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0352233676975945 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07258064516129033 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.056189640035118525 - nodes in this community are weakly interconnected._