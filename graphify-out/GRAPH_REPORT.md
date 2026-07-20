# Graph Report - AndroidBuilder  (2026-07-20)

## Corpus Check
- 555 files · ~10,001,009 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3509 nodes · 8743 edges · 180 communities (137 shown, 43 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2dc94f74`
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
- useGame
- Combat and Turn Management
- Sidebar UI Components
- Map Generation Config
- EventRunner
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
- ImageLoader
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
- pagination.tsx
- Menubar UI Components
- Entity Serialization Tests
- Audio Management System
- UI Framework Config
- TemplateMapGenerator.js
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
- .executeTransition
- Electron Build Config
- Server and Vite Config
- NPM Build Scripts
- Campfire Visibility Tests
- verify_molotov.mjs
- context-menu.tsx
- FurniturePlanner.js
- TurretCombat.js
- ASCII Map Renderer
- Lab Map Generation
- Weather Management System
- Crop Growth Verification
- Chart UI Components
- Command UI Components
- DevConsole.tsx
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
- LineOfSight.js
- Loot Generation Testing
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- navigation-menu.tsx
- Electron Main Process
- EarbucksShopSystem
- Safe Grid Data Testing
- Book Stats Initialization
- SurvivalCascade.js
- Zombie Interaction Testing
- Consumable
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- react
- MockMap
- OTP Input Components
- table.tsx
- alert.tsx
- Split Road Generation
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- test_noise.js
- verify_army_tent.js
- .applyArmorAbsorption
- test_exhaustive_los.js
- File Integrity Checks
- Zombie Bleeding Logic
- test_exhaustive_los_85.js
- balance.js
- Tile Listener Testing
- DialogOverlay.tsx
- Row
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Quadrant
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- Electron Preload Script
- navigation-menu.tsx
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_explosions.mjs
- MockGameMap
- TestMapBuilder
- verify_loadmap_dedup_p4_03.mjs
- MusicManager
- .dropScent

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 132 edges
2. `Item` - 131 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 115 edges
5. `createItemFromDef()` - 97 edges
6. `InventoryManager` - 90 edges
7. `engine` - 82 edges
8. `Entity` - 81 edges
9. `ItemDefs` - 65 edges
10. `TemplateMapGenerator` - 59 edges

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
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (180 total, 43 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.11
Nodes (27): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), testWindowOscillations() (+19 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (36): BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14, COTTAGE_1BED (+28 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.05
Nodes (32): RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), findAttackSlotPath(), getMeleeReach() (+24 more)

### Community 6 - "Action Intent System"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.08
Nodes (20): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+12 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.08
Nodes (27): TurretAI, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, createItemFromDef(), getItemName(), ItemDefs, FireMode, getFuelValue() (+19 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (38): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+30 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.04
Nodes (20): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding() (+12 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.04
Nodes (33): AIState, Rabbit, SequencerAction, gm, serialized, aiComp, ent, json (+25 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.05
Nodes (32): CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, Rarity, SlotDisplayName (+24 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.16
Nodes (7): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename, runTests()

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (50): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+42 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (19): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+11 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (8): GameInitializationManager, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 23 - "Door"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 24 - "Turret Combat Logic"
Cohesion: 0.26
Nodes (3): AnimalSpawner, NPCSpawner, runDebug()

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (14): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+6 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (63): GameControlsProps, STAT_COLORS, StatBar, StatBarProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps (+55 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.07
Nodes (17): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity() (+9 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.23
Nodes (6): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 33 - "Options and Crafting UI"
Cohesion: 0.29
Nodes (3): TollGateSystem, assert(), verify()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.10
Nodes (26): ActionContext, ActionProvider(), CombatContext, CombatProvider(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile() (+18 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.18
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), applyNpcAIMode(), EventRunner, QuestState, changeEvents, ctx (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (41): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+33 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.19
Nodes (4): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, computeBrainstemStewTreatment()

### Community 44 - "ImageLoader"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (12): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear(), getItem(), runTests() (+4 more)

### Community 47 - "Game Engine State"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.09
Nodes (17): getProgressionForMap(), LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, INIT_STATES, EventEmitter (+9 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.04
Nodes (36): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Health, InventoryContainer, LightEmitter (+28 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.36
Nodes (3): EarbucksShopSystem, assert(), verify()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.09
Nodes (20): DamageIntent, DestroyIntent, NoiseEvent, Vision, IntentQueue, AISystem, AudioSystem, CombatSystem (+12 more)

### Community 62 - "Save Game Management"
Cohesion: 0.06
Nodes (41): StartModeDialog(), StartModeDialogProps, AudioContext, AudioProvider(), CameraContext, CameraProvider(), GameContext, GameProvider() (+33 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.11
Nodes (34): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid() (+26 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 74 - "Map Tile Logic"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 76 - "App Routing and Scaling"
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.10
Nodes (9): BaseMapGenerator, ScenarioMapGenerator, computeTollGateLayout(), TOLLGATE_DEFAULTS, gameRandom, makeSeededRandom(), map, templates (+1 more)

### Community 79 - ".executeTransition"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (18): scripts, ap-economy, balance, build, build-electron, check, dev, electron (+10 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.17
Nodes (10): campfire, groundItemsInContainer, isCampfireVisible, isCampfireVisibleInitially, isTileAroundCampfireVisible, isTileAroundCampfireVisibleCase2, items, map (+2 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.07
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+3 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "DevConsole.tsx"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.18
Nodes (4): DevConsoleProps, TabType, CardFooter, Input

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.17
Nodes (9): CharacterRegistryWindow(), CreditsWindow(), StartMenuProps, CharacterRegistry, clear(), confirm(), setItem(), store (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.17
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.05
Nodes (25): RarityWeights, FOOD_SCARCITY, getFoodRejectionChance(), LOOT_CONSTANTS, LootGenerator, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT (+17 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (7): FireSystem, map, mockTile, npc, player, rabbit, zombie

### Community 106 - "Loot Generation Testing"
Cohesion: 0.13
Nodes (3): COMPONENT_NAME_BY_CTOR, assert(), verify()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.11
Nodes (33): DefeatDialog(), GameControls(), GameScreenContent(), InfectionHUD(), JournalUI(), drawImprovedCursor(), lastRainUpdate, MapCanvas() (+25 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.25
Nodes (10): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), getScaleMode() (+2 more)

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.13
Nodes (12): findSouthTransitionTile(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, m1 (+4 more)

### Community 119 - "EquippedArmor"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 121 - ".getBeltContainers"
Cohesion: 0.18
Nodes (3): PlaceIcon, testPhase1(), runTest()

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.17
Nodes (7): DevConsole(), exportScenario(), main(), runVerification(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 126 - "alert.tsx"
Cohesion: 0.29
Nodes (10): applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), rollWoundInfectionCure(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 127 - "Split Road Generation"
Cohesion: 0.40
Nodes (3): ASSERT_FURNISHED, KNOWN_TYPES, REPORT_ONLY

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.25
Nodes (4): Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.07
Nodes (17): Item, MoveIntent, EntityType, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), emptyTiles() (+9 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 186 - ".dropScent"
Cohesion: 0.05
Nodes (29): gridItems(), SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail (+21 more)

## Knowledge Gaps
- **914 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+909 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Action Intent System`, `Shop and Log UI`, `Map Template Generation`, `Character and Menu Windows`, `table.tsx`, `navigation-menu.tsx`, `Combat and Turn Management`, `Sidebar UI Components`, `EventRunner`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Entity Serialization Tests`, `Ground Item Management`, `Carousel UI Components`, `Map Tile Logic`, `context-menu.tsx`, `Weapon Attachment Logic`, `navigation-menu.tsx`, `EarbucksShopSystem`, `Safe Grid Data Testing`, `OTP Input Components`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Tooltip Components` to `Item Interaction Logic`, `verify_army_tent.js`, `Shop and Log UI`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Template Generation`, `World Progression and Spawning`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Map Generation Config`, `Dialog and Button UI`, `Road and Town Generation`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `Developer Console UI`, `TemplateMapGenerator.js`, `Inventory Persistence Tests`, `Crafting Recipe Verification`, `Ground Item Management`, `World Object Spawning`, `App Routing and Scaling`, `Item Movement Logic`, `FurniturePlanner.js`, `Crop Growth Verification`, `Building Hallway Tests`, `Table UI Components`, `LineOfSight.js`, `navigation-menu.tsx`, `EquippedArmor`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `verify_direct_load_capacity_p3_07.mjs`, `OTP Input Components`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _926 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11201079622132254 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._