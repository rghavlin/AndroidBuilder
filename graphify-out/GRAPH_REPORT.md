# Graph Report - AndroidBuilder  (2026-07-23)

## Corpus Check
- 582 files · ~6,372,106 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3595 nodes · 9146 edges · 194 communities (145 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6047823`
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
- verify_phase_3.mjs
- Music and Playlist Manager
- Seeded Random Utilities
- Zombie Line-of-Sight Testing
- React Error Boundaries
- navigation-menu.tsx
- Electron Main Process
- EarbucksShopSystem
- Safe Grid Data Testing
- apEconomy.mjs
- SurvivalCascade.js
- saveGameMapToEditorState
- Consumable
- EquippedArmor
- MapCanvas.jsx
- .getBeltContainers
- tmp_verify_zombie_loot.js
- MockMap
- OTP Input Components
- table.tsx
- test_inventory_ecs.mjs
- Split Road Generation
- API Query Client
- verify_direct_load_capacity_p3_07.mjs
- Entity Transformation Scripts
- apEconomy.js
- Food Scarcity Logic
- test_noise.js
- .syncWithMap
- .applyArmorAbsorption
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- RoadGenerator
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
- verify_army_tent.js
- Electron Preload Script
- navigation-menu.tsx
- test_noise.js
- Firestation Layout Verification
- Special Window Layouts
- Place Icon Serialization
- test_noise.js
- test_noise_assert.js
- verify_saveload.mjs
- .recordHit
- test_exhaustive_los.js
- MockGameMap
- TestMapBuilder
- verify_bookstats_init_derived.mjs
- verify_army_tent.js
- MusicManager
- AttributeProgressionManager
- check_template_furniture_plan.mjs
- verify_unequip_nofit_fallback.mjs
- MockGameMap
- .dropScent
- verify_npc_weapon_stats.mjs

## God Nodes (most connected - your core abstractions)
1. `GameMap` - 144 edges
2. `Item` - 133 edges
3. `EntityFactory` - 121 edges
4. `cn()` - 119 edges
5. `createItemFromDef()` - 100 edges
6. `InventoryManager` - 90 edges
7. `engine` - 85 edges
8. `Entity` - 85 edges
9. `ItemDefs` - 69 edges
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

## Communities (194 total, 49 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.06
Nodes (23): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+15 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.07
Nodes (27): JournalUI(), drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, renderRain(), warnedMalformedEntityIds (+19 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.36
Nodes (10): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+2 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (4): getProgressionForMap(), AnimalSpawner, NPCSpawner, runDebug()

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.09
Nodes (20): AITargeting, attacker, dead, far, firstFarIdx, gameMap, gm2, lastNearIdx (+12 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.10
Nodes (12): Door, door, gm, player, z, door, engineMock, map (+4 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (25): DestroyIntent, NoiseEvent, DestructionSystem, mockEngine, MockTile, actionQueue, activeZombie, diedAny (+17 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.08
Nodes (37): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+29 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.23
Nodes (9): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached(), invertedImageCache, resolveItemMeta() (+1 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.04
Nodes (23): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, ScenarioMapGenerator, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (33): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), MapInterface() (+25 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (12): door, doorNoTag, entityMap, MockEntity, officerBob, player, resBob, resDoor (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.19
Nodes (8): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps (+17 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.04
Nodes (28): ActionPoints, AIState, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, MeleeWeapon (+20 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.08
Nodes (11): log, NOTE: This only moves the camera view, not any entities, LootProgression, MapProgression, GameInitializationManager, INIT_STATES, initManager, runDebug() (+3 more)

### Community 23 - "Door"
Cohesion: 0.06
Nodes (24): TurretAI, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, FireMode, getFuelValue() (+16 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.05
Nodes (14): Burnable, RpgStats, Rabbit, SequencerAction, FireSystem, gm, serialized, map (+6 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (14): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, run(), run() (+6 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.03
Nodes (72): TradeDialog(), TradeDialogProps, AttachmentSlot, AttachmentSlotProps, FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, AccordionContent (+64 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (4): fakeInv, FakeInventoryManager, newQuestState, savedData

### Community 28 - "Combat and Turn Management"
Cohesion: 0.12
Nodes (4): MockCtx, mockEngine, mockSprites, visibilitySet

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (36): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+28 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): activeBattery, battery, batteryData, hotplate, hotplateData, inv, map, mapHotplate (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.19
Nodes (8): CharacterRegistryWindow(), StartMenuProps, CharacterRegistry, clear(), confirm(), setItem(), store, testRegistry()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.21
Nodes (9): CraftingRecipes, runTest(), runVerification(), assert(), verify(), verifyMolotov(), runTest(), hammerRecipe (+1 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.13
Nodes (20): GridSlot, GridSlotProps, ItemContextMenu(), ItemContextMenuProps, SplitDialog(), getAdjustedBgColor(), UniversalGrid(), UniversalGridProps (+12 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.14
Nodes (22): PocketLayouts, beltArea(), buildCapacity(), cellsByType, COLLECTION_RATE, collectItem(), footprintOf(), gridArea() (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.12
Nodes (15): backpack, backpackGrid, consumed, consumedFromGround, deserialized, groundContainer, invManager, itemsInside (+7 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.19
Nodes (3): MockEntity, MockGameMap, runTests()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), applyNpcAIMode(), EventRunner, QuestState, changeEvents, ctx (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (35): emptyEvent(), EntityRegistry, GameEvent, QuestRegistry, btnStyle(), BubbleEvent, BubbleLine, BUILDING_TYPES (+27 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.13
Nodes (9): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager, computeBrainstemStewTreatment(), dropCorpse() (+1 more)

### Community 44 - "ImageLoader"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.21
Nodes (6): CharacterCreator(), PlayerSkillsUI(), getZombieType(), spitAtPlayer(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (12): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, clear(), getItem(), runTests() (+4 more)

### Community 47 - "Game Engine State"
Cohesion: 0.16
Nodes (8): LineOfSight, logger, Quadrant, slope(), main(), main(), main(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "Blueprint and Inventory Registry"
Cohesion: 0.15
Nodes (18): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, StartMenuButtons() (+10 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.19
Nodes (3): Window, mockLocalStorage, runTest()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.14
Nodes (12): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, gen, generatorTemplates, mapData, northX (+4 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+10 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.14
Nodes (15): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FactionRegistry (+7 more)

### Community 54 - "Zombie Visibility Tracking"
Cohesion: 0.15
Nodes (5): PlayerZombieTracker, map, player, tracker, zombie

### Community 55 - "pagination.tsx"
Cohesion: 0.07
Nodes (20): AIBehavior, Health, LightEmitter, Movable, Position, Renderable, aiCustom, aiDefault (+12 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.14
Nodes (17): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, PlayerSkillsWindowProps, applySurvivalCascade() (+9 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.12
Nodes (15): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+7 more)

### Community 61 - "Inventory Persistence Tests"
Cohesion: 0.12
Nodes (11): DamageIntent, MoveIntent, IntentQueue, AISystem, CombatSystem, MovementSystem, VisionSystem, computeHearingZone() (+3 more)

### Community 62 - "Save Game Management"
Cohesion: 0.08
Nodes (31): ActionContext, ActionProvider(), CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), GameProvider(), GameMapContext (+23 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.12
Nodes (33): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel() (+25 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.11
Nodes (6): MockCanvasContext, mockEngine, mockLocalStorage, mockSprites, mockVisibilitySet, runTest()

### Community 66 - "Form UI Components"
Cohesion: 0.23
Nodes (4): Item, TestEntity, assert(), verify()

### Community 67 - "Door Interaction Logic"
Cohesion: 0.09
Nodes (22): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES, resolveMapEvents(), alreadyUnified, dcGuardIntro, dcGuardThanks (+14 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.21
Nodes (6): deriveRoadBands(), MirroredWindingRoadGenerator, hasRoadFrontage(), isInsideBuilding(), PatchedMirroredWindingRoadGenerator, runTest()

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.17
Nodes (12): InventoryExtensionWindowProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps, GridSlotSizeConfig, useGridSlotSize() (+4 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.42
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 74 - "Map Tile Logic"
Cohesion: 0.12
Nodes (4): COMPONENT_NAME_BY_CTOR, set(), assert(), verify()

### Community 75 - "Map Serialization Tests"
Cohesion: 0.10
Nodes (16): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), __dirname, __filename (+8 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.21
Nodes (7): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner, buildings, runVerification()

### Community 77 - "Item Factory Methods"
Cohesion: 0.16
Nodes (6): NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), runCycle(), emptyTiles(), loadScenario()

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
Cohesion: 0.10
Nodes (28): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+20 more)

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
Cohesion: 0.06
Nodes (33): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+25 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "Registry Storage Tests"
Cohesion: 0.21
Nodes (9): getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), wander(), Pathfinding, runTest() (+1 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 102 - "Faction Registry System"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 104 - "Starting Road Generation"
Cohesion: 0.19
Nodes (6): PlaceIcon, computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, assert(), verify()

### Community 105 - "LineOfSight.js"
Cohesion: 0.20
Nodes (9): bottle1, bottle2, bottle3, bottle4, bottle5, canStackEmpty, canStackFull, canStackPartial (+1 more)

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 109 - "Zombie Line-of-Sight Testing"
Cohesion: 0.09
Nodes (18): CategoryDisplayName, CategoryPriority, EquipmentSlot, FUEL_VALUES, ItemCategory, ItemTrait, SlotDisplayName, SimulationManager (+10 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 112 - "Electron Main Process"
Cohesion: 0.24
Nodes (8): createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, saveDir, scenarioDir

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.29
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, assert(), verify()

### Community 115 - "apEconomy.mjs"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 117 - "saveGameMapToEditorState"
Cohesion: 0.31
Nodes (10): emptyEntityRegistry(), emptyQuestRegistry(), downconvertEvents(), buildFullItem(), getBatterySlotInfo(), itemToEditorEntry(), looseFurnitureFrom(), pieceKey() (+2 more)

### Community 118 - "Consumable"
Cohesion: 0.20
Nodes (9): cm, container, inContainer, mockInv, singleItem, stack, stack2, waterBottleDef (+1 more)

### Community 119 - "EquippedArmor"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 121 - ".getBeltContainers"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.22
Nodes (6): findSouthTransitionTile(), m1, m2, m3, r1, r2

### Community 124 - "OTP Input Components"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "table.tsx"
Cohesion: 0.14
Nodes (9): DevConsole(), exportScenario(), main(), runTests(), assert(), verify(), MockGameMap, testWallGapFix() (+1 more)

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "Entity Transformation Scripts"
Cohesion: 0.33
Nodes (5): content, filepath, propsToRemove, propsToRemoveFromJson, propsToRemoveJson

### Community 131 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 132 - "Food Scarcity Logic"
Cohesion: 0.60
Nodes (5): base64ToBuffer(), bufferToBase64(), compressString(), decompressString(), run()

### Community 134 - ".syncWithMap"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "balance.js"
Cohesion: 0.25
Nodes (7): gameMap, itemsOnTile, loadedGrid, loadedSafe, originalGrid, originalSafe, safeData

### Community 145 - ".runTurn"
Cohesion: 0.08
Nodes (32): EntityFactory, testCornerBug(), testDiagonalBug(), build(), run(), runOscillationTest(), runTest(), testHuntingDoorBug() (+24 more)

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
Cohesion: 0.33
Nodes (4): escalated, map, player, shopkeeper

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 170 - "test_noise.js"
Cohesion: 0.33
Nodes (4): entities, wm, wm2, zombies

### Community 171 - "test_noise_assert.js"
Cohesion: 0.10
Nodes (10): BaseMapGenerator, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, gameRandom, makeSeededRandom(), brokenScopeStats, builder, mapData, t0 (+2 more)

### Community 173 - ".recordHit"
Cohesion: 0.20
Nodes (7): removeDestroyedTurret(), gridItems(), getPoweredTurretForEntity(), chargerContents(), testZombieFireDeath(), runTest(), warnCalls

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 175 - "MockGameMap"
Cohesion: 0.15
Nodes (3): getItem(), MockGameMap, runTests()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "verify_bookstats_init_derived.mjs"
Cohesion: 0.25
Nodes (5): engine, expected, fresh, loaded, readableIds

### Community 179 - "verify_army_tent.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 183 - "verify_unequip_nofit_fallback.mjs"
Cohesion: 0.67
Nodes (3): buildMap(), los(), mapWithEdgeWindow()

### Community 186 - ".dropScent"
Cohesion: 0.07
Nodes (22): tryFollowScent(), ScentTrail, gm, lead, player, trail, zs, cheb() (+14 more)

## Knowledge Gaps
- **931 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+926 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Action Queue Processing` to `Game Engine Context`, `Action Intent System`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Character and Menu Windows`, `table.tsx`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Dialog and Button UI`, `ImageLoader`, `Blueprint and Inventory Registry`, `Menubar UI Components`, `Entity Serialization Tests`, `Ground Item Management`, `Toast Notification State`, `Carousel UI Components`, `Toast UI Components`, `context-menu.tsx`, `Command UI Components`, `Faction Registry System`, `OTP Input Components`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `OTP Input Components`, `.syncWithMap`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Map Serialization Tests` to `traits.js`, `Item Interaction Logic`, `NPC AI Behavior`, `Entity Component System`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `balance.js`, `Door`, `Inventory Management System`, `Map Generation Config`, `Options and Crafting UI`, `Dialog and Button UI`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `test_noise_assert.js`, `TemplateMapGenerator.js`, `Inventory Persistence Tests`, `Save Game Management`, `Crafting Recipe Verification`, `Ground Item Management`, `Item Factory Methods`, `FurniturePlanner.js`, `Crop Growth Verification`, `Command UI Components`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Starting Road Generation`, `Zombie Line-of-Sight Testing`, `EarbucksShopSystem`, `saveGameMapToEditorState`, `EquippedArmor`, `MockMap`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _943 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._