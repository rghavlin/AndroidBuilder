# Graph Report - AndroidBuilder  (2026-07-13)

## Corpus Check
- 500 files · ~4,415,894 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3061 nodes · 7772 edges · 167 communities (121 shown, 46 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b62f4202`
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
- Mock Entity System
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
- .applyArmorAbsorption
- Extended LOS Testing
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- verify_loot_constraints.js
- Tile Listener Testing
- test_noise.js
- DialogOverlay.tsx
- tmp_verify_loot.js
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- MockCanvasContext
- NPM Configuration Testing
- verify_army_tent.js
- Electron Preload Script
- MockGameMap
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- verify_random_map_loops.mjs

## God Nodes (most connected - your core abstractions)
1. `Item` - 126 edges
2. `GameMap` - 118 edges
3. `cn()` - 115 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 87 edges
7. `Entity` - 80 edges
8. `engine` - 74 edges
9. `ItemDefs` - 62 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `main()` --references--> `json`  [EXTRACTED]
  scratch/check_lab_map.js → verify_phase_2.mjs
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs

## Import Cycles
- None detected.

## Communities (167 total, 46 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.09
Nodes (34): inputContent, runInspector(), EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest() (+26 more)

### Community 1 - "UI Components"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (37): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+29 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.14
Nodes (5): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 5 - "NPC AI Behavior"
Cohesion: 0.10
Nodes (16): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getBeelineIntent(), getGreedyHuntIntent(), getMeleeReach() (+8 more)

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (13): DamageIntent, DestroyIntent, MoveIntent, IntentQueue, AISystem, CombatSystem, DestructionSystem, MovementSystem (+5 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.33
Nodes (3): Inventory, __dirname, __filename

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (15): BlueprintRegistry, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical() (+7 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, Entity, assert(), verify()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (18): TurretAI, getItemName(), ItemDefs, readableBooks, expected, loadFromGround(), makeItem(), generator (+10 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (49): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel() (+41 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (36): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+28 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.07
Nodes (20): AIBehavior, Health, LightEmitter, Movable, Position, Renderable, aiCustom, aiDefault (+12 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (22): tryFollowScent(), ScentTrail, gm, lead, player, trail, zs, cheb() (+14 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (13): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), TemplateMapGenerator, main(), isInsideBuilding(), verifyMap4() (+5 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (40): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+32 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.21
Nodes (4): getProgressionForMap(), AnimalSpawner, NPCSpawner, runVerification()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (6): GameInitializationManager, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 23 - "Door"
Cohesion: 0.10
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.10
Nodes (7): ActionPoints, InventoryContainer, RpgStats, SurvivalStats, Vision, COMPONENT_CLASSES, player

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (62): AttachmentSlot, AttachmentSlotProps, FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, AccordionContent, AccordionItem, AccordionTrigger (+54 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.10
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.12
Nodes (11): findSouthTransitionTile(), isInsideTollGate(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, m1, m2 (+3 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 31 - "Template and World Config"
Cohesion: 0.17
Nodes (11): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, gen, generatorTemplates, mapData, northX, roadTemplate (+3 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.18
Nodes (5): DevConsole(), main(), runTests(), MockGameMap, testWallGapFix()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.24
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.19
Nodes (13): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+5 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (28): btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta, createEmptyGrid(), createEmptyTile(), DialogEventDef (+20 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.18
Nodes (5): NPCAI, getNPCType(), NPCTypes, assert(), verify()

### Community 45 - "Asset Image Loader"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.06
Nodes (28): CharacterCreator(), PlayerSkillsUI(), AITargeting, getZombieType(), TurnManager, spitAtPlayer(), CombatResolver, attacker (+20 more)

### Community 47 - "Game Engine State"
Cohesion: 0.22
Nodes (5): LineOfSight, main(), main(), testWindowSide(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.16
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

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
Cohesion: 0.22
Nodes (12): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+4 more)

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
Cohesion: 0.04
Nodes (37): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+29 more)

### Community 66 - "Form UI Components"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.24
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), testZombieFireDeath(), runTest(), warnCalls

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 78 - "Item Movement Logic"
Cohesion: 0.08
Nodes (28): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, engine, CraftingRecipes, SimulationManager, EMPTY_CATALOG (+20 more)

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
Cohesion: 0.32
Nodes (3): OptionsWindow(), StartMenu(), IndexedDBStore

### Community 86 - "Attribute Progression System"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 90 - "Weather Management System"
Cohesion: 0.09
Nodes (6): Burnable, Rabbit, SequencerAction, gm, serialized, testCases

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 93 - "Command UI Components"
Cohesion: 0.14
Nodes (5): AudioSystem, ExplosionSystem, FireSystem, runTest(), testPhase1()

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.10
Nodes (16): CharacterRegistryWindow(), CharacterRegistry, compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear() (+8 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.11
Nodes (18): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, AttributeProgressionManager (+10 more)

### Community 101 - "Table UI Components"
Cohesion: 0.08
Nodes (31): testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode, FUEL_VALUES, getFuelValue(), ItemCategory (+23 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.28
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.12
Nodes (14): NoiseEvent, MapProgression, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, INIT_STATES (+6 more)

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.10
Nodes (8): Consumable, EquippedArmor, Item, MeleeWeapon, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 119 - "EquippedArmor"
Cohesion: 0.17
Nodes (5): getSightRangeForHour(), logger, Quadrant, slope(), main()

### Community 120 - "Custom React Hooks"
Cohesion: 0.07
Nodes (72): DefeatDialog(), EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent() (+64 more)

### Community 122 - "Mock Entity System"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 123 - "Storage Compression Testing"
Cohesion: 0.06
Nodes (28): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+20 more)

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
Cohesion: 0.20
Nodes (3): PlaceIcon, testECSRefactor(), runTest()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "verify_loot_constraints.js"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 143 - "test_noise.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 150 - "MockCanvasContext"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **776 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+771 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Game Engine Context`, `Inventory and Skill Windows`, `Entity and Item Types`, `test_noise.js`, `Shop and Pricing Config`, `Character and Menu Windows`, `Sidebar UI Components`, `Dialog and Button UI`, `Asset Image Loader`, `Dialog UI Components`, `Menubar UI Components`, `Entity Mocking System`, `Carousel UI Components`, `Toast UI Components`, `Attribute Progression System`, `Chart UI Components`, `Item Stacking Verification`, `sheet.tsx`, `Inventory Item Management`, `Custom React Hooks`, `Storage Compression Testing`, `OTP Input Components`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Chart UI Components`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `AI and Inventory Systems` to `Item Components`, `Item Interaction Logic`, `Action Intent System`, `Tooltip Components`, `Item Metadata and Traits`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `Map Template Generation`, `World Progression and Spawning`, `Inventory Management System`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Loot Generation System`, `Developer Console UI`, `Inventory Persistence Tests`, `Crafting Recipe Verification`, `World Object Spawning`, `Item Movement Logic`, `Crop Growth Verification`, `Command UI Components`, `Table UI Components`, `Starting Road Generation`, `Winding Road Generation`, `Custom React Hooks`, `Storage Compression Testing`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _785 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0859538784067086 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.053923541247484906 - nodes in this community are weakly interconnected._