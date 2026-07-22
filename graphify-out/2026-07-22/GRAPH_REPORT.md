# Graph Report - AndroidBuilder  (2026-07-22)

## Corpus Check
- 573 files · ~10,043,626 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3587 nodes · 9104 edges · 189 communities (135 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3bf715e`
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
- .runTurn
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- Quadrant
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- Electron Preload Script
- navigation-menu.tsx
- test_noise.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_noise_assert.js
- verify_saveload.mjs
- MockTile
- MockGameMap
- TestMapBuilder
- verify_loadmap_dedup_p4_03.mjs
- verify_bookstats_init_derived.mjs
- MusicManager
- test_noise.js
- MockGameMap
- .dropScent
- test_noise_assert.js
- npcLoadout.test.js
- verify_food_scarcity_p4_09.mjs
- verify_production_frontage.js
- .canSeePosition

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 143 edges
2. `Item` - 133 edges
3. `EntityFactory` - 120 edges
4. `cn()` - 117 edges
5. `createItemFromDef()` - 101 edges
6. `InventoryManager` - 90 edges
7. `Entity` - 85 edges
8. `engine` - 82 edges
9. `ItemDefs` - 67 edges
10. `TemplateMapGenerator` - 59 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `testWindowOscillations()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_side_window.mjs → client/src/game/EntityFactory.js
- `testWindowBug()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_window_bug.mjs → client/src/game/EntityFactory.js
- `runTest()` --references--> `FactionRegistry`  [EXTRACTED]
  scratch/verify_faction_validation.mjs → client/src/game/ai/FactionRegistry.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (189 total, 54 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.08
Nodes (11): Burnable, EntityType, PlaceIcon, engine, SequencerAction, NOTE: Structural damage (hp reduction, break/open flags) was already, door, gm (+3 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (36): BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14, COTTAGE_1BED (+28 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.13
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (32): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+24 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.25
Nodes (3): getProgressionForMap(), AnimalSpawner, NPCSpawner

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (37): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+29 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (22): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+14 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (9): isInsideCompound(), TemplateMapGenerator, isInsideBuilding(), verifyMap4(), { GameMap }, { TemplateMapGenerator }, generator, layout (+1 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.19
Nodes (11): compare(), evalAll(), evalCondition(), changeEvents, ctx, fakeInventoryManager, json, qs (+3 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.17
Nodes (20): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot, LoadGameWindowProps (+12 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (9): LootProgression, MapProgression, GameInitializationManager, INIT_STATES, initManager, runDebug(), MockMap, mockPlayer (+1 more)

### Community 23 - "Door"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (9): Rabbit, gm, serialized, map, mockTile, npc, player, rabbit (+1 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), run(), run(), testSerialization() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (66): JournalUI(), AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants (+58 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

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
Cohesion: 0.12
Nodes (16): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry, compressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+8 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.18
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (41): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+33 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.12
Nodes (10): CraftingManager, cm, container, inContainer, mockInv, singleItem, stack, stack2 (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (8): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (9): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test() (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.06
Nodes (54): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+46 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.14
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, assert(), verify() (+4 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.07
Nodes (33): BlueprintRegistry, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical() (+25 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.03
Nodes (47): ActionPoints, AIBehavior, AIState, Consumable, EquippedArmor, Health, Inventory, InventoryContainer (+39 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.09
Nodes (46): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+38 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.05
Nodes (36): AITargeting, TurretAI, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory() (+28 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.08
Nodes (20): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AISystem, AudioSystem, CombatSystem (+12 more)

### Community 62 - "Save Game Management"
Cohesion: 0.07
Nodes (35): ActionContext, ActionProvider(), AudioContext, AudioProvider(), CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget() (+27 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.09
Nodes (39): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps (+31 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.10
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
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 74 - "Map Tile Logic"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.06
Nodes (37): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., getItemName(), ItemDefs, getFuelValue(), ItemCategory, RarityWeights (+29 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.24
Nodes (6): isInStartArea(), isFloor(), logger, ZombieReplenishmentSystem, ZombieSpawner, runVerification()

### Community 79 - ".executeTransition"
Cohesion: 0.11
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

### Community 85 - "context-menu.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.08
Nodes (33): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+25 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.05
Nodes (13): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+5 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 93 - "Command UI Components"
Cohesion: 0.44
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 94 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.06
Nodes (27): RabbitAI, getNPCType(), floodFill(), findAttackSlotPath(), getMeleeReach(), isMeleeAttackPosition(), getBeelineIntent(), getGreedyHuntIntent() (+19 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.16
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 102 - "Faction Registry System"
Cohesion: 0.13
Nodes (14): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+6 more)

### Community 103 - "Inventory Item Management"
Cohesion: 0.06
Nodes (16): Container, _warnedCatchAllProps, testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FireMode, FUEL_VALUES (+8 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.10
Nodes (12): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+4 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.20
Nodes (6): applyNpcAIMode(), log, dialogOnlySteps, mixedEvent, placedLog, step

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.40
Nodes (3): ASSERT_FURNISHED, KNOWN_TYPES, REPORT_ONLY

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 119 - "EquippedArmor"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.30
Nodes (7): DevConsole(), CameraProvider(), exportScenario(), main(), runTests(), testWallGapFix(), verifyRestoration()

### Community 126 - "alert.tsx"
Cohesion: 0.16
Nodes (8): map, player, tracker, zombie, escalated, map, player, shopkeeper

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

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

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 144 - "Row"
Cohesion: 0.40
Nodes (3): { Item }, { ItemDefs }, { ItemTrait, ItemCategory }

### Community 145 - ".runTurn"
Cohesion: 0.08
Nodes (32): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug(), main() (+24 more)

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

### Community 157 - "test_noise.js"
Cohesion: 0.15
Nodes (8): findSouthTransitionTile(), isInsideAnyBuilding(), buildings, m1, m2, m3, r1, r2

### Community 171 - "test_noise_assert.js"
Cohesion: 0.15
Nodes (10): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run (+2 more)

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "verify_loadmap_dedup_p4_03.mjs"
Cohesion: 0.06
Nodes (17): Item, MeleeWeapon, getSightRangeForHour(), NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testWindowOscillations() (+9 more)

### Community 178 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 183 - "test_noise.js"
Cohesion: 0.07
Nodes (25): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+17 more)

### Community 184 - "MockGameMap"
Cohesion: 0.09
Nodes (3): COMPONENT_NAME_BY_CTOR, Entity, set()

### Community 186 - ".dropScent"
Cohesion: 0.06
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

### Community 190 - "npcLoadout.test.js"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

## Knowledge Gaps
- **919 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+914 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Action Intent System`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Character and Menu Windows`, `World Progression and Spawning`, `table.tsx`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Options and Crafting UI`, `Blueprint and Inventory Registry`, `test_noise.js`, `Menubar UI Components`, `Entity Serialization Tests`, `Ground Item Management`, `Carousel UI Components`, `Map Tile Logic`, `context-menu.tsx`, `Safe Grid Data Testing`, `OTP Input Components`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `Table UI Components`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `GameMap` connect `World Object Spawning` to `Item Components`, `Game Engine Context`, `AI and Inventory Systems`, `test_noise.js`, `Entity and Item Types`, `.runTurn`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `Map Generation Config`, `Container Grid Logic`, `Loot and Layout Estimation`, `Building Layout Builder`, `Game Engine State`, `verify_loadmap_dedup_p4_03.mjs`, `Rendering Optimization Tests`, `Developer Console UI`, `pagination.tsx`, `Entity Serialization Tests`, `.dropScent`, `TemplateMapGenerator.js`, `Inventory Persistence Tests`, `Map Serialization Tests`, `App Routing and Scaling`, `Campfire Visibility Tests`, `FurniturePlanner.js`, `Crop Growth Verification`, `Inventory Item Management`, `Seeded Random Utilities`, `Zombie Line-of-Sight Testing`, `Zombie Interaction Testing`, `alert.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _931 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08078231292517007 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._