# Graph Report - AndroidBuilder  (2026-08-04)

## Corpus Check
- 489 files · ~6,523,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3100 nodes · 8095 edges · 156 communities (111 shown, 45 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `574986bf`
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
- apEconomy.js
- .generateFromScenario
- EntityRenderer.js
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- MapConnectivityValidator.js
- ExplosionIntent
- Building Hallway Tests
- Game.tsx
- Table UI Components
- WeatherManager
- RabbitAI
- .runTurn
- LineOfSight.js
- .generateNextMap
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- Electron Main Process
- EarbucksShopSystem
- verify_firefighter_spawn.js
- InventoryProvider
- scratch_los_test.js
- MoveIntent
- RoadGenerator
- alert.tsx
- tmp_verify_zombie_loot.js
- wagonDrag.test.js
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- MapConnectivityValidator.js
- API Query Client
- MirroredWindingRoadGenerator
- Renderable
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- Container.test.js
- MockGameMap
- Image Cropping Scripts
- ZombieTypes.js
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- eventMarkers.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `Item` - 119 edges
2. `cn()` - 119 edges
3. `createItemFromDef()` - 114 edges
4. `GameMap` - 96 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 68 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `runTest()` --references--> `json`  [EXTRACTED]
  verify_saveload.mjs → verify_phase_2.mjs
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (156 total, 45 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.16
Nodes (16): DroneConfig, consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), asDeployedItem(), canOperate(), deploy(), deployedPosition() (+8 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (86): AttributeCard(), CompactSkillRow(), SkillProgressBar(), WeaponModPanel(), WeaponModPanelProps, AccordionContent, AccordionItem, AccordionTrigger (+78 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (35): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, InventoryExtensionWindowProps, InventoryPanel(), NPCDemandDialog() (+27 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.12
Nodes (9): ScenarioPickerWindow(), getProgressionForMap(), MapProgression, electronStorage, idbStorage, ScenarioStorage, AnimalSpawner, NPCSpawner (+1 more)

### Community 6 - "Action Intent System"
Cohesion: 0.08
Nodes (12): DevConsole(), Burnable, Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., ENTITY_RESTORERS (+4 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.21
Nodes (5): CharacterCreator(), PlayerSkillsUI(), CombatResolver, brokenScopeStats, fireManyAtLongRange()

### Community 9 - "Entity Component System"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.10
Nodes (17): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+9 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.11
Nodes (23): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+15 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.10
Nodes (30): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), DevConsoleProps (+22 more)

### Community 20 - "Game Map Management"
Cohesion: 0.11
Nodes (24): applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals(), livingZombies() (+16 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (15): findSouthTransitionTile(), isInsideCompound(), isInsideTollGate(), isInStartArea(), computeTollGateLayout(), TOLLGATE_DEFAULTS, logger, ZombieReplenishmentSystem (+7 more)

### Community 23 - "Door"
Cohesion: 0.08
Nodes (33): ActionContext, ActionProvider(), AudioProvider(), CameraContext, CameraProvider(), CombatContext, CombatProvider(), provokeAndWarn() (+25 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.07
Nodes (23): LootProgression, RarityWeights, FOOD_SCARCITY, getFoodRejectionChance(), LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT (+15 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.06
Nodes (12): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.10
Nodes (18): SpeechBubbleContext, getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour(), EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to (+10 more)

### Community 27 - "useGame"
Cohesion: 0.09
Nodes (23): DownconvertedEvents, emptyEvent(), EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+15 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 34 - "Camera Viewport Control"
Cohesion: 0.08
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.25
Nodes (9): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, Quadrant (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.15
Nodes (9): AISystem, ScentTrail, door, engineMock, map, moveIntent, player, z1 (+1 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (41): emptyEntityRegistry(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem(), BUILDING_TYPES (+33 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.27
Nodes (8): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), resolveMapEvents()

### Community 44 - "ImageLoader"
Cohesion: 0.10
Nodes (5): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger, WorldManager

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (14): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString() (+6 more)

### Community 47 - "Game Engine State"
Cohesion: 0.27
Nodes (4): LineOfSight, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.39
Nodes (3): VisionSystem, buildMap(), mapWithEdgeWindow()

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.08
Nodes (31): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+23 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.22
Nodes (5): Drone, consumePhoneChargeOncePerTurn(), equipPhone(), freshBattery(), makeAirborneDrone()

### Community 62 - "TestEntity"
Cohesion: 0.29
Nodes (7): collectDeviceFov(), deviceFovHashPart(), devicePos(), listAirborneDevices(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.22
Nodes (11): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+3 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.31
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 73 - "World Object Spawning"
Cohesion: 0.16
Nodes (18): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+10 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.13
Nodes (10): createItemFromDef(), LootGenerator, isInsideAnyBuilding(), isFloor(), make(), makeItems(), deployAndLaunch(), equipPhone() (+2 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.10
Nodes (3): GameMap, log, runTest()

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.15
Nodes (11): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem (+3 more)

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (19): scripts, ap-economy, balance, budget:update, build, build-electron, check, dev (+11 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.13
Nodes (32): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), MapInterface() (+24 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.42
Nodes (9): droneEntityFilter(), ease(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.10
Nodes (28): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+20 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 93 - "EntityRenderer.js"
Cohesion: 0.17
Nodes (16): hasItemsInside(), InventoryContext, InventoryProvider(), isClothingOrBackpack(), logger, AttributeProgressionManager, applyEnergyApCap(), applySurvivalCascade() (+8 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.08
Nodes (10): AIState, RpgStats, PlaceIcon, aiComp, ent, npc, player, rabbit (+2 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.13
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.12
Nodes (9): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), computeBrainstemStewTreatment(), hammerRecipe (+1 more)

### Community 103 - "RabbitAI"
Cohesion: 0.08
Nodes (35): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), AttributeCardProps, CompactSkillRowProps, SkillProgressBarProps, EquipmentSlot, EquipmentSlotProps (+27 more)

### Community 104 - ".runTurn"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 105 - "LineOfSight.js"
Cohesion: 0.10
Nodes (7): PlayerSkills, GameInitializationManager, INIT_STATES, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.07
Nodes (19): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, PocketLayouts, CategoryDisplayName, CategoryPriority, EquipmentSlot (+11 more)

### Community 115 - "InventoryProvider"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 116 - "scratch_los_test.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 117 - "MoveIntent"
Cohesion: 0.29
Nodes (4): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 118 - "RoadGenerator"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 121 - "wagonDrag.test.js"
Cohesion: 0.60
Nodes (5): deployAndLaunch(), equipPhone(), freshBattery(), makeStowedDrone(), placeRemoteDrone()

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 125 - "MapConnectivityValidator.js"
Cohesion: 1.00
Nodes (3): deployDrone(), equipPhone(), freshBattery()

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 141 - "Container.test.js"
Cohesion: 0.17
Nodes (6): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, SplitRoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy

### Community 144 - "MockGameMap"
Cohesion: 0.16
Nodes (4): exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 147 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 157 - "eventMarkers.test.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **695 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+690 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `AI and Inventory Systems`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `ZombieTypes.js`, `Character and Menu Windows`, `Sidebar UI Components`, `EventRunner`, `Menubar UI Components`, `Audio Management System`, `Toast Notification State`, `World Object Spawning`, `App Routing and Scaling`, `Campfire Visibility Tests`, `DevConsole.tsx`, `RabbitAI`, `InventoryProvider`, `tmp_verify_zombie_loot.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Map Serialization Tests` to `traits.js`, `Item Interaction Logic`, `AI and Inventory Systems`, `NPC AI Behavior`, `Action Intent System`, `Container.test.js`, `Rabbit AI State`, `Entity and Item Types`, `World Progression and Spawning`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Combat and Turn Management`, `Container Grid Logic`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `Asset Image Loader`, `MapBuilder.js`, `Scenario Map Generation`, `Map Tile Logic`, `Item Factory Methods`, `.executeTransition`, `Campfire Visibility Tests`, `FurniturePlanner.js`, `EntityRenderer.js`, `Weapon Attachment Logic`, `MapConnectivityValidator.js`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `.runTurn`, `EarbucksShopSystem`, `verify_firefighter_spawn.js`, `scratch_los_test.js`, `wagonDrag.test.js`, `MapConnectivityValidator.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `Audio Management System`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _711 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.025716625716625717 - nodes in this community are weakly interconnected._