# Graph Report - AndroidBuilder  (2026-07-08)

## Corpus Check
- 491 files · ~459,231 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3018 nodes · 7649 edges · 191 communities (131 shown, 60 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ba8b0bd`
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
- Noise System Testing
- Noise Assertion Tests
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- .applyArmorAbsorption
- verify_firefighter_spawn.js
- .toJSON
- ScenarioMapGenerator.js
- verify_crop_rendering.js
- test_shopkeeper_hostility.mjs
- verify_entity_rendering_optimizations.mjs
- ZombieTypes.js
- alert.tsx
- verify_loot_constraints.js
- verify_direct_load_capacity_p3_07.mjs
- avatar.tsx
- removeDestroyedTurret
- tmp_verify_fix.js
- verify_map4_frontage.js
- .processTurn

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

## Communities (191 total, 60 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.03
Nodes (38): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, InventoryContainer, Item, LightEmitter (+30 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (48): getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar() (+40 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (52): lastRainUpdate, rainParticles, warnedMalformedEntityIds, StartModeDialog(), StartModeDialogProps, ActionContext, ActionProvider(), AudioContext (+44 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (35): CraftingRecipes, createItemFromDef(), getItemName(), ItemDefs, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode (+27 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.07
Nodes (22): NPCAI, RabbitAI, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity() (+14 more)

### Community 6 - "Action Intent System"
Cohesion: 0.07
Nodes (16): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AudioSystem, DestructionSystem, ExplosionSystem (+8 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.06
Nodes (48): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+40 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (12): InventoryExtensionWindowProps, PlayerSkillsWindowProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps, GridSlotSizeConfig (+4 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.22
Nodes (9): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, isUncommonDrop (+1 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (34): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryPanel(), TollWindow() (+26 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.11
Nodes (16): EntityType, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testWindowOscillations(), testWindowBug(), test911() (+8 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.03
Nodes (40): AIState, Burnable, Rabbit, SequencerAction, gm, serialized, aiComp, ent (+32 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.13
Nodes (26): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+18 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.13
Nodes (27): EntityFactory, AISystem, tryFollowScent(), CombatSystem, MovementSystem, VisionSystem, testCornerBug(), testDiagonalBug() (+19 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.11
Nodes (3): isInsideCompound(), TemplateMapGenerator, verifyRandomBuildings()

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+17 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (5): getProgressionForMap(), LootProgression, MapProgression, AnimalSpawner, NPCSpawner

### Community 22 - "Game Initialization Manager"
Cohesion: 0.16
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 23 - "Core Camera and Context"
Cohesion: 0.14
Nodes (15): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), GameContextInner(), decompressString() (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.21
Nodes (8): gridItems(), FIRESTARTER_DEF_IDS, getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), invertedImageCache, resolveItemMeta(), TILE_ICON_RANK

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (23): SimulationManager, ScentTrail, gm, lead, player, trail, zs, cheb() (+15 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.09
Nodes (5): compressString(), WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.21
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, previewDerivedStats()

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.12
Nodes (6): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), main(), assert(), generator

### Community 31 - "Template and World Config"
Cohesion: 0.14
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, assert(), verify() (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.23
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.06
Nodes (10): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, ImageLoader, MockCanvasContext (+2 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.19
Nodes (7): getSightRangeForHour(), LineOfSight, main(), main(), main(), testWindowSide(), test()

### Community 41 - "Map Editor Tools"
Cohesion: 0.05
Nodes (32): DevConsole(), CameraProvider(), WeatherManager, btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid(), createEmptyTile() (+24 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.17
Nodes (3): COMPONENT_NAME_BY_CTOR, assert(), verify()

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.11
Nodes (13): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTests() (+5 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.30
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.15
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.22
Nodes (9): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify(), assert() (+1 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.12
Nodes (11): GroundManager, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical() (+3 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.19
Nodes (4): BaseMapGenerator, logger, gameRandom, makeSeededRandom()

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.16
Nodes (5): Door, door, gm, player, z

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.31
Nodes (10): calculateBaseTileSize(), TileTooltipOverlay(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+2 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 79 - "Container Serialization Tests"
Cohesion: 0.23
Nodes (5): runContainerTests(), runTest(), testResults, results, verifyLoadSwaps()

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

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

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
Cohesion: 0.18
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
Cohesion: 0.16
Nodes (9): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, m1, m2, m3, r1 (+1 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "App Entry and Error Handling"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 119 - "Scenario Storage Management"
Cohesion: 0.24
Nodes (6): ScenarioInfo, ScenarioPickerWindow(), ScenarioPickerWindowProps, electronStorage, idbStorage, ScenarioStorage

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

### Community 131 - "Event Emitter Utility"
Cohesion: 0.16
Nodes (4): INIT_STATES, EventEmitter, ZombieSpawner, runVerification()

### Community 135 - "Exhaustive LOS Testing"
Cohesion: 0.13
Nodes (6): logger, Quadrant, Row, slope(), map, MockGameMap

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "Map Row Management"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 145 - "Quadrant Transformation"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 156 - "Noise System Testing"
Cohesion: 0.43
Nodes (4): AITargeting, TurretAI, assert(), verify()

### Community 157 - "Noise Assertion Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 169 - "Place Icon Serialization"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 171 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 176 - "verify_crop_rendering.js"
Cohesion: 0.33
Nodes (5): EntityRenderer, mockEngine, mockSprites, visibilitySet, runTest()

### Community 177 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 178 - "verify_entity_rendering_optimizations.mjs"
Cohesion: 0.33
Nodes (4): mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 179 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 180 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 183 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 184 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 185 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 186 - "removeDestroyedTurret"
Cohesion: 0.67
Nodes (3): removeDestroyedTurret(), runTest(), warnCalls

### Community 188 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **766 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+761 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components` to `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `Map Row Management`, `HUD and Dialog UI`, `Quadrant Transformation`, `Character and Menu Windows`, `Sidebar UI Components`, `Options and Crafting UI`, `Dialog and Button UI`, `Place Icon Serialization`, `ZombieTypes.js`, `alert.tsx`, `Developer Console UI`, `Dialog UI Components`, `Menubar UI Components`, `avatar.tsx`, `Form UI Components`, `Toast Notification State`, `Carousel UI Components`, `Chart UI Components`, `Command UI Components`, `Dropdown UI Components`, `Sheet UI Components`, `Table UI Components`, `Navigation Menu Components`, `OTP Input Components`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `AI and Inventory Systems` to `Game Engine Context`, `Food Scarcity Logic`, `NPC AI Behavior`, `Action Intent System`, `Shop and Log UI`, `Item Metadata and Traits`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `Shop and Pricing Config`, `Map Template Generation`, `World Progression and Spawning`, `Map Generation Config`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Loot Generation System`, `Blueprint and Inventory Registry`, `Entity Mocking System`, `Crafting Recipe Verification`, `Ground Item Management`, `Scenario Map Generation`, `World Object Spawning`, `Container Serialization Tests`, `Item Power Tests`, `Item Lifecycle Management`, `Crop Growth Verification`, `Weapon Attachment Logic`, `Loot Generation Testing`, `Safe Grid Data Testing`, `Map Transition Verification`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `InventoryManager` connect `Inventory Management System` to `Ground Item Management`, `Game Engine Context`, `AI and Inventory Systems`, `Inventory Item Management`, `.toJSON`, `Item Movement Logic`, `Container Serialization Tests`, `Blueprint and Inventory Registry`, `Safe Grid Data Testing`, `Item Power Tests`, `Item Lifecycle Management`, `verify_direct_load_capacity_p3_07.mjs`, `Inventory Persistence Tests`, `Weapon Attachment Logic`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _775 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.034851485148514855 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.04731457800511509 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08870967741935484 - nodes in this community are weakly interconnected._