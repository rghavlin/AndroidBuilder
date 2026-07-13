# Graph Report - AndroidBuilder  (2026-07-13)

## Corpus Check
- 501 files · ~4,419,747 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3055 nodes · 7757 edges · 162 communities (115 shown, 47 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fde09b2c`
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
- Consumable
- EquippedArmor
- Custom React Hooks
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
- Mock Game Map
- verify_army_tent.js
- Extended LOS Testing
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- test_explosions.mjs
- Tile Listener Testing
- DialogOverlay.tsx
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- NPM Configuration Testing
- tmp_verify_fix.js
- Electron Preload Script
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- .onItemCrafted

## God Nodes (most connected - your core abstractions)
1. `Item` - 125 edges
2. `GameMap` - 118 edges
3. `cn()` - 115 edges
4. `EntityFactory` - 105 edges
5. `InventoryManager` - 90 edges
6. `createItemFromDef()` - 85 edges
7. `Entity` - 80 edges
8. `engine` - 74 edges
9. `ItemDefs` - 62 edges
10. `TemplateMapGenerator` - 53 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `runTests()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_explosions.mjs → client/src/game/EntityFactory.js
- `main()` --references--> `json`  [EXTRACTED]
  scratch/check_lab_map.js → verify_phase_2.mjs
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `runTest()` --references--> `json`  [EXTRACTED]
  verify_saveload.mjs → verify_phase_2.mjs

## Import Cycles
- None detected.

## Communities (162 total, 47 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.10
Nodes (27): EntityFactory, tryFollowScent(), addPlayer(), addPlayer(), testCornerBug(), testDiagonalBug(), build(), run() (+19 more)

### Community 1 - "UI Components"
Cohesion: 0.11
Nodes (24): CombatContext, resolveTileTarget(), GameMapContext, GameMapProvider(), logger, PlayerContext, NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, escalateFactionAgainstPlayer() (+16 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (39): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+31 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.06
Nodes (17): getFoodRejectionChance(), LootGenerator, findSouthTransitionTile(), isInsideAnyBuilding(), isInsideTollGate(), allErrors, generator, subtypes (+9 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.06
Nodes (25): PlayerProvider(), NPCAI, RabbitAI, getNPCType(), NPCTypes, getZombieType(), doorsForBuilding(), floodFill() (+17 more)

### Community 6 - "Action Intent System"
Cohesion: 0.21
Nodes (7): IntentQueue, AISystem, CombatSystem, MovementSystem, VisionSystem, markHeardIfInRange(), cases

### Community 7 - "Shop and Log UI"
Cohesion: 0.13
Nodes (9): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTest() (+1 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.05
Nodes (50): CraftingRecipes, createItemFromDef(), ItemDefs, CategoryDisplayName, EquipmentSlot, FireMode, FUEL_VALUES, getFuelValue() (+42 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (59): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, AttachmentSlot (+51 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (10): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, ImageLoader, MockCanvasContext (+2 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (25): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, FireSystem, actionQueue, activeZombie, diedAny (+17 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.05
Nodes (26): ActionPoints, AIBehavior, Health, InventoryContainer, LightEmitter, Movable, Position, Renderable (+18 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.14
Nodes (4): runTest(), testResults, CategoryPriority, testPhase1()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.13
Nodes (14): AITargeting, TurretAI, computeHearingZone(), cheb(), out(), run(), cheb(), runTurns() (+6 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (13): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), TemplateMapGenerator, main(), isInsideBuilding(), verifyMap4() (+5 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (38): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+30 more)

### Community 20 - "Game Map Management"
Cohesion: 0.19
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 21 - "World Progression and Spawning"
Cohesion: 0.12
Nodes (12): getProgressionForMap(), LootProgression, MapProgression, computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run (+4 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.08
Nodes (11): GameInitializationManager, INIT_STATES, ZombieSpawner, initManager, assert(), verify(), runVerification(), runDebug() (+3 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (24): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+16 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), run(), run(), testSerialization(), assert() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (65): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction (+57 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.10
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.14
Nodes (5): CharacterCreator(), PlayerSkillsUI(), TurnManager, AttributeProgressionManager, CombatResolver

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 31 - "Template and World Config"
Cohesion: 0.10
Nodes (14): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gm, wm (+6 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.15
Nodes (6): DevConsole(), main(), runTests(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

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

### Community 41 - "Map Editor Tools"
Cohesion: 0.10
Nodes (28): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage, btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES (+20 more)

### Community 44 - "Loot Generation System"
Cohesion: 0.18
Nodes (4): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter

### Community 45 - "Asset Image Loader"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 47 - "Game Engine State"
Cohesion: 0.08
Nodes (10): GameEngine, log, Quadrant, Row, slope(), main(), main(), main() (+2 more)

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

### Community 53 - "Developer Console UI"
Cohesion: 0.10
Nodes (3): GameMap, log, runTest()

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+12 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.12
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 66 - "Form UI Components"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

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
Cohesion: 0.07
Nodes (59): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+51 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 77 - "Item Factory Methods"
Cohesion: 0.14
Nodes (13): gridItems(), FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), invertedImageCache (+5 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.32
Nodes (7): dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemColor(), getBrainstemOverrides(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

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
Nodes (10): AIState, assert(), verify(), aiComp, ent, npc, player, rabbit (+2 more)

### Community 85 - "Item Power Tests"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 86 - "Attribute Progression System"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 89 - "Lab Map Generation"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 90 - "Weather Management System"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 93 - "Command UI Components"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.09
Nodes (20): OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+12 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 99 - "Building Hallway Tests"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 100 - "sheet.tsx"
Cohesion: 0.13
Nodes (17): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, applySurvivalCascade() (+9 more)

### Community 101 - "Table UI Components"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 102 - "Faction Registry System"
Cohesion: 0.28
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.07
Nodes (9): DamageIntent, MoveIntent, Vision, AudioSystem, MockGameMap, MockTile, runTest(), mockEngine (+1 more)

### Community 105 - "Winding Road Generation"
Cohesion: 0.20
Nodes (4): BaseMapGenerator, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gameRandom, makeSeededRandom()

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "Navigation Menu Components"
Cohesion: 0.07
Nodes (12): Burnable, Rabbit, SequencerAction, gm, serialized, map, mockTile, npc (+4 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "Line-of-Sight Logic Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.15
Nodes (7): gameMap, player, zE, zN, zs, zX, MockGameMap

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 120 - "Custom React Hooks"
Cohesion: 0.06
Nodes (36): ActionContext, VisualEffectsContext, log, Item, MeleeWeapon, getSightRangeForHour(), EntityType, ITEM_SERIALIZED_FIELDS (+28 more)

### Community 122 - "Mock Entity System"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 123 - "Storage Compression Testing"
Cohesion: 0.29
Nodes (11): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+3 more)

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

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 152 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 172 - ".onItemCrafted"
Cohesion: 0.20
Nodes (3): PlayerSkills, PlayerWallet, runTest()

## Knowledge Gaps
- **772 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+767 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Form UI Components`, `Game Engine Context`, `sheet.tsx`, `Dialog and Button UI`, `Door Interaction Logic`, `Carousel UI Components`, `Toast UI Components`, `Item Stacking Verification`, `Inventory and Skill Windows`, `Asset Image Loader`, `Entity Mocking System`, `OTP Input Components`, `Character and Menu Windows`, `Dialog UI Components`, `Turret Combat Logic`, `Menubar UI Components`, `Chart UI Components`, `Sidebar UI Components`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `GameMap` connect `Developer Console UI` to `Item Components`, `verify_army_tent.js`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Shop and Log UI`, `Item Metadata and Traits`, `test_explosions.mjs`, `Rabbit AI State`, `Entity Spawning and Scent`, `Map Template Generation`, `World Progression and Spawning`, `Game Initialization Manager`, `Template and World Config`, `Container Grid Logic`, `Loot and Layout Estimation`, `Turret AI Testing`, `Zombie Visibility Tracking`, `Entity Serialization Tests`, `Toast UI Components`, `World Object Spawning`, `Item Factory Methods`, `Campfire Visibility Tests`, `Attribute Progression System`, `Weather Management System`, `Crop Growth Verification`, `Registry Storage Tests`, `Inventory Item Management`, `Zombie Line-of-Sight Testing`, `Navigation Menu Components`, `Safe Grid Data Testing`, `Zombie Interaction Testing`, `Custom React Hooks`, `Road Generation Logic`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Item Metadata and Traits` to `UI Components`, `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `Map Template Generation`, `World Progression and Spawning`, `Turret Combat Logic`, `Inventory Management System`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Developer Console UI`, `Crafting Recipe Verification`, `Toast UI Components`, `World Object Spawning`, `Item Movement Logic`, `Item Power Tests`, `Attribute Progression System`, `Crop Growth Verification`, `Winding Road Generation`, `Map Transition Verification`, `Custom React Hooks`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _781 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.10336817653890824 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11229946524064172 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.0647307924984876 - nodes in this community are weakly interconnected._