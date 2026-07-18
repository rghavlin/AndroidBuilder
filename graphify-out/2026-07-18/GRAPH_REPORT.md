# Graph Report - AndroidBuilder  (2026-07-17)

## Corpus Check
- 537 files · ~5,923,456 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3369 nodes · 8387 edges · 195 communities (140 shown, 55 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06c12cb4`
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
- navigation-menu.tsx
- Electron Main Process
- GameEvent
- Safe Grid Data Testing
- Book Stats Initialization
- Map Transition Verification
- Zombie Interaction Testing
- Consumable
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- react
- MinHeap
- OTP Input Components
- table.tsx
- TurretCombat.js
- Split Road Generation
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- Event Emitter Utility
- Food Scarcity Logic
- test_noise.js
- verify_army_tent.js
- .applyArmorAbsorption
- Playback Cancellation Testing
- File Integrity Checks
- Zombie Bleeding Logic
- balance.js
- Tile Listener Testing
- gridItems
- tmp_verify_clip.js
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- test_shopkeeper_hostility.mjs
- migrateEvents.js
- NPM Configuration Testing
- test_shopkeeper_hostility.mjs
- verify_army_tent.js
- Electron Preload Script
- ScenarioMapGenerator.js
- command.tsx
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- DialogOverlay.tsx
- resolveMapEvents
- RabbitAI.js
- Pathfinding.js
- apEconomy.mjs
- verify_bookstats_init_derived.mjs
- TestMapBuilder
- verify_road_template_p3_09.mjs
- navigation-menu.tsx
- tmp_verify_zombie_loot.js
- TileChunkCache
- apEconomy.js
- test_explosions.mjs
- diagnose_lkp2.mjs
- test_shopkeeper_hostility.mjs
- .dropScent
- RabbitAI
- verify_army_tent.js
- tmp_verify_fix.js
- Quadrant
- verify_map4_frontage.js
- verify_production_frontage.js
- verify_random_map_loops.mjs

## God Nodes (most connected - your core abstractions)
1. `Item` - 131 edges
2. `GameMap` - 123 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 113 edges
5. `createItemFromDef()` - 94 edges
6. `InventoryManager` - 90 edges
7. `engine` - 82 edges
8. `Entity` - 81 edges
9. `ItemDefs` - 64 edges
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
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (195 total, 55 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.09
Nodes (30): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), runTest(), testHuntingDoorBug() (+22 more)

### Community 1 - "UI Components"
Cohesion: 0.33
Nodes (3): Inventory, __dirname, __filename

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.15
Nodes (6): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), applyItemGrants(), buildings

### Community 5 - "NPC AI Behavior"
Cohesion: 0.13
Nodes (5): MovementHelper, MinHeap, Pathfinding, testZombieBug(), testWindowCost()

### Community 7 - "Shop and Log UI"
Cohesion: 0.15
Nodes (12): findSouthTransitionTile(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, m1, m2 (+4 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.07
Nodes (24): ItemTooltipProps, AITargeting, TurretAI, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, FireMode (+16 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.13
Nodes (22): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+14 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (25): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, mockEngine, actionQueue, activeZombie, diedAny (+17 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.04
Nodes (24): ActionPoints, AIState, Consumable, EquippedArmor, Item, MeleeWeapon, PlayerSkills, PlayerWallet (+16 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.16
Nodes (17): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, JournalUI(), NPCDemandDialog() (+9 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.09
Nodes (9): GameInitializationManager, INIT_STATES, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer (+1 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (15): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+7 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (63): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+55 more)

### Community 27 - "World and Map Transitions"
Cohesion: 0.12
Nodes (6): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, assert(), generator

### Community 28 - "Combat and Turn Management"
Cohesion: 0.17
Nodes (12): gridItems(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+4 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 31 - "Template and World Config"
Cohesion: 0.07
Nodes (18): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+10 more)

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
Nodes (9): CharacterRegistryWindow(), CreditsWindow(), StartMenuProps, CharacterRegistry, clear(), confirm(), setItem(), store (+1 more)

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
Cohesion: 0.12
Nodes (30): emptyEntityRegistry(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES, BuildingMeta (+22 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.21
Nodes (3): getBrainstemColor(), getBrainstemStewColors(), CraftingManager

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (5): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver

### Community 47 - "Game Engine State"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, slope(), main(), main(), main(), testWindowSide(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.24
Nodes (5): MainMenuWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 55 - "Dialog UI Components"
Cohesion: 0.23
Nodes (5): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.09
Nodes (20): InventoryExtensionWindowProps, drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds (+12 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.12
Nodes (8): FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, map, mockTile, npc, player, rabbit, zombie

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.18
Nodes (5): LootProgression, MapProgression, BaseMapGenerator, gameRandom, makeSeededRandom()

### Community 62 - "Save Game Management"
Cohesion: 0.22
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.11
Nodes (34): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+26 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.05
Nodes (47): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+39 more)

### Community 66 - "Form UI Components"
Cohesion: 0.17
Nodes (7): getProgressionForMap(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.06
Nodes (13): compare(), evalAll(), evalCondition(), EventRunner, QuestState, changeEvents, ctx, fakeInventoryManager (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.11
Nodes (13): DamageIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, MovementSystem, VisionSystem (+5 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 78 - "Item Movement Logic"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

### Community 79 - "Container Serialization Tests"
Cohesion: 0.13
Nodes (9): GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer, MockCanvasContext, mockEngine (+1 more)

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

### Community 84 - "Canvas Context Mocking"
Cohesion: 0.23
Nodes (9): CraftingRecipes, runTest(), runVerification(), assert(), verify(), verifyMolotov(), runTest(), hammerRecipe (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "Attribute Progression System"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "Dropdown UI Components"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.12
Nodes (13): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear(), getItem(), runTests() (+5 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 104 - "Starting Road Generation"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 106 - "Loot Generation Testing"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.13
Nodes (16): BlueprintRegistry, createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical() (+8 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.31
Nodes (9): applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+1 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "GameEvent"
Cohesion: 0.27
Nodes (11): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+3 more)

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.06
Nodes (26): AIBehavior, Health, InventoryContainer, LightEmitter, Movable, Position, Renderable, NOTE: do NOT force itemsModified for every container/attachment item. (+18 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "Map Transition Verification"
Cohesion: 0.08
Nodes (6): Burnable, Rabbit, SequencerAction, gm, serialized, testCases

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 119 - "EquippedArmor"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 122 - "react"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 123 - "MinHeap"
Cohesion: 0.25
Nodes (7): OptionsWindow(), useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 126 - "TurretCombat.js"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.10
Nodes (14): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gm, wm (+6 more)

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
Cohesion: 0.06
Nodes (53): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, GameScreenContent(), InfectionHUD() (+45 more)

### Community 137 - "Playback Cancellation Testing"
Cohesion: 0.14
Nodes (5): DevConsole(), main(), runTests(), MockGameMap, testWallGapFix()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.26
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 143 - "gridItems"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 144 - "tmp_verify_clip.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.12
Nodes (17): ConditionKind, emptyEvent(), EntityRegistry, EntityRegistryEntry, FlagDef, GameEvent, Placement, PlacementKind (+9 more)

### Community 153 - "verify_army_tent.js"
Cohesion: 0.06
Nodes (41): SpeechBubbleInput(), StartModeDialog(), StartModeDialogProps, AudioProvider(), CameraContext, CameraProvider(), GameContext, GameContextInner() (+33 more)

### Community 157 - "command.tsx"
Cohesion: 0.13
Nodes (20): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty (+12 more)

### Community 171 - "resolveMapEvents"
Cohesion: 0.53
Nodes (5): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents()

### Community 172 - "RabbitAI.js"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 174 - "apEconomy.mjs"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 175 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.07
Nodes (25): CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, Rarity, SlotDisplayName (+17 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 177 - "verify_road_template_p3_09.mjs"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 179 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 180 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 182 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 184 - "diagnose_lkp2.mjs"
Cohesion: 0.33
Nodes (4): door, gm, player, z

### Community 185 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

### Community 189 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **867 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+862 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `verify_army_tent.js`, `Tooltip Components`, `gridItems`, `Entity Spawning and Scent`, `Character and Menu Windows`, `World Progression and Spawning`, `Sidebar UI Components`, `command.tsx`, `Blueprint and Inventory Registry`, `navigation-menu.tsx`, `Menubar UI Components`, `Ground Item Management`, `Scenario Map Generation`, `context-menu.tsx`, `Attribute Progression System`, `Dropdown UI Components`, `Book Stats Initialization`, `EquippedArmor`, `OTP Input Components`, `table.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `MinHeap`, `OTP Input Components`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `react` connect `MinHeap` to `Ground Item Management`, `verify_army_tent.js`, `External Dependencies`, `Dropdown UI Components`, `Entity Serialization Tests`, `Save Game Management`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _879 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08599290780141844 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.14919354838709678 - nodes in this community are weakly interconnected._