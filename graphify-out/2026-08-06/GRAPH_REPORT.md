# Graph Report - AndroidBuilder  (2026-08-05)

## Corpus Check
- 510 files · ~6,544,800 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3192 nodes · 8501 edges · 179 communities (125 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
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
- Map Serialization Tests
- App Routing and Scaling
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
- Electron Main Process
- EarbucksShopSystem
- verify_firefighter_spawn.js
- tmp_verify_clip.js
- toggle-group.tsx
- EarbucksShopSystem.js
- RoadGenerator
- alert.tsx
- tmp_verify_zombie_loot.js
- apEconomy.js
- tmp_verify_zombie_loot.js
- MockGameMap
- OTP Input Components
- FactionRegistry
- ZombieTypes.js
- rcVehicleMovement.test.js
- API Query Client
- TurretAI.js
- .recordHit
- ._restoreTilesAndEntities
- migrateEvents.js
- npcLoadout.test.js
- Row
- eventMarkers.test.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- tmp_verify_fix.js
- Container.test.js
- verify_army_tent.mjs
- verify_map_gen.js
- MockGameMap
- Image Cropping Scripts
- WindowTooltip.tsx
- GameEventBus
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- react
- MinHeap
- Electron Preload Script
- FactionRegistry
- SplitRoadGenerator
- fillBottleDuplication.test.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TurretAI.js
- npcAttackOnSight.test.js
- index.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 142 edges
2. `Item` - 132 edges
3. `cn()` - 119 edges
4. `GameMap` - 98 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 77 edges
8. `gameRandom` - 54 edges
9. `useInventory()` - 50 edges
10. `useGame()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
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
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`

## Communities (179 total, 54 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.26
Nodes (12): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+4 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.08
Nodes (32): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), ShopItemRow(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp() (+24 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.11
Nodes (22): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI(), CampfireUIProps (+14 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.09
Nodes (19): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), isInsideCompound(), isInsideTollGate() (+11 more)

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.16
Nodes (15): consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), canOperate(), deploy(), deployedPosition(), getActiveGroundedDevice(), land() (+7 more)

### Community 9 - "Entity Component System"
Cohesion: 0.13
Nodes (20): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+12 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (45): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+37 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.24
Nodes (13): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+5 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.10
Nodes (17): JournalUI(), AudioContext, VisualEffectsContext, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, engine (+9 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.12
Nodes (20): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Command, CommandEmpty, CommandGroup (+12 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.20
Nodes (17): GameMapContext, GameMapProvider(), logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, isTurretPassableBy(), EntityType (+9 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.18
Nodes (17): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, NPCDemandDialog(), CraftingUI(), useAudio() (+9 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.09
Nodes (39): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+31 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.20
Nodes (11): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+3 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.11
Nodes (15): MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, INIT_STATES, compressString(), LAYOUT, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+7 more)

### Community 23 - "Door"
Cohesion: 0.07
Nodes (15): AIBehavior, Movable, Position, Vision, EntityFactory, AISystem, npc(), door (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 26 - "Action Queue Processing"
Cohesion: 0.21
Nodes (14): getAutonomousVehicle(), getRcVehicle(), isWagon(), listRcVehicles(), DRONE_ITEM_DEF_IDS, hasAutonomy(), hasReceiver(), isRemoteDevice() (+6 more)

### Community 27 - "useGame"
Cohesion: 0.26
Nodes (3): log, logger, Logger

### Community 28 - "Combat and Turn Management"
Cohesion: 0.14
Nodes (32): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), MapInterface(), MapTransitionDialog() (+24 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.14
Nodes (16): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, ThemeProvider() (+8 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 35 - "Dialog and Button UI"
Cohesion: 0.13
Nodes (15): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan() (+7 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.22
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 37 - "Road and Town Generation"
Cohesion: 0.20
Nodes (5): CharacterCreator(), PlayerSkillsUI(), CombatResolver, brokenScopeStats, fireManyAtLongRange()

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (52): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), EntityRegistry, GameEvent, LegacyDialogStep, QuestRegistry, downconvertEvents() (+44 more)

### Community 42 - "toast.tsx"
Cohesion: 0.11
Nodes (11): SeededRandom, args, config, secs, seeds, startSeed, t0, fuzzSeed() (+3 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.14
Nodes (12): SpeechBubbleInput(), AudioProvider(), CameraContext, CameraProvider(), GameProvider(), OverlayContext, OverlayContextType, OverlayProvider() (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.27
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (4): decompressString(), GameSaveSystem, json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.18
Nodes (5): LineOfSight, Quadrant, Row, slope(), test()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.14
Nodes (13): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+5 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 58 - "Audio Management System"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 62 - "TestEntity"
Cohesion: 0.43
Nodes (4): CraftingCategory, TabsContent, TabsList, TabsTrigger

### Community 64 - "Ground Item Management"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.08
Nodes (10): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+2 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.22
Nodes (9): FIRESTARTER_DEF_IDS, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta(), TILE_ICON_RANK (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.26
Nodes (4): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 72 - "Toast UI Components"
Cohesion: 0.14
Nodes (19): CombatContext, CombatProvider(), provokeAndWarn(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret() (+11 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.13
Nodes (6): hydratedGridItems(), SimulationManager, applyNpcAIMode(), TurretSystem, VisionSystem, runCycle()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 78 - "Item Movement Logic"
Cohesion: 0.11
Nodes (23): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+15 more)

### Community 79 - ".executeTransition"
Cohesion: 0.12
Nodes (10): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem (+2 more)

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
Cohesion: 0.27
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.10
Nodes (27): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+19 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 93 - "EntityRenderer.js"
Cohesion: 0.35
Nodes (9): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+1 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.36
Nodes (9): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost(), ease() (+1 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.11
Nodes (5): PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 102 - "WeatherManager"
Cohesion: 0.21
Nodes (5): DevConsole(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 103 - "RabbitAI"
Cohesion: 0.05
Nodes (36): BeltContainerPanel(), BeltContainerPanelProps, GridSlot, GridSlotProps, getAdjustedBgColor(), UniversalGrid(), UniversalGridProps, AccordionContent (+28 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 109 - "SeededRandom"
Cohesion: 0.06
Nodes (29): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), applyItemGrants(), equipBackpack(), makeItem() (+21 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (15): ActionPoints, Consumable, EquippedArmor, Health, Inventory, InventoryContainer, Item, LightEmitter (+7 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.04
Nodes (57): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+49 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.05
Nodes (46): LootProgression, NPCTypes, getBrainstemColor(), getBrainstemStewColors(), ZombieCorpseConfig, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem). (+38 more)

### Community 115 - "tmp_verify_clip.js"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 119 - "alert.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 121 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 126 - "ZombieTypes.js"
Cohesion: 0.14
Nodes (7): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input, Label, labelVariants

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 133 - "npcLoadout.test.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 134 - "Row"
Cohesion: 0.08
Nodes (14): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), NOTE: do NOT force itemsModified for every container/attachment item., SafeEventEmitter, chargerContents() (+6 more)

### Community 135 - "eventMarkers.test.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "tmp_verify_fix.js"
Cohesion: 0.40
Nodes (3): generator, indoorMap, outdoorMap

### Community 141 - "Container.test.js"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 142 - "verify_army_tent.mjs"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 143 - "verify_map_gen.js"
Cohesion: 0.40
Nodes (3): equipChargedPhone(), makeWagon(), MOTOR_PAIRS

### Community 144 - "MockGameMap"
Cohesion: 0.24
Nodes (8): ActionContext, ActionProvider(), getBrainPulpOverrides(), getBrainstemOverrides(), AttributeProgressionManager, findEdgeStructure(), matchesType(), NEIGHBORS

### Community 148 - "GameEventBus"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 152 - "react"
Cohesion: 0.29
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), Toaster(), useToast(), react

### Community 153 - "MinHeap"
Cohesion: 0.67
Nodes (3): buildMap(), los(), mapWithEdgeWindow()

### Community 171 - "npcAttackOnSight.test.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **699 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+694 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `Item Interaction Logic`, `._restoreTilesAndEntities`, `.recordHit`, `NPC AI Behavior`, `Row`, `Tooltip Components`, `tmp_verify_fix.js`, `Entity and Item Types`, `Container.test.js`, `verify_map_gen.js`, `MockGameMap`, `verify_split_road.js`, `Map Template Generation`, `Game Initialization Manager`, `Action Queue Processing`, `Combat and Turn Management`, `EventRunner`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Road Generation Logic`, `Toast UI Components`, `.executeTransition`, `context-menu.tsx`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `RabbitAI`, `.runTurn`, `verify_firefighter_spawn.js`, `RoadGenerator`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `Game Engine Context`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `npcLoadout.test.js`, `Rabbit AI State`, `HUD and Dialog UI`, `Map Template Generation`, `Character and Menu Windows`, `Combat and Turn Management`, `Sidebar UI Components`, `Container Grid Logic`, `Asset Image Loader`, `Rendering Optimization Tests`, `pagination.tsx`, `Menubar UI Components`, `Audio Management System`, `TestEntity`, `RabbitAI`, `navigation-menu.tsx`, `Electron Main Process`, `tmp_verify_clip.js`, `tmp_verify_zombie_loot.js`, `ZombieTypes.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _716 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._