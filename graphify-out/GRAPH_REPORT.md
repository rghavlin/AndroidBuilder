# Graph Report - AndroidBuilder  (2026-07-19)

## Corpus Check
- 549 files · ~5,948,764 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3476 nodes · 8664 edges · 180 communities (132 shown, 48 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 133 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79d7449d`
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
- verify_direct_load_capacity_p3_07.mjs
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Row
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- verify_army_tent.js
- Electron Preload Script
- navigation-menu.tsx
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- verify_random_map_loops.mjs
- .moveItem
- MockGameMap
- TestMapBuilder
- verify_questsystem_p3.mjs
- .onItemCrafted
- MusicManager
- .dropScent

## God Nodes (most connected - your core abstractions)
1. `Item` - 131 edges
2. `GameMap` - 129 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 113 edges
5. `createItemFromDef()` - 96 edges
6. `InventoryManager` - 90 edges
7. `engine` - 82 edges
8. `Entity` - 81 edges
9. `ItemDefs` - 65 edges
10. `TemplateMapGenerator` - 55 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json
- `MapCanvas()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/MapCanvas.jsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (180 total, 48 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.09
Nodes (29): ExplosionIntent, EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug() (+21 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (36): BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14, COTTAGE_1BED (+28 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.05
Nodes (31): RabbitAI, getNPCType(), getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach() (+23 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (25): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+17 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (33): TurretAI, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode (+25 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (34): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+26 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (17): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding() (+9 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.05
Nodes (20): AIState, Burnable, Rabbit, SequencerAction, gm, serialized, aiComp, ent (+12 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.05
Nodes (23): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+15 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.05
Nodes (57): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+49 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (39): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DevConsoleProps, TabType (+31 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (19): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+11 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (6): GameInitializationManager, initManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 23 - "Door"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 24 - "Turret Combat Logic"
Cohesion: 0.24
Nodes (3): getProgressionForMap(), AnimalSpawner, NPCSpawner

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (15): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (82): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+74 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.05
Nodes (23): ZombieTooltip(), ZombieTooltipProps, removeDestroyedTurret(), ZombieTypes, gridItems(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached() (+15 more)

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
Cohesion: 0.10
Nodes (24): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, ScreenScaler() (+16 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.04
Nodes (36): ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, InventoryContainer, Item, LightEmitter (+28 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.12
Nodes (5): BranchingRoadGenerator, RoadNetwork, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 41 - "Map Editor Tools"
Cohesion: 0.12
Nodes (30): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES (+22 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.09
Nodes (18): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager, getItemName(), getFuelValue() (+10 more)

### Community 44 - "ImageLoader"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 45 - "Asset Image Loader"
Cohesion: 0.26
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (9): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runTest(), assert(), verify() (+1 more)

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

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.15
Nodes (15): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+7 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.07
Nodes (13): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename, runTests(), MockCanvasContext (+5 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.11
Nodes (15): DamageIntent, DestroyIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, MovementSystem (+7 more)

### Community 62 - "Save Game Management"
Cohesion: 0.06
Nodes (70): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+62 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.11
Nodes (35): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+27 more)

### Community 66 - "Form UI Components"
Cohesion: 0.07
Nodes (24): NoiseEvent, DestructionSystem, ExplosionSystem, FireSystem, actionQueue, activeZombie, diedAny, ecsEntities (+16 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

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
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

### Community 78 - "Item Movement Logic"
Cohesion: 0.08
Nodes (21): LootProgression, MapProgression, getSightRangeForHour(), NOTE: do NOT force itemsModified for every container/attachment item., findSouthTransitionTile(), isInsideTollGate(), isInStartArea(), NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+13 more)

### Community 79 - ".executeTransition"
Cohesion: 0.10
Nodes (4): WorldManager, assert(), verify(), runDebug()

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

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.16
Nodes (6): PlayerSkills, PlayerWallet, INIT_STATES, assert(), verify(), runTest()

### Community 85 - "context-menu.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.10
Nodes (28): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+20 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.05
Nodes (12): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+4 more)

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
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.27
Nodes (5): clear(), confirm(), setItem(), store, testRegistry()

### Community 99 - "Building Hallway Tests"
Cohesion: 0.17
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.13
Nodes (6): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), applyItemGrants(), buildings

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 105 - "LineOfSight.js"
Cohesion: 0.32
Nodes (3): OptionsWindow(), StartMenu(), IndexedDBStore

### Community 106 - "Loot Generation Testing"
Cohesion: 0.17
Nodes (12): compare(), evalAll(), evalCondition(), log, changeEvents, ctx, fakeInventoryManager, json (+4 more)

### Community 107 - "Music and Playlist Manager"
Cohesion: 0.15
Nodes (8): InventoryExtensionWindowProps, JournalUI(), MapTransitionDialog(), NPCDemandDialog(), PlayerSkillsWindowProps, TradeDialog(), TradeDialogProps, TutorialEndDialog()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.15
Nodes (7): DevConsole(), exportScenario(), main(), assert(), verify(), MockGameMap, testWallGapFix()

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.36
Nodes (3): EarbucksShopSystem, assert(), verify()

### Community 115 - "Book Stats Initialization"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.25
Nodes (5): m1, m2, m3, r1, r2

### Community 121 - ".getBeltContainers"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 122 - "react"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 123 - "MockMap"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.53
Nodes (5): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents()

### Community 126 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "Event Emitter Utility"
Cohesion: 0.15
Nodes (5): PlaceIcon, Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.09
Nodes (13): EntityType, NPCTypes, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, findAttackSlotPath(), isMeleeAttackPosition(), Pathfinding, door (+5 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 144 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.50
Nodes (3): expected, loadFromGround(), makeItem()

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "verify_army_tent.js"
Cohesion: 0.09
Nodes (16): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gm, wm (+8 more)

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "verify_questsystem_p3.mjs"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

## Knowledge Gaps
- **906 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+901 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Shop and Log UI`, `Map Template Generation`, `Character and Menu Windows`, `table.tsx`, `navigation-menu.tsx`, `Combat and Turn Management`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Options and Crafting UI`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Save Game Management`, `Ground Item Management`, `Carousel UI Components`, `Map Tile Logic`, `context-menu.tsx`, `Music and Playlist Manager`, `OTP Input Components`, `alert.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Table UI Components` to `Item Interaction Logic`, `Action Intent System`, `Shop and Log UI`, `Tooltip Components`, `verify_army_tent.js`, `Entity and Item Types`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Template Generation`, `World Progression and Spawning`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Map Generation Config`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `Developer Console UI`, `pagination.tsx`, `Inventory Persistence Tests`, `Save Game Management`, `Crafting Recipe Verification`, `Ground Item Management`, `Form UI Components`, `World Object Spawning`, `Item Movement Logic`, `FurniturePlanner.js`, `Crop Growth Verification`, `Building Hallway Tests`, `Starting Road Generation`, `navigation-menu.tsx`, `EarbucksShopSystem`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `.getBeltContainers`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _918 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09408033826638477 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._