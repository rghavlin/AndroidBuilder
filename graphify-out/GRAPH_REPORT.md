# Graph Report - AndroidBuilder  (2026-08-06)

## Corpus Check
- 516 files · ~6,551,560 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3230 nodes · 8646 edges · 180 communities (126 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5badfc35`
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
- Logger
- EarbucksShopSystem
- verify_firefighter_spawn.js
- tweenAlongPath
- toggle-group.tsx
- sheet.tsx
- verify_loot.js
- alert.tsx
- tmp_verify_zombie_loot.js
- EarbucksShopSystem
- apEconomy.js
- MockGameMap
- verify_phase_2.mjs
- .getPocketContainers
- ZombieTypes.js
- runContainerTests
- API Query Client
- rcPathingBudget.test.js
- .recordHit
- ._restoreTilesAndEntities
- command.tsx
- npcLoadout.test.js
- context-menu.tsx
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- IntentQueue
- verify_army_tent.mjs
- drawer.tsx
- scratch_los_test.js
- tmp_verify_zombie_loot.js
- Image Cropping Scripts
- verify_phase_3.mjs
- GameEventBus
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- MapConnectivityValidator.js
- Electron Preload Script
- SplitRoadGenerator
- Drone.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- verify_loot_constraints.js
- DroneVision.js
- npcLoadout.test.js
- AIBehavior
- ExplosionIntent
- Inventory
- Item
- TestMapBuilder
- Movable
- AudioSystem

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 152 edges
2. `Item` - 136 edges
3. `cn()` - 119 edges
4. `GameMap` - 98 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 80 edges
8. `gameRandom` - 55 edges
9. `useInventory()` - 50 edges
10. `GameHarness` - 47 edges

## Surprising Connections (you probably didn't know these)
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcPathingBudget.test.js → client/src/game/inventory/ItemDefs.js
- `makeWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/rcVehicleMovement.test.js → client/src/game/inventory/ItemDefs.js
- `makeTurret()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/systems/nestedTurretFiring.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 3-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/ai/TurretCombat.js`
- 3-file cycle: `client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 4-file cycle: `client/src/game/ai/TurretCombat.js -> client/src/game/inventory/gridUtils.js -> client/src/game/inventory/Item.js -> client/src/game/utils/TurnProcessingUtils.js -> client/src/game/ai/TurretCombat.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (180 total, 54 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.12
Nodes (28): DroneConfig, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight(), consumeDeployCharge() (+20 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (45): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps (+37 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.07
Nodes (38): BarterWindow(), BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, ScreenScaler(), ScreenScalerProps, TollWindow() (+30 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.18
Nodes (7): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 6 - "Action Intent System"
Cohesion: 0.13
Nodes (15): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), brokenScopeStats (+7 more)

### Community 7 - "Shop and Log UI"
Cohesion: 0.13
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 8 - "Tooltip Components"
Cohesion: 0.06
Nodes (20): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Avatar (+12 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.20
Nodes (18): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+10 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (8): TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.09
Nodes (23): DownconvertedEvents, emptyEvent(), EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+15 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.09
Nodes (48): EarbucksShopWindow(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), MapInterface() (+40 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.14
Nodes (25): ActionContext, ActionProvider(), CombatProvider(), dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemOverrides(), getCorpseOverrides(), ZombieCorpseConfig (+17 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 19 - "Character and Menu Windows"
Cohesion: 0.18
Nodes (15): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, MainMenuWindowProps (+7 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.19
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 23 - "Door"
Cohesion: 0.10
Nodes (9): DevConsole(), Health, Position, Renderable, EntityFactory, NOTE: do NOT force itemsModified for every container/attachment item., SafeEventEmitter, npc() (+1 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.11
Nodes (18): LootProgression, MapProgression, INIT_STATES, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT (+10 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 27 - "useGame"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.06
Nodes (38): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+30 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 33 - "Options and Crafting UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 34 - "Camera Viewport Control"
Cohesion: 0.09
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.22
Nodes (10): FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan(), rotateFloorplanCW(), validateFloorplan(), makeLayoutGrid(), buildPlanGrid() (+2 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (41): emptyEntityRegistry(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem(), BUILDING_TYPES (+33 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.12
Nodes (18): isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getPoweredTurretForEntity(), getTileIconRank(), getTileItemsCached() (+10 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.22
Nodes (5): inputContent, runInspector(), compressString(), decompressString(), json

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (6): LineOfSight, Quadrant, Row, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.28
Nodes (4): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.09
Nodes (30): AITargeting, FactionRegistry, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets() (+22 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.13
Nodes (18): DisplaySlot, formatTimestamp(), LoadGameWindow(), LoadGameWindowProps, SaveSlot, getLogColor(), LogHistoryWindow(), LogHistoryWindowProps (+10 more)

### Community 58 - "Audio Management System"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 62 - "TestEntity"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.24
Nodes (3): debugLog(), TurnManager, CombatSystem

### Community 64 - "Ground Item Management"
Cohesion: 0.19
Nodes (3): MinHeap, Pathfinding, testWindowCost()

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (4): AIState, Burnable, Rabbit, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.19
Nodes (11): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, CharacterRegistry (+3 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 76 - "App Routing and Scaling"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 77 - "Item Factory Methods"
Cohesion: 0.16
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ErrorBoundary, GamePage(), NotFound()

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.18
Nodes (6): DestroyIntent, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem, computeHearingZone(), markHeardIfInRange()

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
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.11
Nodes (24): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+16 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 93 - "EntityRenderer.js"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.50
Nodes (7): driveBlockedReason(), getActiveRcVehicle(), driveActiveVehicle(), pathForDevice(), previewDriveCost(), finishDrive(), materializeGhost()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.13
Nodes (6): NPCTypes, PlaceIcon, ENTITY_RESTORERS, restoreEntity(), buildMap(), mapWithEdgeWindow()

### Community 98 - "TollGateSystem"
Cohesion: 0.27
Nodes (12): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), Button, DialogContent, DialogDescription (+4 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.16
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.15
Nodes (7): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, computeBrainstemStewTreatment(), hammerRecipe, hatchetRecipe

### Community 102 - "WeatherManager"
Cohesion: 0.16
Nodes (4): exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 103 - "RabbitAI"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 109 - "SeededRandom"
Cohesion: 0.05
Nodes (40): createItemFromDef(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), UNARMED_WEAPON, equipBackpack(), makeItem() (+32 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.06
Nodes (17): ActionPoints, Consumable, EquippedArmor, InventoryContainer, LightEmitter, MeleeWeapon, PlayerWallet, COMPONENT_CLASSES (+9 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.09
Nodes (29): AttributeCard(), CompactSkillRow(), SkillProgressBar(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+21 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.07
Nodes (28): ItemTooltipProps, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., PocketLayouts (+20 more)

### Community 115 - "tweenAlongPath"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 117 - "sheet.tsx"
Cohesion: 0.24
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 118 - "verify_loot.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 119 - "alert.tsx"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.30
Nodes (11): GameMapProvider(), isTurretPassableBy(), DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight() (+3 more)

### Community 122 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 123 - "MockGameMap"
Cohesion: 0.20
Nodes (4): MoveIntent, findAttackSlotPath(), isMeleeAttackPosition(), runCycle()

### Community 124 - "verify_phase_2.mjs"
Cohesion: 0.17
Nodes (8): PlayerSkills, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 126 - "ZombieTypes.js"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 127 - "runContainerTests"
Cohesion: 0.18
Nodes (4): runContainerTests(), runTest(), KNOWN_FAILURES, results

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 129 - "rcPathingBudget.test.js"
Cohesion: 0.27
Nodes (6): sliceLegByAp(), relocateWagon(), WagonSystem, countTurnsBySlicing(), makeWagon(), MOTOR_PAIRS

### Community 130 - ".recordHit"
Cohesion: 0.06
Nodes (18): GameMap, log, basicResult, map, mutantResult, player, windowEntity, zombieBasic (+10 more)

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 132 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 133 - "npcLoadout.test.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 134 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.42
Nodes (3): NoiseEvent, DestructionSystem, ExplosionSystem

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 142 - "verify_army_tent.mjs"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 143 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 144 - "scratch_los_test.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 145 - "tmp_verify_zombie_loot.js"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 147 - "verify_phase_3.mjs"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 148 - "GameEventBus"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 153 - "MapConnectivityValidator.js"
Cohesion: 0.47
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 169 - "verify_loot_constraints.js"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 170 - "DroneVision.js"
Cohesion: 0.80
Nodes (4): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **702 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+697 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `Audio Management System`, `Road Generation Logic`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `rcPathingBudget.test.js`, `Item Interaction Logic`, `Game Engine Context`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `Action Intent System`, `ExplosionSystem.js`, `NPC AI Behavior`, `Entity and Item Types`, `IntentQueue`, `HUD and Dialog UI`, `Entity Spawning and Scent`, `Door`, `.addItem`, `Turret Combat Logic`, `EventRunner`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `npcLoadout.test.js`, `Asset Image Loader`, `Developer Console UI`, `pagination.tsx`, `TemplateMapGenerator.js`, `Form UI Components`, `Map Serialization Tests`, `FurniturePlanner.js`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `.runTurn`, `verify_firefighter_spawn.js`, `verify_loot.js`, `EarbucksShopSystem`, `.getPocketContainers`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `react` connect `Audio Management System` to `Toast Notification State`, `External Dependencies`, `App Routing and Scaling`, `Item Factory Methods`, `HUD and Dialog UI`, `Combat and Turn Management`, `Sidebar UI Components`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _719 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._