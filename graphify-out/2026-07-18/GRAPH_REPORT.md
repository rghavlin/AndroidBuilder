# Graph Report - AndroidBuilder  (2026-07-18)

## Corpus Check
- 543 files · ~5,937,271 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3433 nodes · 8574 edges · 195 communities (141 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 131 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6e67eae`
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
- resolveMapEvents
- balance.js
- Tile Listener Testing
- DialogOverlay.tsx
- apEconomy.js
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- test_shopkeeper_hostility.mjs
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- verify_army_tent.js
- Electron Preload Script
- navigation-menu.tsx
- MapConnectivityValidator.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- react
- verify_production_frontage.js
- Pathfinding.js
- test_noise_assert.js
- verify_saveload.mjs
- TestMapBuilder
- Quadrant
- verify_random_map_loops.mjs
- MusicManager
- react
- test_save_compression.js
- apEconomy.js
- MockGameMap
- verify_firefighter_spawn.js
- .dropScent
- RabbitAI
- NPCAISystem.js
- verify_loadmap_dedup_p4_03.mjs
- verify_worldmanager_populate_p4_02.mjs
- MapConnectivityValidator.js
- verify_map4_frontage.js

## God Nodes (most connected - your core abstractions)
1. `Item` - 131 edges
2. `GameMap` - 125 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 113 edges
5. `createItemFromDef()` - 95 edges
6. `InventoryManager` - 90 edges
7. `engine` - 82 edges
8. `Entity` - 81 edges
9. `ItemDefs` - 64 edges
10. `TemplateMapGenerator` - 54 edges

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

## Communities (195 total, 54 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.14
Nodes (15): tryFollowScent(), testCornerBug(), testDiagonalBug(), run(), runOscillationTest(), runTest(), main(), runEdgeTest() (+7 more)

### Community 1 - "UI Components"
Cohesion: 0.11
Nodes (20): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), BY_SIZE, COTTAGE_1BED, COTTAGE_OPEN_LIVING, EDGE_CW, FLOORPLAN_FOOTPRINTS (+12 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.10
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.15
Nodes (3): MovementHelper, MinHeap, testWindowCost()

### Community 6 - "Action Intent System"
Cohesion: 0.09
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+3 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (20): LootProgression, createItemFromDef(), RarityWeights, FOOD_SCARCITY, getFoodRejectionChance(), LOOT_CONSTANTS, LootGenerator, MAP_WIDE_REQUIREMENTS (+12 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.08
Nodes (17): TurretAI, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., ItemDefs, EquipmentSlot, SafeEventEmitter, __dirname, __filename, expected (+9 more)

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
Cohesion: 0.06
Nodes (7): isInsideCompound(), TemplateMapGenerator, assert(), verify(), { GameMap }, { TemplateMapGenerator }, generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.04
Nodes (22): DevConsole(), AIState, Burnable, Rabbit, SequencerAction, FireSystem, gm, serialized (+14 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.03
Nodes (46): BlueprintRegistry, ActionPoints, AIBehavior, Consumable, EquippedArmor, Health, Inventory, InventoryContainer (+38 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.08
Nodes (23): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+15 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.04
Nodes (63): GameControlsProps, STAT_COLORS, StatBar, StatBarProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps (+55 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.11
Nodes (16): gridItems(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+8 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.18
Nodes (7): runContainerTests(), runTest(), testResults, testSerialization(), KNOWN_FAILURES, results, verifyLoadSwaps()

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
Cohesion: 0.10
Nodes (40): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), EntityRegistry, GameEvent, QuestRegistry, downconvertEvents(), migrateBubbleEvent() (+32 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.14
Nodes (9): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager, getItemName(), getFuelValue() (+1 more)

### Community 44 - "ImageLoader"
Cohesion: 0.12
Nodes (10): PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map, player, shopkeeper (+2 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.26
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.30
Nodes (9): getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer(), wander() (+1 more)

### Community 47 - "Game Engine State"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.11
Nodes (5): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, ImageLoader, useItemImage()

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.33
Nodes (3): runReproduction(), runTest(), testCharger()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.23
Nodes (9): CraftingRecipes, runTest(), runVerification(), assert(), verify(), verifyMolotov(), runTest(), hammerRecipe (+1 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.16
Nodes (8): MapProgression, INIT_STATES, BaseMapGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), gen, roleCounts

### Community 62 - "Save Game Management"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 64 - "Ground Item Management"
Cohesion: 0.07
Nodes (38): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+30 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.07
Nodes (44): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow() (+36 more)

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (36): DefeatDialog(), GameControls(), GameScreenContent(), InfectionHUD(), JournalUI(), drawImprovedCursor(), lastRainUpdate, MapCanvas() (+28 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.08
Nodes (22): DamageIntent, DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AISystem, AudioSystem, CombatSystem (+14 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 78 - "Item Movement Logic"
Cohesion: 0.12
Nodes (3): WorldManager, assert(), verify()

### Community 79 - ".executeTransition"
Cohesion: 0.20
Nodes (4): getProgressionForMap(), AnimalSpawner, NPCSpawner, runDebug()

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
Cohesion: 0.22
Nodes (7): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, runVerification()

### Community 85 - "context-menu.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.11
Nodes (25): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, furniturePieceOnFloor(), HEAD_SIDE, planFurniture() (+17 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.27
Nodes (11): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile (+3 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.11
Nodes (14): CharacterRegistryWindow(), CharacterRegistry, compressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear(), confirm() (+6 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.10
Nodes (17): compare(), evalAll(), evalCondition(), log, applyItemGrants(), changeEvents, ctx, fakeInventoryManager (+9 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.07
Nodes (30): _warnedCatchAllProps, CategoryDisplayName, CategoryPriority, FireMode, FUEL_VALUES, ItemCategory, ItemTrait, Rarity (+22 more)

### Community 104 - "Starting Road Generation"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 106 - "Loot Generation Testing"
Cohesion: 0.17
Nodes (5): mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 107 - "Music and Playlist Manager"
Cohesion: 0.18
Nodes (4): DevConsoleProps, TabType, CardFooter, Input

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.30
Nodes (3): MainMenuWindow(), StartMenu(), IndexedDBStore

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.14
Nodes (12): getAdjustedBgColor(), UniversalGrid(), ActionProvider(), hasItemsInside(), InventoryProvider(), isClothingOrBackpack(), getBrainPulpOverrides(), getBrainstemOverrides() (+4 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.20
Nodes (4): run(), run(), assert(), verify()

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 118 - "Consumable"
Cohesion: 0.09
Nodes (23): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+15 more)

### Community 119 - "EquippedArmor"
Cohesion: 0.31
Nodes (9): applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS, TREATMENT_EFFECTS (+1 more)

### Community 121 - ".getBeltContainers"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 122 - "react"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 123 - "MinHeap"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 126 - "TurretCombat.js"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

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
Cohesion: 0.23
Nodes (4): Item, TestEntity, assert(), verify()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 134 - "verify_army_tent.js"
Cohesion: 0.08
Nodes (46): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), StartModeDialog(), StartModeDialogProps, CraftingUI(), EquipmentSlots(), ActionContext (+38 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "resolveMapEvents"
Cohesion: 0.20
Nodes (3): decompressString(), Logger, runTest()

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 144 - "apEconomy.js"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 150 - "migrateEvents.js"
Cohesion: 0.15
Nodes (4): LabMapGenerator, LAYOUT, ScenarioMapGenerator, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "verify_army_tent.js"
Cohesion: 0.12
Nodes (14): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gen, generatorTemplates (+6 more)

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 173 - "Pathfinding.js"
Cohesion: 0.09
Nodes (18): ExplosionIntent, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, runTest(), testHuntingDoorBug(), testWindowOscillations(), testWindowBug() (+10 more)

### Community 175 - "verify_saveload.mjs"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "verify_random_map_loops.mjs"
Cohesion: 0.22
Nodes (6): findSouthTransitionTile(), m1, m2, m3, r1, r2

### Community 181 - "react"
Cohesion: 0.25
Nodes (7): OptionsWindow(), useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 182 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 183 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 185 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (23): SimulationManager, ScentTrail, gm, lead, player, trail, zs, cheb() (+15 more)

### Community 188 - "NPCAISystem.js"
Cohesion: 0.53
Nodes (3): NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 190 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 192 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

## Knowledge Gaps
- **881 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+876 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `verify_army_tent.js`, `Entity Spawning and Scent`, `Character and Menu Windows`, `World Progression and Spawning`, `Turret Combat Logic`, `table.tsx`, `navigation-menu.tsx`, `Sidebar UI Components`, `Blueprint and Inventory Registry`, `Developer Console UI`, `Menubar UI Components`, `Ground Item Management`, `Scenario Map Generation`, `Form UI Components`, `Toast Notification State`, `context-menu.tsx`, `Music and Playlist Manager`, `navigation-menu.tsx`, `Book Stats Initialization`, `.getBeltContainers`, `OTP Input Components`, `TurretCombat.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Shop and Log UI` to `Item Components`, `Item Interaction Logic`, `verify_army_tent.js`, `Tooltip Components`, `Entity and Item Types`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Map Generation Config`, `Options and Crafting UI`, `Dialog and Button UI`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `ImageLoader`, `Pathfinding.js`, `pagination.tsx`, `Entity Serialization Tests`, `TemplateMapGenerator.js`, `Inventory Persistence Tests`, `Crafting Recipe Verification`, `Ground Item Management`, `Scenario Map Generation`, `Form UI Components`, `Carousel UI Components`, `Toast UI Components`, `World Object Spawning`, `.executeTransition`, `FurniturePlanner.js`, `Crop Growth Verification`, `DevConsole.tsx`, `Building Hallway Tests`, `Table UI Components`, `Inventory Item Management`, `Starting Road Generation`, `navigation-menu.tsx`, `SurvivalCascade.js`, `Consumable`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `react`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _893 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._