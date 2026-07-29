# Graph Report - AndroidBuilder  (2026-07-28)

## Corpus Check
- 604 files · ~6,539,775 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3685 nodes · 9454 edges · 185 communities (141 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1554d9ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- traits.js
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
- DevConsole.tsx
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
- MapBuilder.js
- TestEntity
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
- Item Stacking Verification
- Building Hallway Tests
- sheet.tsx
- Table UI Components
- Faction Registry System
- Inventory Item Management
- Starting Road Generation
- LineOfSight.js
- .generateNextMap
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- MockCtx
- Electron Main Process
- EarbucksShopSystem
- MockGameMap
- .addItem
- SurvivalCascade.js
- saveGameMapToEditorState
- Row
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- tmp_verify_zombie_loot.js
- verify_water_stacking.mjs
- OTP Input Components
- StartMenu.tsx
- test_inventory_ecs.mjs
- test_exhaustive_los.js
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- chart.tsx
- Food Scarcity Logic
- test_noise.js
- command.tsx
- .applyArmorAbsorption
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RoadGenerator
- Container.test.js
- Tile Listener Testing
- DialogOverlay.tsx
- form.tsx
- .runTurn
- Image Cropping Scripts
- JSON Export Scripts
- Entity Fix Scripts
- TerrainTypes.js
- migrateEvents.js
- NPM Configuration Testing
- table.tsx
- Electron Preload Script
- navigation-menu.tsx
- .addItem
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- Place Icon Serialization
- apEconomy.mjs
- gridItems
- tmp_verify_zombie_loot.js
- react
- test_exhaustive_los.js
- TestMapBuilder
- test_safe_fix.js
- test_golf_cart_editor.js
- MusicManager
- wagonDrag.test.js
- verify_bookstats_init_derived.mjs
- MockGameMap
- verify_rain_collector_size.mjs
- verify_worldmanager_populate_p4_02.mjs

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 151 edges
2. `Item` - 139 edges
3. `EntityFactory` - 122 edges
4. `cn()` - 119 edges
5. `createItemFromDef()` - 110 edges
6. `engine` - 93 edges
7. `Entity` - 93 edges
8. `InventoryManager` - 91 edges
9. `ItemDefs` - 72 edges
10. `TemplateMapGenerator` - 60 edges

## Surprising Connections (you probably didn't know these)
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep2.mjs → client/src/game/EntityFactory.js
- `addPlayer()` --references--> `EntityFactory`  [EXTRACTED]
  scratch/diagnose_sidestep.mjs → client/src/game/EntityFactory.js
- `npc()` --references--> `EntityFactory`  [EXTRACTED]
  test/entities/entityFaction.test.js → client/src/game/EntityFactory.js
- `buildFullItem()` --calls--> `createItemFromDef()`  [EXTRACTED]
  scratch/test_golf_cart_editor.js → client/src/game/inventory/ItemDefs.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (185 total, 44 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (77): ShopItemRow(), AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AccordionContent (+69 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (40): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InventoryExtensionWindowProps, InventoryPanel(), TollWindow() (+32 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (6): getProgressionForMap(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 6 - "Action Intent System"
Cohesion: 0.04
Nodes (35): ActionPoints, AIBehavior, Health, Inventory, InventoryContainer, LightEmitter, Movable, Position (+27 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (14): Door, PlaceIcon, door, gm, player, z, runTest(), door (+6 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.10
Nodes (24): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, ItemContextMenuProps, WeaponModPanel() (+16 more)

### Community 9 - "Entity Component System"
Cohesion: 0.10
Nodes (18): DamageIntent, DestroyIntent, MoveIntent, getZombieType(), engine, IntentQueue, AISystem, spitAtPlayer() (+10 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (40): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+32 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.04
Nodes (25): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, doorsForBuilding(), PLAYER_FLOOD_OPTS, validateConnectivity(), isInsideCompound() (+17 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.14
Nodes (19): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), JournalUI(), MapInterface() (+11 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.14
Nodes (19): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+11 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.50
Nodes (4): EntityRegistry, GameEvent, QuestRegistry, ScenarioData

### Community 19 - "Character and Menu Windows"
Cohesion: 0.16
Nodes (22): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem (+14 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (3): GameInitializationManager, initManager, runDebug()

### Community 23 - "Door"
Cohesion: 0.21
Nodes (9): CraftingRecipes, runTest(), runVerification(), assert(), verify(), verifyMolotov(), runTest(), hammerRecipe (+1 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (21): ExplosionSystem, actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item (+13 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (13): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), run(), run(), testSerialization(), assert() (+5 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.05
Nodes (33): testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, RarityWeights (+25 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.07
Nodes (24): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+16 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.12
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.07
Nodes (59): InfectionHUD(), drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain() (+51 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.23
Nodes (6): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+35 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 44 - "ImageLoader"
Cohesion: 0.13
Nodes (5): applyMapRegistries(), QuestState, hasScenario, loadScenario(), SCENARIO

### Community 45 - "Asset Image Loader"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (13): formatTimestamp(), SaveGameWindow(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runTest() (+5 more)

### Community 47 - "Game Engine State"
Cohesion: 0.19
Nodes (7): LineOfSight, slope(), main(), main(), main(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.10
Nodes (19): attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx, near (+11 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.07
Nodes (26): getNPCType(), floodFill(), findAttackSlotPath(), getMeleeReach(), isMeleeAttackPosition(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+18 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.14
Nodes (15): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry (+7 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.04
Nodes (30): AIState, Consumable, EquippedArmor, Item, MeleeWeapon, NoiseEvent, PlayerSkills, PlayerWallet (+22 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.22
Nodes (6): findSouthTransitionTile(), m1, m2, m3, r1, r2

### Community 58 - "Audio Management System"
Cohesion: 0.11
Nodes (7): debugLog(), NOTE: Structural damage (hp reduction, break/open flags) was already, TurnManager, AudioManager, debugLog(), playback, queue

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.05
Nodes (15): RabbitAI, Burnable, Rabbit, SequencerAction, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gm, serialized (+7 more)

### Community 62 - "TestEntity"
Cohesion: 0.23
Nodes (4): Item, TestEntity, assert(), verify()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.07
Nodes (24): SimulationManager, tryFollowScent(), ScentTrail, gm, lead, player, trail, zs (+16 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 66 - "Form UI Components"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (21): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, alreadyUnified, dcGuardIntro, dcGuardThanks, dcNpcMutter (+13 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.10
Nodes (10): DevConsole(), ScenarioMapGenerator, exportScenario(), main(), runTests(), assert(), verify(), MockGameMap (+2 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.13
Nodes (14): CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), ExplosionIntent, dropZombieDeathLoot(), getCorpseOverrides(), ZombieCorpseConfig (+6 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.10
Nodes (11): INIT_STATES, BaseMapGenerator, isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, gameRandom, makeSeededRandom() (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.09
Nodes (8): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), buildings, gameMap, generator, generator

### Community 78 - "Item Movement Logic"
Cohesion: 0.10
Nodes (11): GarageDoor, campfire, groundItemsInContainer, isCampfireVisible, isCampfireVisibleInitially, isTileAroundCampfireVisible, isTileAroundCampfireVisibleCase2, items (+3 more)

### Community 79 - ".executeTransition"
Cohesion: 0.09
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
Cohesion: 0.35
Nodes (9): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.29
Nodes (8): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, assert(), verify()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.08
Nodes (33): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+25 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.07
Nodes (11): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+3 more)

### Community 92 - "Chart UI Components"
Cohesion: 0.16
Nodes (3): fakeInv, FakeInventoryManager, registry

### Community 94 - "DevConsole.tsx"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "Item Stacking Verification"
Cohesion: 0.22
Nodes (6): gen, generatorTemplates, mapData, northX, roadTemplate, southX

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "sheet.tsx"
Cohesion: 0.43
Nodes (4): AITargeting, TurretAI, assert(), verify()

### Community 101 - "Table UI Components"
Cohesion: 0.10
Nodes (15): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, getItemName(), getFuelValue(), computeBrainstemStewTreatment(), cm, container (+7 more)

### Community 103 - "Inventory Item Management"
Cohesion: 0.07
Nodes (31): NPCTypes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, createItemFromDef(), ItemDefs, FireMode, Rarity (+23 more)

### Community 104 - "Starting Road Generation"
Cohesion: 0.10
Nodes (21): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+13 more)

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 107 - "Music and Playlist Manager"
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.13
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "MockCtx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 114 - "MockGameMap"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 115 - ".addItem"
Cohesion: 0.18
Nodes (9): before, harvestable, items, map, offenders, plant, plantEntity, stalePlant (+1 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 117 - "saveGameMapToEditorState"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 118 - "Row"
Cohesion: 0.29
Nodes (4): dialogOnlySteps, mixedEvent, placedLog, step

### Community 120 - "MapCanvas.jsx"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 123 - "verify_water_stacking.mjs"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.08
Nodes (43): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow() (+35 more)

### Community 125 - "StartMenu.tsx"
Cohesion: 0.17
Nodes (9): CharacterRegistryWindow(), CreditsWindow(), StartMenuProps, CharacterRegistry, clear(), confirm(), setItem(), store (+1 more)

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 133 - "test_noise.js"
Cohesion: 0.36
Nodes (10): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+2 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 145 - ".runTurn"
Cohesion: 0.09
Nodes (32): EntityFactory, markHeardIfInRange(), testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), testHuntingDoorBug() (+24 more)

### Community 146 - "Image Cropping Scripts"
Cohesion: 0.50
Nodes (3): cropImage(), Jimp, processImage()

### Community 149 - "TerrainTypes.js"
Cohesion: 0.26
Nodes (8): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), logger, Quadrant, EXPECTED

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "table.tsx"
Cohesion: 0.43
Nodes (4): clear(), getItem(), runTests(), setItem()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 171 - "gridItems"
Cohesion: 0.29
Nodes (6): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), chargerContents(), runTest(), warnCalls

### Community 172 - "tmp_verify_zombie_loot.js"
Cohesion: 0.11
Nodes (8): NOTE: do NOT force itemsModified for every container/attachment item., Pathfinding, testResults, buildMap(), mapWithEdgeWindow(), runCycle(), emptyTiles(), loadScenario()

### Community 173 - "react"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "test_safe_fix.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 179 - "test_golf_cart_editor.js"
Cohesion: 0.29
Nodes (5): buildFullItem(), customEditorItem, defaultAtts, fullCart, golfCartItem

### Community 182 - "wagonDrag.test.js"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 183 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 190 - "verify_worldmanager_populate_p4_02.mjs"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

## Knowledge Gaps
- **949 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+944 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `Action Queue Processing`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Menubar UI Components`, `MockCtx`, `SurvivalCascade.js`, `saveGameMapToEditorState`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Form UI Components`, `Dialog and Button UI`, `AI and Inventory Systems`, `Road and Town Generation`, `External Dependencies`, `Rabbit AI State`, `Action Queue Processing`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _964 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.025355596784168214 - nodes in this community are weakly interconnected._