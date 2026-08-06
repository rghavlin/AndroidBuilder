# Graph Report - AndroidBuilder  (2026-08-05)

## Corpus Check
- 509 files · ~6,543,382 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3188 nodes · 8477 edges · 174 communities (125 shown, 49 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3d1de36`
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
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TurretAI.js
- npcAttackOnSight.test.js
- TestMapBuilder

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 139 edges
2. `Item` - 130 edges
3. `cn()` - 119 edges
4. `GameMap` - 97 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 84 edges
7. `engine` - 76 edges
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
- `addWagon()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/remote/droneVision.test.js → client/src/game/inventory/ItemDefs.js

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`
- 4-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/AttributeProgressionManager.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/entities/Entity.js -> client/src/game/systems/CombatResolver.js -> client/src/game/GameEngine.js`
- 5-file cycle: `client/src/game/GameEngine.js -> client/src/game/remote/AutoWagonOrders.js -> client/src/game/remote/RcPathing.js -> client/src/game/utils/Pathfinding.js -> client/src/game/entities/Entity.js -> client/src/game/GameEngine.js`

## Communities (174 total, 49 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.12
Nodes (19): DroneConfig, Drone, droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+11 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.04
Nodes (71): EarbucksDisplay(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, GameEventLog(), GameEventLogProps, getLogColor(), JournalUI() (+63 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (45): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), NPCDemandDialog(), OverlayManager(), PlayerSkillsWindowProps (+37 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.15
Nodes (8): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 6 - "Action Intent System"
Cohesion: 0.12
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.14
Nodes (17): consumeDeployCharge(), getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), deploy(), deployedPosition(), launch() (+9 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.07
Nodes (46): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+38 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.09
Nodes (4): ScenarioMapGenerator, TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (49): StartModeDialog(), StartModeDialogProps, ActionContext, AudioContext, AudioProvider(), CameraContext, CameraProvider(), CombatContext (+41 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.28
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (10): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+2 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.46
Nodes (6): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+17 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.18
Nodes (10): ZombieTooltip(), ZombieTooltipProps, getZombieType(), ZombieTypes, AISystem, investigate(), spitAtPlayer(), tryFollowScent() (+2 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.26
Nodes (3): gameRandom, makeSeededRandom(), brokenScopeStats

### Community 23 - "Door"
Cohesion: 0.07
Nodes (9): ActionPoints, Health, Inventory, InventoryContainer, PlayerWallet, Position, EntityFactory, npc() (+1 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (22): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+14 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.20
Nodes (6): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 28 - "Combat and Turn Management"
Cohesion: 0.09
Nodes (35): GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD(), drawImprovedCursor() (+27 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 31 - "EventRunner"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.12
Nodes (10): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), ErrorBoundary (+2 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.11
Nodes (4): Container, isGroundPriority(), isPinnedInPlace(), make()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.10
Nodes (10): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, generator, layout, mapData (+2 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.26
Nodes (7): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 37 - "Road and Town Generation"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

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
Cohesion: 0.18
Nodes (3): hasItemsInside(), isClothingOrBackpack(), verifyLoadSwaps()

### Community 45 - "Asset Image Loader"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (11): inputContent, runInspector(), OptionsWindow(), StartMenu(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem (+3 more)

### Community 47 - "Game Engine State"
Cohesion: 0.15
Nodes (5): Quadrant, Row, slope(), test(), los()

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
Cohesion: 0.09
Nodes (23): DownconvertedEvents, emptyEvent(), EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+15 more)

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
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.23
Nodes (6): getMeleeReach(), getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), Pathfinding, testWindowCost()

### Community 65 - "Scenario Map Generation"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 66 - "Form UI Components"
Cohesion: 0.08
Nodes (10): Burnable, Rabbit, SequencerAction, map, mockTile, npc, player, rabbit (+2 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.20
Nodes (17): CombatProvider(), provokeAndWarn(), resolveTileTarget(), escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets() (+9 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.13
Nodes (7): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), gameMap, generator, generator

### Community 76 - "App Routing and Scaling"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.15
Nodes (9): DestroyIntent, NoiseEvent, CombatSystem, DestructionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem, computeHearingZone() (+1 more)

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
Cohesion: 0.24
Nodes (5): runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.27
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 85 - "context-menu.tsx"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.08
Nodes (31): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+23 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 89 - "Lab Map Generation"
Cohesion: 0.18
Nodes (3): GroundManager, DEF_IDS, makeItems()

### Community 93 - "EntityRenderer.js"
Cohesion: 0.35
Nodes (9): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+1 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.30
Nodes (6): isInsideCompound(), isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem, ZombieSpawner

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.09
Nodes (6): RpgStats, PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.15
Nodes (7): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, computeBrainstemStewTreatment(), hammerRecipe, hatchetRecipe

### Community 102 - "WeatherManager"
Cohesion: 0.11
Nodes (6): DevConsole(), WeatherManager, exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 103 - "RabbitAI"
Cohesion: 0.10
Nodes (31): ActionSlotButton(), ActionSlotButtonProps, DefeatDialog(), FloatingContainerOverlay(), FloatingContainerOverlayProps, GridSlot, GridSlotProps, ItemContextMenu() (+23 more)

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 105 - "LineOfSight.js"
Cohesion: 0.07
Nodes (9): log, NOTE: This only moves the camera view, not any entities, GameInitializationManager, INIT_STATES, EventEmitter, runDebug(), MockMap, mockPlayer (+1 more)

### Community 106 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 109 - "SeededRandom"
Cohesion: 0.07
Nodes (34): createItemFromDef(), applyItemGrants(), UNARMED_WEAPON, equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem(), deployDrone() (+26 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (13): AIBehavior, Consumable, DamageIntent, EquippedArmor, Item, LightEmitter, MeleeWeapon, Movable (+5 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.16
Nodes (12): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+4 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.09
Nodes (24): ItemTooltipProps, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, getItemName(), ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., PocketLayouts (+16 more)

### Community 115 - "tmp_verify_clip.js"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 116 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 117 - "EarbucksShopSystem.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

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

### Community 123 - "MockGameMap"
Cohesion: 0.21
Nodes (5): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 126 - "ZombieTypes.js"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 127 - "rcVehicleMovement.test.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "._restoreTilesAndEntities"
Cohesion: 0.08
Nodes (27): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+19 more)

### Community 132 - "migrateEvents.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 134 - "Row"
Cohesion: 0.31
Nodes (6): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), chargerContents(), TurnProcessingUtils

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "tmp_verify_fix.js"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 141 - "Container.test.js"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 142 - "verify_army_tent.mjs"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 143 - "verify_map_gen.js"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 144 - "MockGameMap"
Cohesion: 0.20
Nodes (7): ActionProvider(), dropZombieDeathLoot(), getBrainPulpOverrides(), getBrainstemOverrides(), getCorpseOverrides(), ZombieCorpseConfig, AttributeProgressionManager

### Community 147 - "WindowTooltip.tsx"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 148 - "GameEventBus"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "react"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **699 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+694 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createItemFromDef()` connect `SeededRandom` to `traits.js`, `TurretAI.js`, `Item Interaction Logic`, `._restoreTilesAndEntities`, `AI and Inventory Systems`, `.recordHit`, `NPC AI Behavior`, `Action Intent System`, `Tooltip Components`, `npcLoadout.test.js`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `MockGameMap`, `Game Initialization Manager`, `Turret Combat Logic`, `EventRunner`, `Options and Crafting UI`, `Dialog and Button UI`, `Tile Rendering and Cache`, `Line of Sight System`, `Map Editor Tools`, `Crafting Manager Logic`, `TemplateMapGenerator.js`, `Scenario Map Generation`, `Toast UI Components`, `Map Tile Logic`, `Map Serialization Tests`, `.executeTransition`, `FurniturePlanner.js`, `Lab Map Generation`, `DevConsole.tsx`, `Weapon Attachment Logic`, `Building Hallway Tests`, `Table UI Components`, `WeatherManager`, `RabbitAI`, `verify_firefighter_spawn.js`, `EarbucksShopSystem.js`, `RoadGenerator`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `cn()` connect `Game Engine Context` to `._restoreTilesAndEntities`, `AI and Inventory Systems`, `tmp_verify_fix.js`, `Container.test.js`, `verify_map_gen.js`, `HUD and Dialog UI`, `Shop and Pricing Config`, `Character and Menu Windows`, `World Progression and Spawning`, `Combat and Turn Management`, `Sidebar UI Components`, `Asset Image Loader`, `Rendering Optimization Tests`, `Menubar UI Components`, `Audio Management System`, `TestEntity`, `App Routing and Scaling`, `RabbitAI`, `.runTurn`, `navigation-menu.tsx`, `Electron Main Process`, `EarbucksShopSystem`, `verify_firefighter_spawn.js`, `tmp_verify_clip.js`, `toggle-group.tsx`, `tmp_verify_zombie_loot.js`, `ZombieTypes.js`, `rcVehicleMovement.test.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _717 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12473118279569892 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._