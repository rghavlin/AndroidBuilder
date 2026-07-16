# Graph Report - AndroidBuilder  (2026-07-15)

## Corpus Check
- 518 files · ~5,965,718 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3256 nodes · 8080 edges · 175 communities (129 shown, 46 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89a0df2a`
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
- MapCanvas.jsx
- .getBeltContainers
- react
- RoadNetwork
- OTP Input Components
- test_safe_fix.js
- ScenarioMapGenerator.js
- Split Road Generation
- API Query Client
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- test_noise.js
- verify_army_tent.js
- .applyArmorAbsorption
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- test_exhaustive_los.js
- test_exhaustive_los_85.js
- Tile Listener Testing
- Row
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- NPM Configuration Testing
- test_shopkeeper_hostility.mjs
- verify_army_tent.js
- Electron Preload Script
- command.tsx
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_noise.js
- verify_firefighter_spawn.js
- verify_worldmanager_populate_p4_02.mjs
- verify_bookstats_init_derived.mjs
- verify_firefighter_spawn.js
- verify_p5_01_event_emitter.mjs
- .dropScent

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
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json

## Import Cycles
- None detected.

## Communities (175 total, 46 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.09
Nodes (30): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), testWindowOscillations() (+22 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (24): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.14
Nodes (8): Item, MeleeWeapon, EntityType, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., findAttackSlotPath(), isMeleeAttackPosition(), runTest()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.11
Nodes (12): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideTollGate(), ZombieReplenishmentSystem, applyItemGrants(), runTest() (+4 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.05
Nodes (30): RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent() (+22 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (38): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+30 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.08
Nodes (34): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+26 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.11
Nodes (15): DamageIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+7 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.15
Nodes (9): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTests() (+1 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (58): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InfectionHUD(), StartModeDialog(), StartModeDialogProps (+50 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (15): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding(), verifyMap4() (+7 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.17
Nodes (9): CharacterRegistryWindow(), CreditsWindow(), StartMenuProps, CharacterRegistry, clear(), confirm(), setItem(), store (+1 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.11
Nodes (18): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), JournalUI() (+10 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.13
Nodes (6): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug()

### Community 23 - "Door"
Cohesion: 0.08
Nodes (13): Door, door, gm, player, z, testZombieBug(), door, engineMock (+5 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.06
Nodes (12): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), run(), run(), testSerialization(), assert() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (90): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar() (+82 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.11
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.21
Nodes (10): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), invertedImageCache (+2 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.13
Nodes (3): COMPONENT_NAME_BY_CTOR, assert(), verify()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.17
Nodes (12): compare(), evalAll(), evalCondition(), log, changeEvents, ctx, fakeInventoryManager, json (+4 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.18
Nodes (14): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.12
Nodes (30): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES (+22 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.09
Nodes (17): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager, getItemName(), getFuelValue() (+9 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 47 - "Game Engine State"
Cohesion: 0.20
Nodes (6): getSightRangeForHour(), LineOfSight, main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (5): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.24
Nodes (5): MainMenuWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

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
Nodes (7): OptionsWindow(), useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.19
Nodes (12): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, Theme (+4 more)

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (8): getProgressionForMap(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, ZombieSpawner, runVerification()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (33): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+25 more)

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
Nodes (7): exportScenario(), main(), assert(), verify(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.29
Nodes (8): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, assert(), verify()

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

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
Cohesion: 0.12
Nodes (13): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runTest(), clear(), getItem() (+5 more)

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

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 105 - "Winding Road Generation"
Cohesion: 0.14
Nodes (5): BaseMapGenerator, ScenarioMapGenerator, logger, gameRandom, makeSeededRandom()

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
Cohesion: 0.03
Nodes (46): DevConsole(), ActionPoints, AIBehavior, AIState, Burnable, Consumable, EquippedArmor, Health (+38 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "Map Transition Verification"
Cohesion: 0.08
Nodes (10): Rabbit, gm, serialized, map, mockTile, npc, player, rabbit (+2 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "MapCanvas.jsx"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 121 - ".getBeltContainers"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "test_safe_fix.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 126 - "ScenarioMapGenerator.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.22
Nodes (4): Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.05
Nodes (44): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+36 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 143 - "Row"
Cohesion: 0.18
Nodes (4): logger, Quadrant, Row, slope()

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.06
Nodes (30): AITargeting, TurretAI, _warnedCatchAllProps, ItemDefs, testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot (+22 more)

### Community 153 - "verify_army_tent.js"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 157 - "command.tsx"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 172 - "verify_firefighter_spawn.js"
Cohesion: 0.17
Nodes (7): findSouthTransitionTile(), buildings, m1, m2, m3, r1, r2

### Community 174 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 175 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 178 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 186 - ".dropScent"
Cohesion: 0.06
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

## Knowledge Gaps
- **834 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+829 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `verify_army_tent.js`, `Shop and Log UI`, `Inventory and Skill Windows`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Character and Menu Windows`, `World Progression and Spawning`, `Sidebar UI Components`, `command.tsx`, `Loot Generation System`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Save Game Management`, `Scenario Map Generation`, `Toast Notification State`, `context-menu.tsx`, `Item Lifecycle Management`, `Item Stacking Verification`, `Book Stats Initialization`, `.getBeltContainers`, `OTP Input Components`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Entity Mocking System`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `react` connect `Entity Mocking System` to `External Dependencies`, `Entity Spawning and Scent`, `verify_army_tent.js`, `Toast Notification State`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _844 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06747638326585695 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._