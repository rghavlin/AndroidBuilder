# Graph Report - AndroidBuilder  (2026-07-29)

## Corpus Check
- 464 files · ~6,476,018 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2964 nodes · 7669 edges · 162 communities (109 shown, 53 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c42d2557`
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
- alert.tsx
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- MapConnectivityValidator.js
- ExplosionIntent
- Building Hallway Tests
- sheet.tsx
- Table UI Components
- AttributeProgressionManager
- AudioSystem
- LineOfSight.js
- .generateNextMap
- verify_saveload.mjs
- Seeded Random Utilities
- bench_houses.mjs
- React Error Boundaries
- npcAttackOnSight.test.js
- Electron Main Process
- EarbucksShopSystem
- ActionPoints
- AIBehavior
- SurvivalCascade.js
- Health
- Inventory
- InventoryContainer
- MapCanvas.jsx
- PlayerWallet
- tmp_verify_zombie_loot.js
- Position
- OTP Input Components
- Renderable
- test_inventory_ecs.mjs
- SurvivalStats
- API Query Client
- Vision
- index.js
- chart.tsx
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- Container.test.js
- DialogOverlay.tsx
- form.tsx
- Image Cropping Scripts
- migrateEvents.js
- NPM Configuration Testing
- Electron Preload Script
- navigation-menu.tsx
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- tmp_verify_zombie_loot.js
- react
- test_exhaustive_los.js
- TestMapBuilder
- MusicManager
- verify_rain_collector_size.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 119 edges
2. `Item` - 108 edges
3. `GameMap` - 93 edges
4. `createItemFromDef()` - 90 edges
5. `Entity` - 83 edges
6. `InventoryManager` - 76 edges
7. `engine` - 60 edges
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

## Communities (162 total, 53 thin omitted)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (78): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, AttachmentSlot, AttachmentSlotProps (+70 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.12
Nodes (33): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), BeltContainerPanel() (+25 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.15
Nodes (9): getProgressionForMap(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, findSouthTransitionTile(), EMPTY_CATALOG, AnimalSpawner (+1 more)

### Community 6 - "Action Intent System"
Cohesion: 0.05
Nodes (14): Burnable, Consumable, EquippedArmor, Item, LightEmitter, MeleeWeapon, RpgStats, COMPONENT_CLASSES (+6 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.22
Nodes (12): DamageIntent, getZombieType(), ZombieTypes, getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer() (+4 more)

### Community 9 - "Entity Component System"
Cohesion: 0.07
Nodes (21): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+13 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.07
Nodes (44): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+36 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.18
Nodes (12): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+4 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.08
Nodes (7): isInsideCompound(), TemplateMapGenerator, generator, layout, mapData, verifyRandomBuildings(), generator

### Community 14 - "Rabbit AI State"
Cohesion: 0.12
Nodes (22): GameScreenContent(), InfectionHUD(), TileTooltipOverlay(), ActionContext, ActionProvider(), CombatContext, CombatProvider(), provokeAndWarn() (+14 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.11
Nodes (22): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialogProps, ScenarioInfo, ScenarioPickerWindowProps, TutorialEndDialog(), TutorialEndDialogProps, Button (+14 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (7): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.12
Nodes (10): getEffectiveHour(), getLightMode(), EntityType, engine, NOTE: Structural damage (hp reduction, break/open flags) was already, log, applyMapRegistries(), hasScenario (+2 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.15
Nodes (8): logger, PlayerContext, NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, log, AttributeProgressionManager, GAME_EVENT, GameEventBus, Logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.19
Nodes (15): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, MainMenuWindowProps (+7 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.11
Nodes (9): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, RoadGenerator, toSlimRoom(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, { GameMap } (+1 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.14
Nodes (11): NOTE: do NOT force itemsModified for every container/attachment item., isFloor(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run, gameRandom, makeSeededRandom(), map (+3 more)

### Community 23 - "Door"
Cohesion: 0.12
Nodes (4): BaseMapGenerator, ScenarioMapGenerator, startingHouseLayout(), StartingRoadGenerator

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (33): DestroyIntent, NoiseEvent, IntentQueue, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem, NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates (+25 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (10): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, manager (+2 more)

### Community 26 - "Action Queue Processing"
Cohesion: 0.40
Nodes (5): DisplaySlot, formatTimestamp(), LoadGameWindow(), LoadGameWindowProps, SaveSlot

### Community 27 - "useGame"
Cohesion: 0.27
Nodes (5): RabbitAI, doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity()

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (35): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+27 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.07
Nodes (30): TurretAI, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, PocketLayouts, CategoryDisplayName (+22 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.07
Nodes (35): ActionSlotButton(), ActionSlotButtonProps, BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps (+27 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.14
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.13
Nodes (21): SleepOverlay(), StartModeDialog(), StartModeDialogProps, CameraContext, CameraProvider(), useCamera(), GameContext, GameContextInner() (+13 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.17
Nodes (16): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, DragPreviewLayer() (+8 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.12
Nodes (6): log, NOTE: This only moves the camera view, not any entities, PlayerSkills, INIT_STATES, EventEmitter, ZombieSpawner

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (16): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+8 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (47): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES (+39 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.16
Nodes (15): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+7 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.18
Nodes (5): CharacterCreator(), PlayerSkillsUI(), CombatResolver, brokenScopeStats, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.12
Nodes (13): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), ScenarioPickerWindow(), StartMenu(), compressString(), decompressString() (+5 more)

### Community 47 - "Game Engine State"
Cohesion: 0.11
Nodes (10): getSightRangeForHour(), LineOfSight, logger, Quadrant, Row, slope(), test(), buildMap() (+2 more)

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
Cohesion: 0.24
Nodes (3): EntityFactory, npc(), runTest()

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.09
Nodes (26): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), provokeTargetFaction() (+18 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.25
Nodes (10): AudioContext, AudioProvider(), DEFAULT_TERRAIN_PROPS, getTerrainProps(), isIndoorFloor(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS (+2 more)

### Community 66 - "Form UI Components"
Cohesion: 0.23
Nodes (8): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, MenuButtonDef, StartMenuButtons(), StartMenuButtonsProps, CharacterRegistry

### Community 67 - "Door Interaction Logic"
Cohesion: 0.24
Nodes (9): ScreenScaler(), ScreenScalerProps, FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleMode(), useWindowSize() (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.21
Nodes (5): DevConsole(), exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 74 - "Map Tile Logic"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 75 - "Map Serialization Tests"
Cohesion: 0.11
Nodes (9): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), applyItemGrants(), makeVehicle(), MOTOR_PAIRS, penalty() (+1 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.23
Nodes (11): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+3 more)

### Community 77 - "Item Factory Methods"
Cohesion: 0.46
Nodes (4): isInsideTollGate(), isInStartArea(), logger, ZombieReplenishmentSystem

### Community 80 - "Electron Build Config"
Cohesion: 0.17
Nodes (12): build, appId, directories, extraFiles, files, productName, win, buildResources (+4 more)

### Community 81 - "Server and Vite Config"
Cohesion: 0.24
Nodes (8): express, vite, app, registerRoutes(), log(), serveStatic(), setupVite(), viteLogger

### Community 82 - "NPM Build Scripts"
Cohesion: 0.11
Nodes (18): scripts, ap-economy, balance, build, build-electron, check, dev, electron (+10 more)

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.35
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), sicknessPenalties() (+2 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 85 - "context-menu.tsx"
Cohesion: 0.17
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.13
Nodes (22): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+14 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.31
Nodes (6): hashLocation(), hashNavigate(), useHashLocation(), ThemeProvider(), GamePage(), NotFound()

### Community 93 - "alert.tsx"
Cohesion: 0.28
Nodes (6): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 94 - "DevConsole.tsx"
Cohesion: 0.14
Nodes (14): SeededRandom, applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest() (+6 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "ExplosionIntent"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 99 - "Building Hallway Tests"
Cohesion: 0.13
Nodes (4): AITargeting, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "sheet.tsx"
Cohesion: 0.25
Nodes (6): map, mockTile, npc, player, rabbit, zombie

### Community 103 - "AudioSystem"
Cohesion: 0.47
Nodes (5): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig

### Community 105 - "LineOfSight.js"
Cohesion: 0.12
Nodes (5): GameInitializationManager, runDebug(), MockMap, mockPlayer, verifySpawning()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.06
Nodes (6): FactionRegistry, COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set()

### Community 109 - "bench_houses.mjs"
Cohesion: 0.33
Nodes (5): builder, mapData, t0, t1, t2

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 124 - "OTP Input Components"
Cohesion: 0.10
Nodes (28): EquipmentSlot, EquipmentSlotProps, SLOT_INFO, FloatingContainerOverlay(), GridSlot, GridSlotProps, ItemContextMenu(), ItemContextMenuProps (+20 more)

### Community 126 - "test_inventory_ecs.mjs"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 143 - "DialogOverlay.tsx"
Cohesion: 0.11
Nodes (11): DialogOverlayProps, DialogStep, InventoryExtensionWindowProps, JournalUI(), NPCDemandDialog(), PlayerSkillsWindowProps, TradeDialog(), TradeDialogProps (+3 more)

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.14
Nodes (7): DevConsoleProps, DevConsoleShopManager(), TabType, SplitDialog(), CardFooter, Input, Slider

### Community 172 - "tmp_verify_zombie_loot.js"
Cohesion: 0.21
Nodes (5): MoveIntent, NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), AudioSystem

### Community 173 - "react"
Cohesion: 0.25
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), useIsMobile(), react

### Community 174 - "test_exhaustive_los.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **686 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+681 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Inventory and Skill Windows`, `DialogOverlay.tsx`, `Shop and Pricing Config`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Menubar UI Components`, `Form UI Components`, `Door Interaction Logic`, `Map Tile Logic`, `App Routing and Scaling`, `SurvivalCascade.js`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Container Grid Logic`, `AI and Inventory Systems`, `Crafting Manager Logic`, `App Routing and Scaling`, `External Dependencies`, `Turret AI Testing`, `.generateFromScenario`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _701 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.03000898472596586 - nodes in this community are weakly interconnected._