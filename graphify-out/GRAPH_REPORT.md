# Graph Report - AndroidBuilder  (2026-08-02)

## Corpus Check
- 484 files · ~6,485,009 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3054 nodes · 7945 edges · 169 communities (119 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `476a40c1`
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
- Menubar UI Components
- Entity Serialization Tests
- Audio Management System
- UI Framework Config
- TemplateMapGenerator.js
- MapBuilder.js
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
- IntentQueue
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
- tmp_verify_zombie_bug.js
- InventoryProvider
- SurvivalCascade.js
- MoveIntent
- RoadGenerator
- alert.tsx
- TurretAI.js
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- MapConnectivityValidator.js
- droneVision.test.js
- App.tsx
- API Query Client
- MirroredWindingRoadGenerator
- index.js
- chart.tsx
- tmp_verify_two_zombies.js
- ErrorBoundary
- IndexedDBStore
- ZombieSpawner.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- LoadGameWindow.tsx
- Container.test.js
- ZombieTypes.js
- npcLoadout.test.js
- form.tsx
- DamageIntent
- Image Cropping Scripts
- .spawnFurniture
- tmp_verify_loot.js
- tmp_verify_loot_summary.js
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- navigation-menu.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- TestMapBuilder
- MusicManager

## God Nodes (most connected - your core abstractions)
1. `cn()` - 119 edges
2. `Item` - 115 edges
3. `createItemFromDef()` - 106 edges
4. `GameMap` - 94 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 76 edges
7. `engine` - 66 edges
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
- `runTest()` --references--> `json`  [EXTRACTED]
  verify_saveload.mjs → verify_phase_2.mjs
- `useHashLocation()` --references--> `react`  [EXTRACTED]
  client/src/App.tsx → package.json

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (169 total, 50 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.10
Nodes (23): DroneConfig, Drone, SequencerAction, droneEntityFilter(), findDronePath(), getActiveDrone(), moveActiveDevice(), previewMoveCost() (+15 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.06
Nodes (40): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+32 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (31): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel(), BeltContainerPanelProps (+23 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.15
Nodes (8): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, runDebug()

### Community 6 - "Action Intent System"
Cohesion: 0.09
Nodes (8): ActionPoints, AIBehavior, Inventory, Movable, Position, EntityFactory, npc(), runTest()

### Community 8 - "Tooltip Components"
Cohesion: 0.11
Nodes (17): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+9 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (20): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+12 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.09
Nodes (3): isInsideCompound(), TemplateMapGenerator, verifyRandomBuildings()

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (27): EarbucksShopWindowProps, ShopItemRowProps, ActionContext, AudioContext, CombatContext, provokeAndWarn(), resolveTileTarget(), GameMapContext (+19 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.30
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Button, DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.14
Nodes (5): ShopItemRow(), debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.16
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+7 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.20
Nodes (15): CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, MainMenuWindowProps, SaveGameWindowProps, SaveSlot (+7 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.09
Nodes (14): MAP_GEN_CONFIG, FIXED_TEMPLATE_ASSIGNMENTS, TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, toSlimRoom(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy (+6 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.14
Nodes (6): MapProgression, INIT_STATES, gameRandom, logger, map, brokenScopeStats

### Community 23 - "Door"
Cohesion: 0.04
Nodes (33): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Avatar (+25 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (8): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), KNOWN_FAILURES, manager, results

### Community 26 - "Action Queue Processing"
Cohesion: 0.28
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (20): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+12 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.08
Nodes (28): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+20 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (29): Input, Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup (+21 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.09
Nodes (17): createItemFromDef(), stow(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty(), make(), DEF_IDS (+9 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.09
Nodes (28): NPCTypes, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, PocketLayouts, testResults (+20 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.12
Nodes (25): ActionSlotButton(), ActionSlotButtonProps, EarbucksDisplay(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps (+17 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (15): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+7 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (48): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents() (+40 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 45 - "Asset Image Loader"
Cohesion: 0.24
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.15
Nodes (10): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), compressString(), decompressString(), GameSaveSystem (+2 more)

### Community 47 - "Game Engine State"
Cohesion: 0.16
Nodes (6): LineOfSight, Quadrant, Row, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.10
Nodes (27): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+19 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.11
Nodes (4): AIState, Burnable, RpgStats, PlaceIcon

### Community 64 - "Ground Item Management"
Cohesion: 0.07
Nodes (26): BarterWindowProps, JournalUI(), PlayerProvider(), SpeechBubbleContext, getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour() (+18 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (8): Rabbit, map, mockTile, npc, player, rabbit, zombie, testCases

### Community 68 - "Road Generation Logic"
Cohesion: 0.26
Nodes (4): getNPCType(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.26
Nodes (11): getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate(), spitAtPlayer() (+3 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.23
Nodes (4): DevConsole(), exportScenario(), MockGameMap, testWallGapFix()

### Community 73 - "World Object Spawning"
Cohesion: 0.14
Nodes (8): InfectionHUD(), logger, PlayerContext, NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, log, NOTE: This only moves the camera view, not any entities, logger, Logger

### Community 74 - "Map Tile Logic"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 75 - "Map Serialization Tests"
Cohesion: 0.19
Nodes (3): getFoodRejectionChance(), LootGenerator, isFloor()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.11
Nodes (10): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+2 more)

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
Cohesion: 0.09
Nodes (50): BarterWindow(), EarbucksShopWindow(), GameScreenContent(), MapInterface(), MapTransitionDialog(), NPCDemandDialog(), OverlayManager(), SleepModal() (+42 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (29): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+21 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.25
Nodes (10): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), getScaleMode() (+2 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.21
Nodes (12): CharacterCreatorProps, StatAdjusterCardProps, applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats() (+4 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.25
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.17
Nodes (8): PlayerSkills, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 98 - "ExplosionIntent"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 99 - "Building Hallway Tests"
Cohesion: 0.14
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "Game.tsx"
Cohesion: 0.25
Nodes (10): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, buildMap() (+2 more)

### Community 101 - "Table UI Components"
Cohesion: 0.18
Nodes (5): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, getItemName(), computeBrainstemStewTreatment()

### Community 104 - ".runTurn"
Cohesion: 0.17
Nodes (4): SimulationManager, VisionSystem, computeHearingZone(), runCycle()

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (13): Consumable, EquippedArmor, Health, InventoryContainer, Item, LightEmitter, MeleeWeapon, PlayerWallet (+5 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.13
Nodes (14): DevConsoleShopManager(), CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait() (+6 more)

### Community 114 - "tmp_verify_zombie_bug.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 120 - "TurretAI.js"
Cohesion: 0.29
Nodes (7): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, CharacterRegistry, DEFAULT_PLAYER_STATS, idbStore

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 123 - "EntityType"
Cohesion: 0.29
Nodes (9): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport, Toaster() (+1 more)

### Community 124 - "OTP Input Components"
Cohesion: 0.20
Nodes (7): EquipmentSlot, EquipmentSlotProps, SLOT_INFO, ItemTooltip(), ItemTooltipProps, WorkspaceSlot, WorkspaceSlotProps

### Community 125 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 126 - "droneVision.test.js"
Cohesion: 0.25
Nodes (6): collectDeviceFov(), deviceFovHashPart(), listAirborneDevices(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 127 - "App.tsx"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.13
Nodes (12): useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES (+4 more)

### Community 132 - "tmp_verify_two_zombies.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 135 - "ZombieSpawner.js"
Cohesion: 0.52
Nodes (3): isInsideTollGate(), isInStartArea(), ZombieSpawner

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "LoadGameWindow.tsx"
Cohesion: 0.40
Nodes (5): DisplaySlot, formatTimestamp(), LoadGameWindow(), LoadGameWindowProps, SaveSlot

### Community 142 - "ZombieTypes.js"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.20
Nodes (3): DevConsoleProps, TabType, CardFooter

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **697 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+692 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `ZombieTypes.js`, `Shop and Pricing Config`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `Door`, `Combat and Turn Management`, `Sidebar UI Components`, `EventRunner`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `Menubar UI Components`, `Ground Item Management`, `Scenario Map Generation`, `Map Tile Logic`, `Campfire Visibility Tests`, `.generateFromScenario`, `tmp_verify_zombie_loot.js`, `EntityType`, `OTP Input Components`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `chart.tsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `External Dependencies`, `Rabbit AI State`, `Turret AI Testing`, `Entity Spawning and Scent`, `Campfire Visibility Tests`, `EntityType`, `Sidebar UI Components`, `App.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _712 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.053923541247484906 - nodes in this community are weakly interconnected._