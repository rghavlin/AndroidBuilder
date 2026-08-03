# Graph Report - AndroidBuilder  (2026-08-03)

## Corpus Check
- 484 files · ~6,485,549 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3057 nodes · 7952 edges · 159 communities (113 shown, 46 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `514a7344`
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
- InventoryProvider
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
- ErrorBoundary
- IndexedDBStore
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- Container.test.js
- npcLoadout.test.js
- form.tsx
- Image Cropping Scripts
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
- `makeItems()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/organizeByCategory.test.js → client/src/game/inventory/ItemDefs.js
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs
- `runTest()` --references--> `json`  [EXTRACTED]
  verify_saveload.mjs → verify_phase_2.mjs

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (159 total, 46 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.11
Nodes (24): DroneConfig, Drone, droneEntityFilter(), ease(), findDronePath(), finishFlight(), getActiveDrone(), moveActiveDevice() (+16 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (70): TradeDialog(), TradeDialogProps, ZombieTooltip(), ZombieTooltipProps, AccordionContent, AccordionItem, AccordionTrigger, Alert (+62 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.13
Nodes (23): BarterWindow(), BarterWindowProps, InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI(), CampfireUIProps (+15 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.15
Nodes (9): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), EMPTY_CATALOG, AnimalSpawner (+1 more)

### Community 6 - "Action Intent System"
Cohesion: 0.11
Nodes (7): DevConsole(), Movable, Renderable, Vision, EntityFactory, npc(), runTest()

### Community 8 - "Tooltip Components"
Cohesion: 0.09
Nodes (10): ActionPoints, EquippedArmor, Health, PlayerWallet, defineAccessors(), SurvivalStats, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to (+2 more)

### Community 9 - "Entity Component System"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.09
Nodes (6): ScenarioMapGenerator, isInsideCompound(), TemplateMapGenerator, generator, layout, mapData

### Community 14 - "Rabbit AI State"
Cohesion: 0.19
Nodes (6): log, EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, GAME_EVENT, GameEventBus

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.28
Nodes (11): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), DialogContent, DialogDescription, DialogFooter() (+3 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (8): EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.11
Nodes (22): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+14 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.20
Nodes (4): FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.14
Nodes (25): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+17 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.09
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, { GameMap }, { TemplateMapGenerator }, verifyRandomBuildings() (+1 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.10
Nodes (12): LootProgression, MapProgression, NPCTypes, NOTE: do NOT force itemsModified for every container/attachment item., computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, SafeEventEmitter (+4 more)

### Community 23 - "Door"
Cohesion: 0.11
Nodes (15): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport, Table (+7 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.33
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), react

### Community 25 - "Inventory Management System"
Cohesion: 0.06
Nodes (4): hasItemsInside(), InventoryManager, isClothingOrBackpack(), manager

### Community 26 - "Action Queue Processing"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (20): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+12 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.16
Nodes (13): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, FloatingContainerOverlay(), FloatingContainerOverlayProps (+5 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.09
Nodes (19): createItemFromDef(), generator, indoorMap, outdoorMap, applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty() (+11 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (8): Container, isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 35 - "Dialog and Button UI"
Cohesion: 0.07
Nodes (34): CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, PocketLayouts, CategoryDisplayName, CategoryPriority (+26 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.13
Nodes (22): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, MenuButtonDef (+14 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.15
Nodes (6): INIT_STATES, isInsideTollGate(), isInStartArea(), ZombieReplenishmentSystem, EventEmitter, ZombieSpawner

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (14): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+6 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (45): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+37 more)

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
Cohesion: 0.19
Nodes (6): GameContextInner(), compressString(), decompressString(), GameSaveSystem, verifyRestoration(), json

### Community 47 - "Game Engine State"
Cohesion: 0.12
Nodes (10): VisionSystem, LineOfSight, logger, Quadrant, Row, slope(), test(), buildMap() (+2 more)

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
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.05
Nodes (41): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+33 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.08
Nodes (7): Burnable, RpgStats, PlaceIcon, Item, TestEntity, ENTITY_RESTORERS, restoreEntity()

### Community 64 - "Ground Item Management"
Cohesion: 0.15
Nodes (12): logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, getEffectiveHour(), getLightMode(), getSightRangeForHour(), isNightHour() (+4 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 66 - "Form UI Components"
Cohesion: 0.08
Nodes (8): Rabbit, SequencerAction, map, mockTile, npc, player, rabbit, zombie

### Community 70 - "Toast Notification State"
Cohesion: 0.17
Nodes (15): ToastActionElement, ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+7 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.17
Nodes (14): DamageIntent, getZombieType(), findAttackSlotPath(), getMeleeReach(), isMeleeAttackPosition(), AISystem, getBeelineIntent(), getGreedyHuntIntent() (+6 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 74 - "Map Tile Logic"
Cohesion: 0.40
Nodes (3): allErrors, generator, subtypes

### Community 75 - "Map Serialization Tests"
Cohesion: 0.17
Nodes (4): getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 77 - "Item Factory Methods"
Cohesion: 0.06
Nodes (18): GameMap, log, basicResult, map, mutantResult, player, windowEntity, zombieBasic (+10 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.06
Nodes (32): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+24 more)

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
Cohesion: 0.05
Nodes (69): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, GameControls(), GameControlsProps (+61 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.11
Nodes (25): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+17 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.14
Nodes (14): InventoryExtensionWindowProps, PlayerSkillsWindowProps, FloatingContainer(), FloatingContainerProps, GridSizeContext, GridSizeContextType, GridSizeProvider(), GridSizeProviderProps (+6 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.32
Nodes (11): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), rollWoundInfectionCure() (+3 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.28
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.13
Nodes (9): AIState, PlayerSkills, aiComp, ent, npc, player, rabbit, restored (+1 more)

### Community 98 - "ExplosionIntent"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 99 - "Building Hallway Tests"
Cohesion: 0.17
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "Game.tsx"
Cohesion: 0.42
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 101 - "Table UI Components"
Cohesion: 0.15
Nodes (7): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager, computeBrainstemStewTreatment()

### Community 105 - "LineOfSight.js"
Cohesion: 0.13
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (4): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.07
Nodes (9): AIBehavior, Consumable, Inventory, InventoryContainer, Item, LightEmitter, MeleeWeapon, Position (+1 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 117 - "MoveIntent"
Cohesion: 0.13
Nodes (4): MoveIntent, applyNpcAIMode(), AudioSystem, runCycle()

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
Cohesion: 0.09
Nodes (29): ActionSlotButton(), ActionSlotButtonProps, EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps, ItemContextMenu() (+21 more)

### Community 125 - "MapConnectivityValidator.js"
Cohesion: 0.60
Nodes (4): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 126 - "droneVision.test.js"
Cohesion: 0.29
Nodes (7): collectDeviceFov(), deviceFovHashPart(), devicePos(), listAirborneDevices(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 127 - "App.tsx"
Cohesion: 0.23
Nodes (8): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), GamePage(), NotFound()

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 134 - "IndexedDBStore"
Cohesion: 0.28
Nodes (4): MainMenuWindow(), OptionsWindow(), StartMenu(), IndexedDBStore

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.17
Nodes (5): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter, Input

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **697 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+692 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Inventory and Skill Windows`, `HUD and Dialog UI`, `Shop and Pricing Config`, `form.tsx`, `Character and Menu Windows`, `Door`, `Combat and Turn Management`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `Menubar UI Components`, `TestEntity`, `Scenario Map Generation`, `Campfire Visibility Tests`, `.generateFromScenario`, `tmp_verify_zombie_loot.js`, `EntityType`, `OTP Input Components`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `Turret Combat Logic`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `react` connect `Turret Combat Logic` to `IndexedDBStore`, `External Dependencies`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Campfire Visibility Tests`, `EntityType`, `Sidebar UI Components`, `App.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _712 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._