# Graph Report - AndroidBuilder  (2026-07-16)

## Corpus Check
- 539 files · ~5,977,001 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3365 nodes · 8367 edges · 176 communities (128 shown, 48 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d990430c`
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
- resolveMapEvents
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
- verify_bookstats_init_derived.mjs
- .dropScent

## God Nodes (most connected - your core abstractions)
1. `Item` - 131 edges
2. `GameMap` - 122 edges
3. `cn()` - 117 edges
4. `EntityFactory` - 112 edges
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
- `testWindowOscillations()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_side_window.mjs → client/src/game/EntityFactory.js
- `testWindowBug()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/reproduce_window_bug.mjs → client/src/game/EntityFactory.js
- `test911()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/test_9_11.mjs → client/src/game/EntityFactory.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (176 total, 48 thin omitted)

### Community 0 - "Item Components"
Cohesion: 0.12
Nodes (27): EntityFactory, AISystem, tryFollowScent(), CombatSystem, MovementSystem, VisionSystem, markHeardIfInRange(), testCornerBug() (+19 more)

### Community 1 - "UI Components"
Cohesion: 0.16
Nodes (7): BlueprintRegistry, Inventory, __dirname, __filename, __dirname, __filename, runTests()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (12): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), generator, indoorMap, outdoorMap, applyItemGrants() (+4 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.06
Nodes (30): RabbitAI, getNPCType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), getMeleeReach(), getBeelineIntent() (+22 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.22
Nodes (6): findSouthTransitionTile(), m1, m2, m3, r1, r2

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (23): TurretAI, CraftingRecipes, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., getItemName(), ItemDefs, FireMode, getFuelValue(), __dirname (+15 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.13
Nodes (22): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+14 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (32): DestroyIntent, MoveIntent, NoiseEvent, IntentQueue, AudioSystem, DestructionSystem, ExplosionSystem, FireSystem (+24 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.06
Nodes (18): ExplosionIntent, Item, MeleeWeapon, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., findAttackSlotPath(), isMeleeAttackPosition(), door (+10 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.15
Nodes (22): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+14 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.05
Nodes (19): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, isInsideBuilding(), verifyMap4() (+11 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DevConsoleProps, TabType, HelpWindow() (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (8): GameInitializationManager, initManager, assert(), verify(), runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 24 - "Turret Combat Logic"
Cohesion: 0.10
Nodes (24): DevConsoleShopManager(), EarbucksShopWindowProps, ShopItemRowProps, DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES (+16 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), run(), run(), testSerialization(), assert() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (67): JournalUI(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog() (+59 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.07
Nodes (16): gridItems(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+8 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 31 - "Template and World Config"
Cohesion: 0.05
Nodes (25): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, MAP_WIDE_UNIQUES, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+17 more)

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
Cohesion: 0.22
Nodes (7): CharacterRegistryWindow(), CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.09
Nodes (8): LabMapGenerator, MapBuilder, testLabGen(), verify(), printHouse(), runTests(), TestMapBuilder, test()

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
Cohesion: 0.19
Nodes (4): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, computeBrainstemStewTreatment()

### Community 45 - "Asset Image Loader"
Cohesion: 0.26
Nodes (3): CharacterCreator(), PlayerSkillsUI(), CombatResolver

### Community 46 - "Turret AI Testing"
Cohesion: 0.08
Nodes (8): Container, _warnedCatchAllProps, testResults, CategoryDisplayName, CategoryPriority, SlotDisplayName, im, tiny

### Community 47 - "Game Engine State"
Cohesion: 0.17
Nodes (8): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test()

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
Cohesion: 0.20
Nodes (7): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.16
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "Dialog UI Components"
Cohesion: 0.17
Nodes (12): compare(), evalAll(), evalCondition(), log, changeEvents, ctx, fakeInventoryManager, json (+4 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.17
Nodes (14): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds, SpeechBubbleInput() (+6 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "Entity Mocking System"
Cohesion: 0.29
Nodes (3): TollGateSystem, assert(), verify()

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (10): MapProgression, INIT_STATES, BaseMapGenerator, LAYOUT, isInsideTollGate(), logger, ZombieReplenishmentSystem, gameRandom (+2 more)

### Community 62 - "Save Game Management"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.07
Nodes (33): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+25 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.06
Nodes (42): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor() (+34 more)

### Community 66 - "Form UI Components"
Cohesion: 0.11
Nodes (12): getProgressionForMap(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, escalated, map (+4 more)

### Community 67 - "Door Interaction Logic"
Cohesion: 0.10
Nodes (17): alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter, dcRadioChatter, empty, eventsWithUnsupportedStep, { eventTriggers, bubbleEvents } (+9 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.18
Nodes (4): DamageIntent, Vision, MockTile, runTest()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 78 - "Item Movement Logic"
Cohesion: 0.11
Nodes (3): WorldManager, assert(), verify()

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
Cohesion: 0.11
Nodes (18): scripts, ap-economy, balance, build, build-electron, check, dev, electron (+10 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.17
Nodes (10): campfire, groundItemsInContainer, isCampfireVisible, isCampfireVisibleInitially, isTileAroundCampfireVisible, isTileAroundCampfireVisibleCase2, items, map (+2 more)

### Community 84 - "Canvas Context Mocking"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

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
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.11
Nodes (14): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runTest(), clear(), getItem() (+6 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.17
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 102 - "Faction Registry System"
Cohesion: 0.22
Nodes (7): FactionRegistry, FACTIONS, STANCE, STANCES, VALID_FACTIONS, runTest(), warnCalls

### Community 103 - "Inventory Item Management"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 106 - "Loot Generation Testing"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.29
Nodes (10): createAmmo(), createArmor(), createAttachment(), createClothing(), createFood(), createItem(), createMedical(), createTool() (+2 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "navigation-menu.tsx"
Cohesion: 0.31
Nodes (9): applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS, TREATMENT_EFFECTS (+1 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.29
Nodes (7): createWindow(), __dirname, __filename, getMimeType(), mimeTypes, saveDir, scenarioDir

### Community 113 - "GameEvent"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 114 - "Safe Grid Data Testing"
Cohesion: 0.04
Nodes (40): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Health, InventoryContainer, LightEmitter (+32 more)

### Community 115 - "Book Stats Initialization"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 116 - "Map Transition Verification"
Cohesion: 0.05
Nodes (20): AIState, Rabbit, SequencerAction, gm, serialized, aiComp, ent, json (+12 more)

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
Cohesion: 0.33
Nodes (6): OptionsWindow(), useCarousel(), useChart(), useFormField(), useSidebar(), react

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 126 - "TurretCombat.js"
Cohesion: 0.25
Nodes (12): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+4 more)

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "verify_direct_load_capacity_p3_07.mjs"
Cohesion: 0.07
Nodes (20): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gm, wm, gm, wm (+12 more)

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
Cohesion: 0.09
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+14 more)

### Community 137 - "Playback Cancellation Testing"
Cohesion: 0.26
Nodes (5): DevConsole(), CameraContext, CameraProvider(), main(), testWallGapFix()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 144 - "tmp_verify_clip.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 150 - "migrateEvents.js"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 152 - "test_shopkeeper_hostility.mjs"
Cohesion: 0.12
Nodes (17): ConditionKind, emptyEvent(), EntityRegistry, EntityRegistryEntry, FlagDef, GameEvent, Placement, PlacementKind (+9 more)

### Community 153 - "verify_army_tent.js"
Cohesion: 0.07
Nodes (60): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), StartModeDialog(), StartModeDialogProps, CampfireUI(), CampfireUIProps, CraftingUI() (+52 more)

### Community 157 - "command.tsx"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 171 - "resolveMapEvents"
Cohesion: 0.53
Nodes (5): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents()

### Community 175 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.07
Nodes (18): engine, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, Rarity, SafeEventEmitter, readableBooks (+10 more)

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (23): SimulationManager, ScentTrail, gm, lead, player, trail, zs, cheb() (+15 more)

## Knowledge Gaps
- **866 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+861 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `verify_army_tent.js`, `Entity Spawning and Scent`, `Character and Menu Windows`, `World Progression and Spawning`, `Turret Combat Logic`, `verify_army_tent.js`, `Sidebar UI Components`, `command.tsx`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Ground Item Management`, `Scenario Map Generation`, `context-menu.tsx`, `Attribute Progression System`, `Dropdown UI Components`, `GameEvent`, `Book Stats Initialization`, `EquippedArmor`, `OTP Input Components`, `table.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `MinHeap`, `OTP Input Components`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react` connect `MinHeap` to `External Dependencies`, `Save Game Management`, `verify_army_tent.js`, `Sidebar UI Components`, `Dropdown UI Components`, `Entity Serialization Tests`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _878 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Components` be split into smaller, more focused modules?**
  _Cohesion score 0.12481857764876633 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.053923541247484906 - nodes in this community are weakly interconnected._
- **Should `AI and Inventory Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.09856035437430787 - nodes in this community are weakly interconnected._