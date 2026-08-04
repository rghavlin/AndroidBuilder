# Graph Report - AndroidBuilder  (2026-08-04)

## Corpus Check
- 489 files · ~6,524,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3104 nodes · 8105 edges · 156 communities (114 shown, 42 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e0f03e3`
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
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- eventMarkersIntegration.test.js
- API Query Client
- MirroredWindingRoadGenerator
- chart.tsx
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
- `runInspector()` --references--> `json`  [EXTRACTED]
  .agent/skills/cheap-inspector/index.js → verify_phase_2.mjs
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json
- `EarbucksShopWindow()` --references--> `react`  [EXTRACTED]
  client/src/components/Game/EarbucksShopWindow.tsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (156 total, 42 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.08
Nodes (32): DroneConfig, Drone, droneEntityFilter(), ease(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost() (+24 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.04
Nodes (59): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar() (+51 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.13
Nodes (22): BarterWindowProps, InventoryExtensionWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), ClothingContainerPanel(), ClothingContainerPanelProps (+14 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (5): getProgressionForMap(), findSouthTransitionTile(), AnimalSpawner, NPCSpawner, runDebug()

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (8): DevConsole(), EntityFactory, logger, ZombieReplenishmentSystem, npc(), emptyTiles(), loadScenario(), runTest()

### Community 7 - "Shop and Log UI"
Cohesion: 0.13
Nodes (8): Door, door, engineMock, map, moveIntent, player, z1, z2

### Community 8 - "Tooltip Components"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 9 - "Entity Component System"
Cohesion: 0.25
Nodes (7): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage()

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.07
Nodes (7): ScenarioMapGenerator, TemplateMapGenerator, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (26): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+18 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.30
Nodes (10): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+2 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.12
Nodes (21): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+13 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.11
Nodes (29): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, HelpWindow(), HelpWindowProps (+21 more)

### Community 20 - "Game Map Management"
Cohesion: 0.11
Nodes (24): applyKnob(), args, ATTR_KNOBS, avg(), base, cloneScenario(), configurePlayerVitals(), livingZombies() (+16 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.17
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, gameRandom, makeSeededRandom(), map (+1 more)

### Community 23 - "Door"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 24 - "Turret Combat Logic"
Cohesion: 0.08
Nodes (25): CraftingRecipes, getItemName(), ItemDefs, ItemCategory, Rarity, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS (+17 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.06
Nodes (12): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids(), hasItemsInside() (+4 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.07
Nodes (58): BarterWindow(), EarbucksShopWindow(), StartModeDialog(), StartModeDialogProps, CampfireUI(), CampfireUIProps, CraftingUI(), ActionContext (+50 more)

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (21): DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent, LegacyBubbleEvent (+13 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.28
Nodes (6): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 31 - "EventRunner"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.06
Nodes (23): Container, isGroundPriority(), isPinnedInPlace(), engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, PocketLayouts, runContainerTests() (+15 more)

### Community 34 - "Camera Viewport Control"
Cohesion: 0.07
Nodes (12): Camera, bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes (+4 more)

### Community 35 - "Dialog and Button UI"
Cohesion: 0.15
Nodes (9): PlayerSkills, INIT_STATES, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.05
Nodes (15): Health, MeleeWeapon, Position, Renderable, NOTE: do NOT force itemsModified for every container/attachment item., { GameMap }, { TemplateMapGenerator }, canSeeBlocked (+7 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (44): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+36 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 46 - "Turret AI Testing"
Cohesion: 0.19
Nodes (7): compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, json, runTest()

### Community 47 - "Game Engine State"
Cohesion: 0.06
Nodes (27): RoadGenerator, DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), collectDeviceFov() (+19 more)

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
Cohesion: 0.10
Nodes (27): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+19 more)

### Community 62 - "TestEntity"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.33
Nodes (3): debugLog(), TurnManager, CombatSystem

### Community 65 - "Scenario Map Generation"
Cohesion: 0.10
Nodes (19): createItemFromDef(), makeVehicle(), MOTOR_PAIRS, penalty(), equipBackpack(), makeItem(), equipBeltWithPouch(), makeItem() (+11 more)

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.20
Nodes (6): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, runCycle()

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.19
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.31
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 73 - "World Object Spawning"
Cohesion: 0.07
Nodes (37): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow() (+29 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.27
Nodes (5): applyExpiration(), applyPower(), processInventoryTurn(), processItem(), TurnProcessingUtils

### Community 75 - "Map Serialization Tests"
Cohesion: 0.08
Nodes (17): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideCompound(), isInsideTollGate(), isInStartArea(), isFloor(), computeTollGateLayout() (+9 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.15
Nodes (10): DestroyIntent, NoiseEvent, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates, MovementSystem, computeHearingZone() (+2 more)

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
Cohesion: 0.11
Nodes (27): DefeatDialog(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+19 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): getAdjustedBgColor(), UniversalGrid(), ActionProvider(), getBrainPulpOverrides(), getBrainstemOverrides(), AttributeProgressionManager, rainbowBackground()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.05
Nodes (12): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer (+4 more)

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 93 - "EntityRenderer.js"
Cohesion: 0.27
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+3 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.07
Nodes (13): AIState, Burnable, COMPONENT_NAME_BY_CTOR, RpgStats, EntityType, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see (+5 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.16
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 103 - "RabbitAI"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 104 - ".runTurn"
Cohesion: 0.25
Nodes (5): OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 107 - "WeatherManager"
Cohesion: 0.27
Nodes (4): applyNpcAIMode(), log, interpolateText(), applyItemGrants()

### Community 109 - "SeededRandom"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (14): ActionPoints, AIBehavior, Consumable, EquippedArmor, Inventory, InventoryContainer, Item, LightEmitter (+6 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.50
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 115 - "InventoryProvider"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 116 - "scratch_los_test.js"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 118 - "RoadGenerator"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 119 - "alert.tsx"
Cohesion: 0.14
Nodes (3): Tile, buildMap(), mapWithEdgeWindow()

### Community 120 - "tmp_verify_zombie_loot.js"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 126 - "eventMarkersIntegration.test.js"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "MockGameMap"
Cohesion: 0.17
Nodes (4): exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 147 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 157 - "eventMarkers.test.js"
Cohesion: 0.20
Nodes (12): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), migrateBubbleEvent() (+4 more)

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `ZombieTypes.js`, `Character and Menu Windows`, `Door`, `Action Queue Processing`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Crafting Manager Logic`, `Menubar UI Components`, `Audio Management System`, `TestEntity`, `World Object Spawning`, `App Routing and Scaling`, `Campfire Visibility Tests`, `context-menu.tsx`, `DevConsole.tsx`, `RabbitAI`, `Electron Main Process`, `InventoryProvider`, `tmp_verify_zombie_loot.js`, `tmp_verify_zombie_loot.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `chart.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `.runTurn`, `Entity Component System`, `External Dependencies`, `Entity Spawning and Scent`, `Campfire Visibility Tests`, `Action Queue Processing`, `Sidebar UI Components`, `TestEntity`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _713 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0841813135985199 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._