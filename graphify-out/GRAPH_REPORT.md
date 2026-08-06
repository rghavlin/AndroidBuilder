# Graph Report - AndroidBuilder  (2026-08-06)

## Corpus Check
- 511 files · ~6,545,900 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3195 nodes · 8516 edges · 156 communities (112 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b57898f`
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
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- RoadGenerator
- alert.tsx
- tmp_verify_zombie_loot.js
- apEconomy.js
- MockGameMap
- OTP Input Components
- FactionRegistry
- ZombieTypes.js
- API Query Client
- .recordHit
- ._restoreTilesAndEntities
- npcLoadout.test.js
- Row
- eventMarkers.test.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- tmp_verify_fix.js
- Container.test.js
- verify_army_tent.mjs
- Image Cropping Scripts
- GameEventBus
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- SplitRoadGenerator
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TurretAI.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 144 edges
2. `Item` - 133 edges
3. `cn()` - 119 edges
4. `GameMap` - 98 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 78 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/autoWagonSleep.test.js → client/src/game/inventory/ItemDefs.js
- `makeAutoWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/deviceFocusPoint.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (156 total, 44 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.26
Nodes (12): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+4 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.13
Nodes (21): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow() (+13 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.10
Nodes (37): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, InventoryExtensionWindowProps, InventoryPanel() (+29 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.14
Nodes (12): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS (+4 more)

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (9): PlayerSkills, INIT_STATES, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.11
Nodes (6): Door, PlaceIcon, ENTITY_RESTORERS, restoreEntity(), buildMap(), mapWithEdgeWindow()

### Community 8 - "Tooltip Components"
Cohesion: 0.16
Nodes (14): consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), canOperate(), deploy(), deployedPosition(), land(), launch() (+6 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (41): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+33 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.24
Nodes (13): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (39): BeltContainerPanel(), BeltContainerPanelProps, FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot, GridSlotProps, ItemContextMenu(), ItemContextMenuProps (+31 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.09
Nodes (22): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+14 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.10
Nodes (35): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+27 more)

### Community 20 - "Game Map Management"
Cohesion: 0.11
Nodes (24): applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals(), livingZombies() (+16 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.27
Nodes (10): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+2 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.17
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), map (+1 more)

### Community 23 - "Door"
Cohesion: 0.08
Nodes (15): DevConsole(), EntityFactory, IntentQueue, AISystem, logger, ZombieReplenishmentSystem, npc(), door (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (22): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, isInsideCompound(), isInsideTollGate() (+14 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (12): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.16
Nodes (12): getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), asItemInstance(), makeAutoWagon(), equipChargedPhone(), makeWagon() (+4 more)

### Community 27 - "useGame"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 28 - "Combat and Turn Management"
Cohesion: 0.10
Nodes (30): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+22 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.14
Nodes (3): ScentTrail, emptyTiles(), loadScenario()

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (43): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+35 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.38
Nodes (8): DRONE_ITEM_DEF_IDS, getLinkedDeviceUnderfoot(), isLinkedDevice(), isRemoteDevice(), make(), makeAutoWagon(), makePoweredTurret(), makeRcWagon()

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (8): inputContent, runInspector(), compressString(), decompressString(), GameSaveSystem, runDebug(), json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.12
Nodes (13): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), LineOfSight, logger, Quadrant (+5 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.28
Nodes (6): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.14
Nodes (12): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+4 more)

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
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 62 - "TestEntity"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (10): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+2 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.07
Nodes (32): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+24 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.26
Nodes (4): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 72 - "Toast UI Components"
Cohesion: 0.11
Nodes (24): CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret() (+16 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.24
Nodes (3): SimulationManager, VisionSystem, runCycle()

### Community 74 - "Map Tile Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 76 - "App Routing and Scaling"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.13
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

### Community 85 - "context-menu.tsx"
Cohesion: 0.26
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 93 - "EntityRenderer.js"
Cohesion: 0.19
Nodes (14): SleepProvider(), AttributeProgressionManager, applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats() (+6 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.36
Nodes (9): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost(), ease() (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.08
Nodes (10): AIState, Burnable, RpgStats, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, Item (+2 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.19
Nodes (4): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, computeBrainstemStewTreatment()

### Community 103 - "RabbitAI"
Cohesion: 0.04
Nodes (34): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Checkbox, HoverCardContent (+26 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (5): FactionRegistry, DERIVED_CONDITIONS, Entity, get(), set()

### Community 109 - "SeededRandom"
Cohesion: 0.09
Nodes (20): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), equipBackpack(), makeItem() (+12 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.06
Nodes (39): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+31 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.07
Nodes (33): NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists. (+25 more)

### Community 119 - "alert.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 121 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 126 - "ZombieTypes.js"
Cohesion: 0.08
Nodes (16): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+8 more)

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.07
Nodes (25): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+17 more)

### Community 133 - "npcLoadout.test.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 134 - "Row"
Cohesion: 0.18
Nodes (10): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), TurnProcessingUtils, makeTurret() (+2 more)

### Community 135 - "eventMarkers.test.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "tmp_verify_fix.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 141 - "Container.test.js"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 142 - "verify_army_tent.mjs"
Cohesion: 0.05
Nodes (14): Health, MeleeWeapon, Position, Renderable, NOTE: do NOT force itemsModified for every container/attachment item., SafeEventEmitter, canSeeBlocked, canSeeWindow (+6 more)

### Community 148 - "GameEventBus"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 169 - "TurretAI.js"
Cohesion: 0.29
Nodes (5): AITargeting, TurretAI, removeDestroyedTurret(), hydratedGridItems(), TurretSystem

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **699 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+694 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `Item Interaction Logic`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `NPC AI Behavior`, `Row`, `Tooltip Components`, `Entity Component System`, `tmp_verify_fix.js`, `Entity and Item Types`, `verify_army_tent.mjs`, `Container.test.js`, `Entity Spawning and Scent`, `Game Initialization Manager`, `Door`, `Turret Combat Logic`, `Inventory Management System`, `Action Queue Processing`, `Combat and Turn Management`, `EventRunner`, `Container Grid Logic`, `Line of Sight System`, `Map Editor Tools`, `Asset Image Loader`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Road Generation Logic`, `Toast UI Components`, `Map Serialization Tests`, `Item Factory Methods`, `.executeTransition`, `context-menu.tsx`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `MapConnectivityValidator.js`, `Building Hallway Tests`, `Table UI Components`, `.runTurn`, `verify_firefighter_spawn.js`, `RoadGenerator`, `FactionRegistry`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `._restoreTilesAndEntities`, `Game Engine Context`, `AI and Inventory Systems`, `npcLoadout.test.js`, `Rabbit AI State`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Combat and Turn Management`, `Sidebar UI Components`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `Audio Management System`, `MapBuilder.js`, `TestEntity`, `Toast Notification State`, `RabbitAI`, `navigation-menu.tsx`, `ZombieTypes.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Audio Management System`, `RabbitAI`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _716 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._