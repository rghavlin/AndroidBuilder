# Graph Report - AndroidBuilder  (2026-08-25)

## Corpus Check
- 526 files · ~6,560,058 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3269 nodes · 8816 edges · 168 communities (114 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a971bd8`
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
- RabbitAI
- .runTurn
- LineOfSight.js
- navigation-menu.tsx
- WeatherManager
- Seeded Random Utilities
- SeededRandom
- React Error Boundaries
- npcAttackOnSight.test.js
- Logger
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- sheet.tsx
- verify_loot.js
- alert.tsx
- tmp_verify_zombie_loot.js
- RabbitAI
- apEconomy.js
- MapMetadata.js
- MapConnectivityValidator.js
- ZombieTypes.js
- runContainerTests
- API Query Client
- npcLoadout.test.js
- .recordHit
- ._restoreTilesAndEntities
- IntentQueue
- Inventory
- InventoryContainer
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- LightEmitter
- Renderable
- Vision
- eventMarkers.test.js
- index.js
- Image Cropping Scripts
- MockGameMap
- verify_saveload.mjs
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- SplitRoadGenerator
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 155 edges
2. `Item` - 138 edges
3. `cn()` - 119 edges
4. `GameMap` - 102 edges
5. `engine` - 86 edges
6. `Entity` - 86 edges
7. `InventoryManager` - 84 edges
8. `gameRandom` - 56 edges
9. `useInventory()` - 50 edges
10. `GameHarness` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (168 total, 54 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (13): consumeDeployCharge(), droneChargesRemaining(), canOperate(), deploy(), deployedPosition(), focusPointOf(), launch(), listControllables() (+5 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (41): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid() (+33 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.10
Nodes (17): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, INIT_STATES, findSouthTransitionTile(), isInsideCompound() (+9 more)

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (5): applyMapRegistries(), QuestState, hasScenario, loadScenario(), SCENARIO

### Community 7 - "Shop and Log UI"
Cohesion: 0.08
Nodes (16): SpeechBubbleContext, SpeechBubbleProvider(), getLightMode(), getSightRangeForHour(), EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, log (+8 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 9 - "Entity Component System"
Cohesion: 0.20
Nodes (11): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+3 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.17
Nodes (18): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+10 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (19): MAP_GEN_CONFIG, EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS (+11 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (23): DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, EventStep, FactionDef, FlagDef, GameEvent (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.18
Nodes (13): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+5 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.13
Nodes (6): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, debugLog(), ImageLoader, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.06
Nodes (64): EarbucksShopWindow(), GameScreenContent(), InfectionHUD(), StartModeDialog(), StartModeDialogProps, CampfireUI(), CampfireUIProps, CraftingUI() (+56 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.06
Nodes (48): CharacterCreator(), PlayerSkillsUI(), CombatProvider(), AITargeting, BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances() (+40 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.08
Nodes (42): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps (+34 more)

### Community 20 - "Game Map Management"
Cohesion: 0.05
Nodes (40): SeededRandom, applyEnergyApCap(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), applyKnob(), args (+32 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.18
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+4 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.28
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 23 - "Door"
Cohesion: 0.08
Nodes (15): DevConsole(), AIBehavior, Movable, Position, EntityFactory, AISystem, npc(), door (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.15
Nodes (5): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only, equipRifle()

### Community 26 - "Action Queue Processing"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 27 - "useGame"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.17
Nodes (11): gridItems(), applyExpiration(), applyPower(), processInventoryTurn(), processItem(), NOTE: do NOT force itemsModified for every container/attachment item., chargerContents(), TurnProcessingUtils (+3 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.17
Nodes (6): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results, verifyLoadSwaps()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.09
Nodes (8): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), WeatherManager, gameMap, generator, generator

### Community 40 - "Line of Sight System"
Cohesion: 0.13
Nodes (4): EventRunner, resolveMapEvents(), cureInfection(), infectPlayer()

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem(), BUILDING_TYPES (+34 more)

### Community 42 - "toast.tsx"
Cohesion: 0.23
Nodes (4): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition()

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (17): FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached(), resolveItemMeta() (+9 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.16
Nodes (8): CharacterRegistryWindow(), CharacterRegistry, compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, json

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 50 - "Window and Door Interaction"
Cohesion: 0.09
Nodes (14): LineOfSight, logger, Quadrant, Row, slope(), hasCorner, map, MockGameMap (+6 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.14
Nodes (9): LootProgression, MapProgression, AnimalSpawner, gameRandom, makeSeededRandom(), map, brokenScopeStats, templates (+1 more)

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.19
Nodes (15): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeFlightCharge() (+7 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 58 - "Audio Management System"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.06
Nodes (28): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, FormControl, FormDescription, FormFieldContext, FormFieldContextValue (+20 more)

### Community 62 - "TestEntity"
Cohesion: 0.29
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.10
Nodes (26): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), formatTimestamp(), LoadGameWindow(), getLogColor(), LogHistoryWindow() (+18 more)

### Community 66 - "Form UI Components"
Cohesion: 0.08
Nodes (10): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+2 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.06
Nodes (18): Container, isGroundPriority(), isPinnedInPlace(), engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, PocketLayouts, CategoryDisplayName (+10 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.20
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.47
Nodes (5): downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 75 - "Map Serialization Tests"
Cohesion: 0.24
Nodes (13): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), getRcVehicle(), isWagon(), listRcVehicles(), DRONE_ITEM_DEF_IDS (+5 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.10
Nodes (4): AudioManager, debugLog(), ConfigManager, MusicManager

### Community 77 - "Item Factory Methods"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

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
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 84 - "RabbitAI"
Cohesion: 0.32
Nodes (3): OptionsWindow(), StartMenu(), IndexedDBStore

### Community 85 - "context-menu.tsx"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.13
Nodes (22): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+14 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 92 - ".generateFromScenario"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 93 - "EntityRenderer.js"
Cohesion: 0.42
Nodes (3): NoiseEvent, DestructionSystem, ExplosionSystem

### Community 94 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (8): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, EXPECTED

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 98 - "TollGateSystem"
Cohesion: 0.09
Nodes (26): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialog(), NPCDemandDialogProps, SleepOverlay(), TradeDialog(), TradeDialogProps, TutorialEndDialog() (+18 more)

### Community 104 - ".runTurn"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): DERIVED_CONDITIONS, Entity, get(), set()

### Community 109 - "SeededRandom"
Cohesion: 0.06
Nodes (35): createItemFromDef(), SimulationManager, applyItemGrants(), UNARMED_WEAPON, equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem() (+27 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.07
Nodes (15): ActionPoints, Consumable, EquippedArmor, Health, Item, MeleeWeapon, PlayerWallet, COMPONENT_CLASSES (+7 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (77): GameControlsProps, STAT_COLORS, StatBar, StatBarProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps (+69 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.06
Nodes (32): CraftingRecipes, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., ItemCategory, Rarity, RarityWeights, FOOD_SCARCITY (+24 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.12
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 118 - "verify_loot.js"
Cohesion: 0.16
Nodes (6): log, log, NOTE: This only moves the camera view, not any entities, logger, ZombieReplenishmentSystem, Logger

### Community 119 - "alert.tsx"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 122 - "apEconomy.js"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 124 - "MapMetadata.js"
Cohesion: 0.40
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 125 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 126 - "ZombieTypes.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - ".recordHit"
Cohesion: 0.10
Nodes (3): GameMap, log, isIndoorFloor()

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.05
Nodes (52): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+44 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.24
Nodes (4): DestroyIntent, FireSystem, MovementSystem, markHeardIfInRange()

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.09
Nodes (6): RpgStats, PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **705 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+700 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `npcLoadout.test.js`, `Item Interaction Logic`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `NPC AI Behavior`, `Game Engine Context`, `Action Intent System`, `Entity Component System`, `Shop and Log UI`, `Inventory and Skill Windows`, `Entity and Item Types`, `Entity Spawning and Scent`, `Map Template Generation`, `Game Initialization Manager`, `Turret Combat Logic`, `Map Generation Config`, `EventRunner`, `Road and Town Generation`, `Tile Rendering and Cache`, `Map Editor Tools`, `Asset Image Loader`, `Rendering Optimization Tests`, `Developer Console UI`, `pagination.tsx`, `TemplateMapGenerator.js`, `Toast UI Components`, `FurniturePlanner.js`, `EntityRenderer.js`, `Weapon Attachment Logic`, `Table UI Components`, `WeatherManager`, `.runTurn`, `Logger`, `verify_firefighter_spawn.js`, `toggle-group.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `cn()` connect `EarbucksShopSystem` to `._restoreTilesAndEntities`, `AI and Inventory Systems`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Character and Menu Windows`, `Sidebar UI Components`, `Container Grid Logic`, `Crafting Manager Logic`, `Menubar UI Components`, `TemplateMapGenerator.js`, `Crafting Recipe Verification`, `Road Generation Logic`, `Item Factory Methods`, `.executeTransition`, `DevConsole.tsx`, `context-menu.tsx`, `.generateFromScenario`, `TollGateSystem`, `navigation-menu.tsx`, `toggle-group.tsx`, `tmp_verify_zombie_loot.js`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `DevConsole.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _721 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05432595573440644 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.09475806451612903 - nodes in this community are weakly interconnected._