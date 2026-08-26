# Graph Report - AndroidBuilder  (2026-08-26)

## Corpus Check
- 547 files · ~7,270,263 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3344 nodes · 9051 edges · 169 communities (120 shown, 49 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac8bf43e`
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
- DevConsole.tsx
- RabbitAI
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
- TollGateSystem
- Building Hallway Tests
- ConfigManager
- Table UI Components
- WeatherManager
- RabbitAI
- .runTurn
- LineOfSight.js
- navigation-menu.tsx
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- .isEdgeBlocked
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- runContainerTests
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- lineOfSight.test.js
- MoveIntent
- apEconomy.js
- ZombieTypes.js
- .combineWith
- .toJSON
- .recordHit
- ._restoreTilesAndEntities
- .processTurn
- QuestState.js
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- log
- CorridorLootGenerator
- Drone
- .generateFromScenario
- Image Cropping Scripts
- MockGameMap
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- bench_houses.mjs
- Electron Preload Script
- SplitRoadGenerator
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- Row
- TestMapBuilder
- tmp_verify_fix.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 161 edges
2. `Item` - 141 edges
3. `cn()` - 119 edges
4. `GameMap` - 107 edges
5. `Entity` - 87 edges
6. `engine` - 86 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 63 edges
9. `useInventory()` - 50 edges
10. `ItemDefs` - 49 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicle.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`

## Communities (169 total, 49 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.09
Nodes (26): ActionSlotButton(), ActionSlotButtonProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps, ItemContextMenu() (+18 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (38): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryPanel(), TollWindow() (+30 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.25
Nodes (8): getProgressionForMap(), isInsideCompound(), isInsideTollGate(), isInStartArea(), corridorZombieCap(), ZombieSpawner, populate(), populate()

### Community 6 - "Action Intent System"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.07
Nodes (16): log, getLightMode(), getSightRangeForHour(), engine, NOTE: Structural damage (hp reduction, break/open flags) was already, NOTE: do NOT force itemsModified for every container/attachment item., log, applyMapRegistries() (+8 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.18
Nodes (16): FloatingContainerOverlay(), FloatingContainerOverlayProps, WeaponModPanel(), WeaponModPanelProps, GameMapContext, GameMapProvider(), isTurretPassableBy(), isTerrainWalkable() (+8 more)

### Community 9 - "Entity Component System"
Cohesion: 0.32
Nodes (13): removeDestroyedTurret(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack(), processEntityKill() (+5 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.06
Nodes (44): DroneConfig, RcVehicleConfig, debugLog(), TurnManager, clearOrder(), estimateTurns(), getOrder(), getOrders() (+36 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.09
Nodes (8): TEMPLATE_METADATA, CorridorGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, PROFILE, { GameMap }, { TemplateMapGenerator }, verifyRandomBuildings(), generator

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.39
Nodes (7): isAllRoad(), isTooCloseToVehicles(), measureRoadSpans(), planRoadVehicles(), rectsOverlap(), VEHICLE_TYPES, runWithSeed()

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.16
Nodes (3): debugLog(), ImageLoader, TILESET_MISSING_TERRAINS

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.06
Nodes (71): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), drawImprovedCursor() (+63 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.16
Nodes (10): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), TurnProcessingUtils, makeTurret() (+2 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.05
Nodes (36): RabbitAI, DamageIntent, getZombieType(), doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), findAttackSlotPath() (+28 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 23 - "Door"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (11): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+3 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "Combat and Turn Management"
Cohesion: 0.23
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.13
Nodes (11): PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), aiComp, ent, npc, player (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.18
Nodes (9): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, MenuButtonDef, StartMenuButtonsProps, CharacterRegistry, DEFAULT_PLAYER_STATS (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+2 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (18): JournalUI(), compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker() (+10 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+35 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (18): DRONE_ITEM_DEF_IDS, isRemoteDevice(), FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+10 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.10
Nodes (18): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), ScenarioPickerWindow(), StartMenu() (+10 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.15
Nodes (9): InventoryExtensionWindowProps, PlayerSkillsWindowProps, GridSizeContext, GridSizeContextType, GridSizeProviderProps, GridSlotSizeConfig, useGridSlotSize(), useWindowSize() (+1 more)

### Community 50 - "Window and Door Interaction"
Cohesion: 0.35
Nodes (3): LineOfSight, test(), los()

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.30
Nodes (8): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS, isIndoorFloor()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.13
Nodes (19): consumeDeployCharge(), getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), deploy(), deployedPosition(), focusPointOf() (+11 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.20
Nodes (8): ActionContext, ActionProvider(), getBrainPulpOverrides(), getBrainstemOverrides(), AttributeProgressionManager, findEdgeStructure(), matchesType(), NEIGHBORS

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.20
Nodes (12): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+4 more)

### Community 62 - "TestEntity"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.15
Nodes (20): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, StartMenuButtons() (+12 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.06
Nodes (13): AIBehavior, InventoryContainer, Movable, Position, Renderable, Vision, EntityFactory, applyNpcAIMode() (+5 more)

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (10): Rabbit, SequencerAction, AnimalSpawner, map, mockTile, npc, player, rabbit (+2 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.09
Nodes (9): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results (+1 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.16
Nodes (12): MAP_GEN_CONFIG, FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), FURNITURE_FOOTPRINTS (+4 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 75 - "Map Serialization Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 77 - "Item Factory Methods"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.33
Nodes (6): btnStyle(), inputStyle, LootAmount, LootGeneratorModal(), LootGeneratorModalProps, LootGeneratorMode

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (19): scripts, ap-economy, balance, budget:update, build, build-electron, check, dev (+11 more)

### Community 83 - "DevConsole.tsx"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 84 - "RabbitAI"
Cohesion: 0.22
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), GamePage() (+1 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.19
Nodes (10): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), toSlimRoom() (+2 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.23
Nodes (8): ZombieTooltip(), ZombieTooltipProps, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, ZombieTypes

### Community 91 - "apEconomy.js"
Cohesion: 0.21
Nodes (9): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), logger, Quadrant, slope() (+1 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.12
Nodes (5): BranchingRoadGenerator, RoadNetwork, computeTollGateLayout(), TOLLGATE_DEFAULTS, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 98 - "TollGateSystem"
Cohesion: 0.28
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 103 - "RabbitAI"
Cohesion: 0.14
Nodes (16): AITargeting, FactionRegistry, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets() (+8 more)

### Community 104 - ".runTurn"
Cohesion: 0.04
Nodes (43): createItemFromDef(), SimulationManager, PlayerCombatSystem, applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), ENEMY_TYPES (+35 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 107 - "WeatherManager"
Cohesion: 0.19
Nodes (6): DevConsole(), buildFullItem(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (3): DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (20): ActionPoints, AIState, Burnable, Consumable, EquippedArmor, Health, Inventory, Item (+12 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (85): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, getAdjustedBgColor(), UniversalGrid() (+77 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.06
Nodes (41): LootProgression, NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists. (+33 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 119 - "Logger"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 121 - "JournalUI.tsx"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 124 - "MoveIntent"
Cohesion: 0.43
Nodes (5): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 126 - "ZombieTypes.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 129 - ".toJSON"
Cohesion: 0.40
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.07
Nodes (16): DestroyIntent, NoiseEvent, MapProgression, INIT_STATES, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem (+8 more)

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.07
Nodes (18): MoveIntent, EntityType, getNPCType(), PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity() (+10 more)

### Community 145 - ".generateFromScenario"
Cohesion: 0.20
Nodes (4): BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, ScenarioMapGenerator

### Community 147 - "MockGameMap"
Cohesion: 0.40
Nodes (3): generator, indoorMap, outdoorMap

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "bench_houses.mjs"
Cohesion: 0.14
Nodes (19): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+11 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **714 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+709 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `JournalUI.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `traits.js`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `Tooltip Components`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Game Initialization Manager`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Line of Sight System`, `Crafting Manager Logic`, `Menubar UI Components`, `Crafting Recipe Verification`, `Road Generation Logic`, `Toast Notification State`, `Item Factory Methods`, `context-menu.tsx`, `TurretCombat.js`, `MapConnectivityValidator.js`, `TollGateSystem`, `navigation-menu.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `react` connect `JournalUI.tsx` to `AI and Inventory Systems`, `Toast Notification State`, `External Dependencies`, `Turret AI Testing`, `Entity Spawning and Scent`, `RabbitAI`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _730 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0915915915915916 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05370843989769821 - nodes in this community are weakly interconnected._