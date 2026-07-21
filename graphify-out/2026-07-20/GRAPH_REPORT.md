# Graph Report - AndroidBuilder  (2026-07-20)

## Corpus Check
- 556 files · ~10,002,223 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3512 nodes · 8756 edges · 192 communities (140 shown, 52 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc81dfee`
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
- test_noise.js
- test_noise_assert.js
- verify_saveload.mjs
- MockTile
- MockGameMap
- TestMapBuilder
- verify_loadmap_dedup_p4_03.mjs
- verify_bookstats_init_derived.mjs
- verify_south_transition_p4_07.mjs
- MusicManager
- Logger
- test_save_compression.js
- MockGameMap
- verify_firefighter_spawn.js
- .dropScent
- npcLoadout.test.js
- verify_production_frontage.js

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 133 edges
2. `Item` - 131 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 116 edges
5. `createItemFromDef()` - 97 edges
6. `InventoryManager` - 90 edges
7. `engine` - 82 edges
8. `Entity` - 81 edges
9. `ItemDefs` - 66 edges
10. `TemplateMapGenerator` - 59 edges

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

## Communities (192 total, 52 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.05
Nodes (24): ActionPoints, ExplosionIntent, RpgStats, SurvivalStats, Vision, COMPONENT_CLASSES, NPCTypes, EntityFactory (+16 more)

### Community 1 - "UI Components"
Cohesion: 0.07
Nodes (36): BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14, COTTAGE_1BED (+28 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.10
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.14
Nodes (21): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+13 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (18): RabbitAI, getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent() (+10 more)

### Community 6 - "Action Intent System"
Cohesion: 0.28
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (26): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+18 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.08
Nodes (10): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideTollGate(), allErrors, generator, subtypes, gameMap (+2 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (37): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+29 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (21): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+13 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.05
Nodes (18): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding() (+10 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.07
Nodes (12): Burnable, Rabbit, SequencerAction, gm, serialized, map, mockTile, npc (+4 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.06
Nodes (31): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., createItemFromDef(), getItemName() (+23 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.13
Nodes (10): BlueprintRegistry, Inventory, __dirname, __filename, runReproduction(), __dirname, __filename, runTests() (+2 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.07
Nodes (47): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow() (+39 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.18
Nodes (5): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, runCycle()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.16
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 23 - "Door"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.21
Nodes (4): getProgressionForMap(), AnimalSpawner, NPCSpawner, runVerification()

### Community 25 - "Inventory Management System"
Cohesion: 0.09
Nodes (3): InventoryManager, manager, verifyLoadSwaps()

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (58): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+50 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.07
Nodes (16): ZombieTooltip(), ZombieTooltipProps, ZombieTypes, FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank() (+8 more)

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
Cohesion: 0.32
Nodes (3): OptionsWindow(), StartMenu(), IndexedDBStore

### Community 33 - "Options and Crafting UI"
Cohesion: 0.06
Nodes (36): DevConsoleShopManager(), AITargeting, CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory() (+28 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.19
Nodes (15): CombatContext, CombatProvider(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets() (+7 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.20
Nodes (4): BranchingRoadGenerator, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 38 - "Building Layout Builder"
Cohesion: 0.19
Nodes (3): MapBuilder, verify(), test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), EntityRegistryEntry, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+35 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.26
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (8): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, runTest(), runTest(), assert(), verify()

### Community 47 - "Game Engine State"
Cohesion: 0.07
Nodes (19): LineOfSight, logger, Quadrant, Row, slope(), hasCorner, map, MockGameMap (+11 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.17
Nodes (11): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, gen, generatorTemplates, mapData, northX, roadTemplate (+3 more)

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
Cohesion: 0.06
Nodes (22): AIBehavior, Health, InventoryContainer, LightEmitter, Movable, Position, Renderable, aiCustom (+14 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (12): DamageIntent, MoveIntent, IntentQueue, AISystem, AudioSystem, CombatSystem, MovementSystem, VisionSystem (+4 more)

### Community 62 - "Save Game Management"
Cohesion: 0.08
Nodes (43): StartModeDialog(), StartModeDialogProps, ActionContext, ActionProvider(), AudioProvider(), GameContext, GameContextInner(), GameProvider() (+35 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.08
Nodes (42): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryExtensionWindowProps, InventoryPanel() (+34 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (5): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet

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
Cohesion: 0.18
Nodes (11): CraftingRecipes, runTest(), runVerification(), assert(), verify(), isUncommonDrop, recipe, verifyMolotov() (+3 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.06
Nodes (33): TurretAI, DestroyIntent, EquippedArmor, Item, MeleeWeapon, NoiseEvent, MapProgression, getSightRangeForHour() (+25 more)

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
Cohesion: 0.07
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+3 more)

### Community 91 - "Crop Growth Verification"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 93 - "Command UI Components"
Cohesion: 0.15
Nodes (4): runContainerTests(), testSerialization(), KNOWN_FAILURES, results

### Community 94 - "DevConsole.tsx"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (3): DevConsoleProps, TabType, Input

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.18
Nodes (10): CharacterRegistryWindow(), CharacterRegistryWindowProps, StartMenuProps, CharacterRegistry, idbStore, clear(), confirm(), setItem() (+2 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.09
Nodes (21): LootProgression, ItemCategory, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT (+13 more)

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.04
Nodes (38): Container, _warnedCatchAllProps, testResults, CategoryDisplayName, CategoryPriority, FireMode, FUEL_VALUES, ItemTrait (+30 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.18
Nodes (4): gridItems(), getPoweredTurretForEntity(), chargerContents(), TurnProcessingUtils

### Community 106 - "Loot Generation Testing"
Cohesion: 0.13
Nodes (11): AIState, assert(), verify(), aiComp, ent, json, npc, player (+3 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.19
Nodes (11): compare(), evalAll(), evalCondition(), changeEvents, ctx, fakeInventoryManager, json, qs (+3 more)

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
Cohesion: 0.22
Nodes (9): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify(), assert() (+1 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 117 - "Zombie Interaction Testing"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.33
Nodes (5): DevConsole(), CameraProvider(), main(), testWallGapFix(), verifyRestoration()

### Community 126 - "alert.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

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
Cohesion: 0.23
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

### Community 140 - "test_exhaustive_los_85.js"
Cohesion: 0.40
Nodes (4): run(), run(), assert(), verify()

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 145 - ".runTurn"
Cohesion: 0.14
Nodes (17): FireSystem, computeHearingZone(), testCornerBug(), testDiagonalBug(), run(), runOscillationTest(), runTest(), main() (+9 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 149 - "Quadrant"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

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
Cohesion: 0.18
Nodes (3): PlayerSkills, PlayerWallet, runTest()

### Community 170 - "test_noise.js"
Cohesion: 0.19
Nodes (12): apValues, arenaSeed, args, compareVitals(), configs, makeOpenArena(), maxScavengeRadius(), referenceDistance (+4 more)

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 179 - "verify_south_transition_p4_07.mjs"
Cohesion: 0.08
Nodes (15): PlaceIcon, findSouthTransitionTile(), NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map, player, shopkeeper, assert() (+7 more)

### Community 182 - "test_save_compression.js"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 185 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (22): tryFollowScent(), ScentTrail, gm, lead, player, trail, zs, cheb() (+14 more)

## Knowledge Gaps
- **914 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+909 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `AI and Inventory Systems`, `Action Intent System`, `Shop and Log UI`, `Inventory and Skill Windows`, `Map Template Generation`, `Character and Menu Windows`, `table.tsx`, `navigation-menu.tsx`, `Combat and Turn Management`, `Sidebar UI Components`, `EventRunner`, `ImageLoader`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Ground Item Management`, `Carousel UI Components`, `Map Tile Logic`, `context-menu.tsx`, `Weapon Attachment Logic`, `Safe Grid Data Testing`, `OTP Input Components`, `alert.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `HUD and Dialog UI` to `Item Interaction Logic`, `Shop and Log UI`, `Tooltip Components`, `test_exhaustive_los_85.js`, `Entity and Item Types`, `Entity Spawning and Scent`, `Map Template Generation`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Map Generation Config`, `Options and Crafting UI`, `Dialog and Button UI`, `Road and Town Generation`, `Map Editor Tools`, `Crafting Manager Logic`, `verify_south_transition_p4_07.mjs`, `Developer Console UI`, `Entity Serialization Tests`, `Save Game Management`, `Crafting Recipe Verification`, `Ground Item Management`, `npcLoadout.test.js`, `World Object Spawning`, `Map Serialization Tests`, `App Routing and Scaling`, `FurniturePlanner.js`, `Crop Growth Verification`, `Building Hallway Tests`, `Table UI Components`, `Inventory Item Management`, `Starting Road Generation`, `LineOfSight.js`, `Book Stats Initialization`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `verify_direct_load_capacity_p3_07.mjs`, `OTP Input Components`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _926 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0504828797190518 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._