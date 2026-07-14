# Graph Report - AndroidBuilder  (2026-07-14)

## Corpus Check
- 515 files · ~5,935,149 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3245 nodes · 8062 edges · 199 communities (142 shown, 57 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf245c0e`
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
- ConfigManager
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- diagnose_sidestep3.mjs
- ScenarioMapGenerator.js
- NPM Configuration Testing
- test_shopkeeper_hostility.mjs
- verify_army_tent.js
- Electron Preload Script
- test_exhaustive_los.js
- test_exhaustive_los_85.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_save_compression.js
- log
- verify_firefighter_spawn.js
- ImageLoader.js
- verify_worldmanager_populate_p4_02.mjs
- tmp_verify_fix.js
- context-menu.tsx
- .addItem
- alert-dialog.tsx
- verify_bookstats_init_derived.mjs
- TurretCombat.js
- EventRunner.js
- runTest
- test_safe_fix.js
- tmp_verify_clip.js
- .generateZombieLoot
- .dropScent
- test_shopkeeper_hostility.mjs
- verify_loot_constraints.js
- migrateEvents.js
- verify_gamemap_fromjson_dedup_p4_04.mjs
- GameEventLog.tsx
- avatar.tsx
- verify_flee_recovery.mjs
- GameEvent
- tmp_verify_zombie_loot.mjs
- Quadrant

## God Nodes (most connected - your core abstractions)
1. `Item` - 127 edges
2. `GameMap` - 118 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 88 edges
7. `engine` - 80 edges
8. `Entity` - 80 edges
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

## Communities (199 total, 57 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.12
Nodes (27): EntityFactory, markHeardIfInRange(), addPlayer(), addPlayer(), testCornerBug(), testDiagonalBug(), build(), run() (+19 more)

### Community 1 - "UI Components"
Cohesion: 0.28
Nodes (5): AISystem, CombatSystem, MovementSystem, VisionSystem, cases

### Community 3 - "Game Engine Context"
Cohesion: 0.20
Nodes (6): PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, assert(), verify()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.22
Nodes (3): createItemFromDef(), LootGenerator, isInsideAnyBuilding()

### Community 5 - "NPC AI Behavior"
Cohesion: 0.10
Nodes (14): RabbitAI, floodFill(), getBeelineIntent(), getGreedyHuntIntent(), getMeleeReach(), huntPlayer(), investigate(), tryFollowScent() (+6 more)

### Community 6 - "Action Intent System"
Cohesion: 0.04
Nodes (47): AITargeting, log, TurretAI, MapProgression, getSightRangeForHour(), EntityType, NPCTypes, engine (+39 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (15): DevConsoleProps, DevConsoleShopManager(), TabType, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem (+7 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (34): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+26 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (37): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InventoryPanel(), TollWindow(), TollWindowProps (+29 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.03
Nodes (56): BlueprintRegistry, ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health (+48 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.11
Nodes (9): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, AudioSystem, DestructionSystem, MockTile, runTest() (+1 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (3): isInsideCompound(), TemplateMapGenerator, generator

### Community 19 - "Character and Menu Windows"
Cohesion: 0.12
Nodes (24): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+16 more)

### Community 20 - "Game Map Management"
Cohesion: 0.12
Nodes (14): InventoryExtensionWindowProps, PlayerSkillsWindowProps, BeltContainerPanel(), BeltContainerPanelProps, DragPreviewLayer(), GridSizeContext, GridSizeContextType, GridSizeProvider() (+6 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.07
Nodes (37): InfectionHUD(), MapInterface(), getAdjustedBgColor(), UniversalGrid(), ActionContext, ActionProvider(), AudioProvider(), CameraProvider() (+29 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (6): GameInitializationManager, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (34): JournalUI(), TradeDialog(), TradeDialogProps, Badge(), BadgeProps, badgeVariants, Breadcrumb, BreadcrumbEllipsis() (+26 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.12
Nodes (8): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, assert()

### Community 32 - "Container Grid Logic"
Cohesion: 0.17
Nodes (17): getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, FloatingContainer() (+9 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

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
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.12
Nodes (30): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES (+22 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 47 - "Game Engine State"
Cohesion: 0.19
Nodes (7): LineOfSight, slope(), main(), main(), main(), testWindowSide(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.10
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.29
Nodes (3): testECSRefactor(), testPhase1(), runVerification()

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
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.09
Nodes (29): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), AttachmentSlot, AttachmentSlotProps, EquipmentSlot, EquipmentSlotProps (+21 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 66 - "Form UI Components"
Cohesion: 0.20
Nodes (4): getProgressionForMap(), AnimalSpawner, NPCSpawner, runDebug()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+26 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.12
Nodes (14): ZombieTooltip(), ZombieTooltipProps, LootProgression, ZombieTypes, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS (+6 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 77 - "Item Factory Methods"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 78 - "Item Movement Logic"
Cohesion: 0.11
Nodes (5): ExplosionIntent, IntentQueue, ExplosionSystem, FireSystem, runTests()

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

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.17
Nodes (11): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, gen, generatorTemplates, mapData, northX, roadTemplate (+3 more)

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.11
Nodes (7): Rabbit, map, mockTile, npc, player, rabbit, zombie

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 90 - "Weather Management System"
Cohesion: 0.17
Nodes (14): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+6 more)

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
Cohesion: 0.13
Nodes (9): OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString(), decompressString(), GameSaveSystem, IndexedDBStore (+1 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.05
Nodes (26): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Checkbox (+18 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.22
Nodes (3): TurnManager, assert(), verify()

### Community 101 - "Table UI Components"
Cohesion: 0.05
Nodes (47): DevConsole(), getBrainstemColor(), getBrainstemStewColors(), ZombieCorpseConfig, CraftingRecipes, getItemName(), ItemDefs, CategoryDisplayName (+39 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.12
Nodes (3): BaseMapGenerator, RoadGenerator, ScenarioMapGenerator

### Community 106 - "Loot Generation Testing"
Cohesion: 0.15
Nodes (11): CharacterRegistryWindow(), CharacterRegistry, DEFAULT_PLAYER_STATS, idbStore, clear(), confirm(), setItem(), store (+3 more)

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.17
Nodes (15): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, applySurvivalCascade(), deriveSecondaryStats() (+7 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.11
Nodes (34): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), MainMenuWindow() (+26 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 115 - "Book Stats Initialization"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 116 - "Map Transition Verification"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 119 - "EquippedArmor"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 120 - "Custom React Hooks"
Cohesion: 0.50
Nodes (3): mockEngine, mockSprites, visibilitySet

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 126 - "Road Generation Logic"
Cohesion: 0.26
Nodes (4): NPCAI, getNPCType(), assert(), verify()

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
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.11
Nodes (17): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+9 more)

### Community 136 - "Extended LOS Testing"
Cohesion: 0.19
Nodes (11): compare(), evalAll(), evalCondition(), changeEvents, ctx, fakeInventoryManager, json, qs (+3 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "verify_loot_constraints.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 141 - "test_stacking_bug.mjs"
Cohesion: 0.20
Nodes (4): expected, loadFromGround(), makeItem(), verifyLoadSwaps()

### Community 150 - "ScenarioMapGenerator.js"
Cohesion: 0.23
Nodes (5): runContainerTests(), runTest(), testResults, testSerialization(), results

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.24
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), testZombieFireDeath(), runTest(), warnCalls

### Community 153 - "verify_army_tent.js"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 170 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 172 - "verify_firefighter_spawn.js"
Cohesion: 0.12
Nodes (11): findSouthTransitionTile(), isInsideTollGate(), ZombieSpawner, main(), buildings, m1, m2, m3 (+3 more)

### Community 174 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 176 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 177 - ".addItem"
Cohesion: 0.20
Nodes (4): run(), run(), assert(), verify()

### Community 178 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 179 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 180 - "TurretCombat.js"
Cohesion: 0.42
Nodes (8): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile

### Community 181 - "EventRunner.js"
Cohesion: 0.25
Nodes (4): log, applyItemGrants(), fakeInv, registry

### Community 182 - "runTest"
Cohesion: 0.29
Nodes (5): runReproduction(), runTest(), testCharger(), assert(), verify()

### Community 183 - "test_safe_fix.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 184 - "tmp_verify_clip.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 186 - ".dropScent"
Cohesion: 0.40
Nodes (4): cheb(), runTurns(), cheb(), runTurns()

### Community 187 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 190 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 191 - "migrateEvents.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 193 - "GameEventLog.tsx"
Cohesion: 0.67
Nodes (3): GameEventLog(), GameEventLogProps, getLogColor()

### Community 194 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 196 - "GameEvent"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

### Community 197 - "tmp_verify_zombie_loot.mjs"
Cohesion: 0.50
Nodes (3): clothingKeys, lootGen, subtypes

## Knowledge Gaps
- **833 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+828 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `verify_army_tent.js`, `Shop and Log UI`, `Inventory and Skill Windows`, `Character and Menu Windows`, `Game Map Management`, `World Progression and Spawning`, `Sidebar UI Components`, `Container Grid Logic`, `context-menu.tsx`, `Blueprint and Inventory Registry`, `alert-dialog.tsx`, `Menubar UI Components`, `Entity Mocking System`, `Save Game Management`, `GameEventLog.tsx`, `avatar.tsx`, `Toast Notification State`, `Toast UI Components`, `Item Factory Methods`, `context-menu.tsx`, `Item Stacking Verification`, `Zombie Line-of-Sight Testing`, `Navigation Menu Components`, `Book Stats Initialization`, `Map Transition Verification`, `EquippedArmor`, `OTP Input Components`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Book Stats Initialization`, `OTP Input Components`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react` connect `Book Stats Initialization` to `Registry Storage Tests`, `Toast Notification State`, `External Dependencies`, `Inventory and Skill Windows`, `World Progression and Spawning`, `Weather Management System`, `Sidebar UI Components`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _843 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `NPC AI Behavior` be split into smaller, more focused modules?**
  _Cohesion score 0.0975177304964539 - nodes in this community are weakly interconnected._