# Graph Report - AndroidBuilder  (2026-07-09)

## Corpus Check
- 491 files · ~461,968 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3029 nodes · 7684 edges · 182 communities (126 shown, 56 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09fdcc08`
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
- verify_food_scarcity_p4_09.mjs
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
- MapConnectivityValidator.js
- MockTile
- .updateCropMetadata
- ScenarioMapGenerator.js
- Consumable
- EquippedArmor
- tmp_verify_fix.js
- tmp_verify_loot.js
- tmp_verify_loot_summary.js
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

## Communities (182 total, 56 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.06
Nodes (21): AIBehavior, Health, InventoryContainer, LightEmitter, Movable, Renderable, Vision, aiCustom (+13 more)

### Community 1 - "UI Components"
Cohesion: 0.33
Nodes (10): applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), rollWoundInfectionCure(), sicknessPenalties() (+2 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.08
Nodes (46): StartModeDialog(), StartModeDialogProps, ActionContext, AudioContext, AudioProvider(), CombatContext, resolveTileTarget(), GameContext (+38 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (33): CraftingRecipes, ItemDefs, testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode, FUEL_VALUES (+25 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.17
Nodes (4): MovementHelper, Pathfinding, testZombieBug(), testWindowCost()

### Community 6 - "Action Intent System"
Cohesion: 0.18
Nodes (7): IntentQueue, AISystem, CombatSystem, MovementSystem, VisionSystem, markHeardIfInRange(), cases

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (36): ActionSlotButton(), ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, AttachmentSlot, AttachmentSlotProps, EquipmentSlot (+28 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.33
Nodes (8): FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), getScaleMode(), useWindowSize(), WindowSize

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (26): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+18 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (14): AIState, Burnable, Rabbit, SequencerAction, gm, serialized, aiComp, ent (+6 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.09
Nodes (22): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS (+14 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.11
Nodes (26): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), runTest(), testHuntingDoorBug() (+18 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (17): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), TemplateMapGenerator, main(), isInsideBuilding(), verifyMap4() (+9 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.07
Nodes (43): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DevConsoleProps, DevConsoleShopManager(), TabType (+35 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.09
Nodes (15): getProgressionForMap(), LootProgression, MapProgression, PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner (+7 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (6): GameInitializationManager, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 23 - "Core Camera and Context"
Cohesion: 0.23
Nodes (6): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 24 - "Turret Combat Logic"
Cohesion: 0.12
Nodes (5): EntityRenderer, MockCtx, mockEngine, mockSprites, visibilitySet

### Community 26 - "Action Queue Processing"
Cohesion: 0.15
Nodes (10): ScentTrail, cheb(), out(), run(), addPlayer(), cheb(), runTurns(), addPlayer() (+2 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.09
Nodes (4): WorldManager, assert(), verify(), runDebug()

### Community 28 - "Combat and Turn Management"
Cohesion: 0.24
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 31 - "Template and World Config"
Cohesion: 0.10
Nodes (14): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gm, wm (+6 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.26
Nodes (4): NPCAI, getNPCType(), assert(), verify()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.17
Nodes (4): runContainerTests(), runTest(), testSerialization(), results

### Community 35 - "Dialog and Button UI"
Cohesion: 0.03
Nodes (56): AccordionContent, AccordionItem, AccordionTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+48 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.24
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.13
Nodes (8): TileChunkCache, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer, mockEngine, runTest()

### Community 40 - "Line of Sight System"
Cohesion: 0.15
Nodes (9): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), testWindowSide() (+1 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.11
Nodes (26): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage, btnStyle(), BUILDING_TYPES, BuildingMeta, createEmptyGrid() (+18 more)

### Community 42 - "Map Data Export"
Cohesion: 0.06
Nodes (27): DestroyIntent, MoveIntent, NoiseEvent, AudioSystem, DestructionSystem, ExplosionSystem, mockEngine, actionQueue (+19 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.13
Nodes (15): GameContextInner(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear(), getItem() (+7 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (22): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+14 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+12 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.19
Nodes (10): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES (+2 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.20
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.08
Nodes (10): BlueprintRegistry, __dirname, __filename, runTests(), MockCanvasContext, mockEngine, mockLocalStorage, mockSprites (+2 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.38
Nodes (10): getZombieType(), getBeelineIntent(), getGreedyHuntIntent(), getMeleeReach(), huntPlayer(), investigate(), spitAtPlayer(), tryFollowScent() (+2 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.14
Nodes (6): log, PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.10
Nodes (25): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, TradeDialog(), TradeDialogProps, TutorialEndDialog(), TutorialEndDialogProps (+17 more)

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
Nodes (7): DevConsole(), CameraProvider(), main(), runVerification(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.19
Nodes (12): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, Theme (+4 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.14
Nodes (5): BaseMapGenerator, ScenarioMapGenerator, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gameRandom, makeSeededRandom()

### Community 66 - "Form UI Components"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.16
Nodes (5): Door, door, gm, player, z

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.06
Nodes (51): BarterWindow(), BarterWindowProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DefeatDialog(), DoorTooltip() (+43 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.05
Nodes (43): Inventory, dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemOverrides(), getCorpseOverrides(), ZombieCorpseConfig, createAmmo(), createArmor() (+35 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.09
Nodes (25): TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+17 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.21
Nodes (10): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), invertedImageCache (+2 more)

### Community 79 - "Container Serialization Tests"
Cohesion: 0.23
Nodes (10): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, CameraContext (+2 more)

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
Cohesion: 0.18
Nodes (7): FireSystem, map, mockTile, npc, player, rabbit, zombie

### Community 85 - "Item Power Tests"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 87 - "Item Lifecycle Management"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

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
Nodes (3): NPCTypes, testWindowOscillations(), testWindowBug()

### Community 94 - "Dropdown UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

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

### Community 101 - "Table UI Components"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 102 - "Faction Registry System"
Cohesion: 0.28
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
Cohesion: 0.20
Nodes (4): run(), run(), assert(), verify()

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 116 - "Map Transition Verification"
Cohesion: 0.14
Nodes (9): findSouthTransitionTile(), isInsideAnyBuilding(), isInsideTollGate(), buildings, m1, m2, m3, r1 (+1 more)

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "Scenario Storage Management"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 120 - "Custom React Hooks"
Cohesion: 0.22
Nodes (6): gameMap, player, zE, zN, zs, zX

### Community 121 - "Logging Utility"
Cohesion: 0.19
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 122 - "Mock Entity System"
Cohesion: 0.10
Nodes (5): DamageIntent, Position, MockEntity, MockGameMap, MockTile

### Community 123 - "Storage Compression Testing"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

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

### Community 133 - "Mock Game Map"
Cohesion: 0.25
Nodes (5): gm, lead, player, trail, zs

### Community 134 - "Mock Tile System"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "Dialog Overlay Components"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 150 - "Map Loop Verification"
Cohesion: 0.50
Nodes (3): clothingKeys, lootGen, subtypes

### Community 153 - "verify_map4_frontage.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 157 - "Noise Assertion Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 169 - "Place Icon Serialization"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 172 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 178 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 181 - ".setItemsOnTile"
Cohesion: 0.07
Nodes (15): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, ActionPoints, PlayerSkills (+7 more)

## Knowledge Gaps
- **768 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+763 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Dialog and Button UI` to `Game Engine Context`, `Shop and Log UI`, `Tooltip Components`, `Inventory and Skill Windows`, `Character and Menu Windows`, `verify_map4_frontage.js`, `Sidebar UI Components`, `Place Icon Serialization`, `Blueprint and Inventory Registry`, `.setItemsOnTile`, `Dialog UI Components`, `Menubar UI Components`, `Save Game Management`, `Form UI Components`, `Carousel UI Components`, `Toast UI Components`, `Item Power Tests`, `Chart UI Components`, `Dropdown UI Components`, `Table UI Components`, `Navigation Menu Components`, `OTP Input Components`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `World Object Spawning` to `Game Engine Context`, `AI and Inventory Systems`, `Shop and Log UI`, `Shop and Pricing Config`, `Map Template Generation`, `Game Map Management`, `verify_food_scarcity_p4_09.mjs`, `World Progression and Spawning`, `Container Grid Logic`, `Road and Town Generation`, `Map Editor Tools`, `Map Data Export`, `Crafting Manager Logic`, `Loot Generation System`, `Blueprint and Inventory Registry`, `Scenario Map Generation`, `Toast UI Components`, `App Routing and Scaling`, `Item Movement Logic`, `Crop Growth Verification`, `Loot Generation Testing`, `Safe Grid Data Testing`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Inventory Item Management`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _777 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.058279370952821465 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.056189640035118525 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07738632941884975 - nodes in this community are weakly interconnected._