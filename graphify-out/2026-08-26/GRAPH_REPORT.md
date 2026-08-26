# Graph Report - AndroidBuilder  (2026-08-26)

## Corpus Check
- 545 files · ~7,268,989 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3338 nodes · 9028 edges · 184 communities (132 shown, 52 thin omitted)
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
- TurretAI.js
- MoveIntent
- apEconomy.js
- ZombieTypes.js
- API Query Client
- .toJSON
- .recordHit
- ._restoreTilesAndEntities
- QuestState.js
- toggle-group.tsx
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- .setItemsOnTile
- log
- CorridorLootGenerator
- Drone
- .generateFromScenario
- Image Cropping Scripts
- MockGameMap
- eventMarkersIntegration.test.js
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- bench_houses.mjs
- Electron Preload Script
- alert.tsx
- SplitRoadGenerator
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- MapConnectivityValidator.js
- npcLoadout.test.js
- accordion.tsx
- avatar.tsx
- Row
- TestMapBuilder
- verify_army_tent.js
- tmp_verify_fix.js
- organizeByCategory.test.js
- verify_saveload.mjs

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 160 edges
2. `Item` - 140 edges
3. `cn()` - 119 edges
4. `GameMap` - 107 edges
5. `engine` - 86 edges
6. `Entity` - 86 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 63 edges
9. `useInventory()` - 50 edges
10. `ItemDefs` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `npc()` --references--> `EntityFactory`  [EXTRACTED]
  test/entities/entityFaction.test.js → client/src/game/EntityFactory.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/autoWagonSleep.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (184 total, 52 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.09
Nodes (29): ScreenScaler(), ScreenScalerProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot (+21 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.23
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (49): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps (+41 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.27
Nodes (9): EntityFactory, isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, corridorZombieCap(), ZombieSpawner (+1 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.11
Nodes (9): EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, PlaceIcon, SequencerAction, ENTITY_RESTORERS (+1 more)

### Community 9 - "Entity Component System"
Cohesion: 0.38
Nodes (14): CombatProvider(), removeDestroyedTurret(), applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack() (+6 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (33): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+25 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.10
Nodes (9): MAP_GEN_CONFIG, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, CorridorGenerator, RoadGenerator, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+1 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.19
Nodes (6): findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.08
Nodes (21): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, isAllRoad() (+13 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.16
Nodes (3): debugLog(), ImageLoader, TILESET_MISSING_TERRAINS

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.05
Nodes (53): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+45 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.16
Nodes (11): gridItems(), hasItemsInside(), hydratedGridItems(), TurretSystem, chargerContents(), makeTurret(), makeWagonCarrying(), nestedAmmo() (+3 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (31): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+23 more)

### Community 20 - "Game Map Management"
Cohesion: 0.05
Nodes (40): SeededRandom, applyEnergyApCap(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), applyKnob(), args (+32 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 23 - "Door"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 24 - "Turret Combat Logic"
Cohesion: 0.11
Nodes (3): TemplateMapGenerator, verifyRandomBuildings(), generator

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 28 - "Combat and Turn Management"
Cohesion: 0.14
Nodes (17): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), hasReceiver(), isLinkedDevice() (+9 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 33 - "Options and Crafting UI"
Cohesion: 0.09
Nodes (8): BaseMapGenerator, LAYOUT, deriveRoadBands(), MirroredWindingRoadGenerator, deriveRoadBands(), WindingRoadGenerator, DEFAULT_TERRAIN_PROPS, isFloor()

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.13
Nodes (13): AttributeCardProps, CompactSkillRowProps, SkillProgressBarProps, PlayerSkillsWindowProps, AttributeProgressionManager, applySurvivalCascade(), computeBrainstemStewTreatment(), recalcCharacter() (+5 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.13
Nodes (6): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), gameMap, generator, generator

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+36 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.07
Nodes (24): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+16 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.15
Nodes (13): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+5 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (8): inputContent, runInspector(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, json

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.33
Nodes (7): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.12
Nodes (27): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+19 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.18
Nodes (8): debugLog(), TurnManager, beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.27
Nodes (10): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack() (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 62 - "TestEntity"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.15
Nodes (19): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+11 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.18
Nodes (6): applyNpcAIMode(), log, applyItemGrants(), cureInfection(), infectPlayer(), runCycle()

### Community 66 - "Form UI Components"
Cohesion: 0.06
Nodes (16): AIState, PlayerSkills, Rabbit, aiComp, ent, npc, player, rabbit (+8 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.07
Nodes (30): hashLocation(), hashNavigate(), useHashLocation(), Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription (+22 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.08
Nodes (8): getProgressionForMap(), MapProgression, INIT_STATES, NOTE: do NOT force itemsModified for every container/attachment item., EventEmitter, SafeEventEmitter, logger, populate()

### Community 72 - "Toast UI Components"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 73 - "World Object Spawning"
Cohesion: 0.18
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.47
Nodes (5): downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 75 - "Map Serialization Tests"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 76 - "App Routing and Scaling"
Cohesion: 0.07
Nodes (9): BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, AudioManager, debugLog(), ConfigManager (+1 more)

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

### Community 84 - "RabbitAI"
Cohesion: 0.32
Nodes (3): OptionsWindow(), StartMenu(), IndexedDBStore

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.12
Nodes (23): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+15 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.18
Nodes (12): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors() (+4 more)

### Community 91 - "apEconomy.js"
Cohesion: 0.21
Nodes (9): getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, Quadrant, slope() (+1 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.28
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 94 - "DevConsole.tsx"
Cohesion: 0.27
Nodes (8): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), resolveMapEvents()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.32
Nodes (3): FactionRegistry, get(), npc()

### Community 98 - "TollGateSystem"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "ConfigManager"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 103 - "RabbitAI"
Cohesion: 0.33
Nodes (11): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+3 more)

### Community 104 - ".runTurn"
Cohesion: 0.06
Nodes (32): createItemFromDef(), deploy(), stow(), makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem() (+24 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 107 - "WeatherManager"
Cohesion: 0.18
Nodes (5): DevConsole(), CameraProvider(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 109 - "SeededRandom"
Cohesion: 0.11
Nodes (6): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, makeWagon(), MOTOR_PAIRS

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.04
Nodes (19): ActionPoints, AIBehavior, Consumable, DamageIntent, EquippedArmor, Health, Inventory, InventoryContainer (+11 more)

### Community 112 - ".isEdgeBlocked"
Cohesion: 0.41
Nodes (7): getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), tryFollowScent(), wander()

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (56): AttributeCard(), CompactSkillRow(), SkillProgressBar(), ZombieTooltip(), ZombieTooltipProps, WeaponModPanel(), WeaponModPanelProps, AlertDialogAction (+48 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.07
Nodes (35): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+27 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (4): getZombieType(), AISystem, spitAtPlayer(), ScentTrail

### Community 117 - "runContainerTests"
Cohesion: 0.27
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 118 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 119 - "Logger"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.33
Nodes (4): VisionSystem, buildMap(), los(), mapWithEdgeWindow()

### Community 125 - "apEconomy.js"
Cohesion: 0.57
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 126 - "ZombieTypes.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - ".toJSON"
Cohesion: 0.25
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.07
Nodes (49): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DefeatDialog(), DoorTooltip(), DoorTooltipProps, DroneTooltip() (+41 more)

### Community 133 - "QuestState.js"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 134 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.05
Nodes (32): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+24 more)

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.10
Nodes (4): Burnable, RpgStats, Item, TestEntity

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 148 - "eventMarkersIntegration.test.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 153 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 155 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 170 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 172 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 173 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 178 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **714 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+709 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `traits.js`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `toggle-group.tsx`, `Character and Menu Windows`, `Game Initialization Manager`, `alert.tsx`, `Sidebar UI Components`, `Container Grid Logic`, `Road and Town Generation`, `Crafting Manager Logic`, `accordion.tsx`, `avatar.tsx`, `Menubar UI Components`, `Crafting Recipe Verification`, `Road Generation Logic`, `Toast Notification State`, `Item Factory Methods`, `TollGateSystem`, `navigation-menu.tsx`, `toggle-group.tsx`, `context-menu.tsx`, `JournalUI.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `.runTurn` to `traits.js`, `.recordHit`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.processTurn`, `QuestState.js`, `Action Intent System`, `ExplosionSystem.js`, `Entity Component System`, `verify_road_template_p3_09.mjs`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `CorridorLootGenerator`, `Entity Spawning and Scent`, `Map Template Generation`, `MockGameMap`, `Turret Combat Logic`, `Combat and Turn Management`, `.hasCategory`, `Map Generation Config`, `Options and Crafting UI`, `Tile Rendering and Cache`, `Map Editor Tools`, `toast.tsx`, `npcLoadout.test.js`, `Asset Image Loader`, `organizeByCategory.test.js`, `Developer Console UI`, `TemplateMapGenerator.js`, `Ground Item Management`, `Form UI Components`, `Carousel UI Components`, `DevConsole.tsx`, `FurniturePlanner.js`, `TurretCombat.js`, `Lab Map Generation`, `DevConsole.tsx`, `Weapon Attachment Logic`, `Table UI Components`, `SeededRandom`, `verify_firefighter_spawn.js`, `toggle-group.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `toggle-group.tsx`, `Crafting Manager Logic`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _730 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._