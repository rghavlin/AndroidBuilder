# Graph Report - AndroidBuilder  (2026-07-29)

## Corpus Check
- 464 files · ~6,476,388 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2970 nodes · 7680 edges · 141 communities (106 shown, 35 thin omitted)
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
- DevConsole.tsx
- Weapon Attachment Logic
- Project Package Metadata
- MapConnectivityValidator.js
- ExplosionIntent
- Building Hallway Tests
- Table UI Components
- LineOfSight.js
- .generateNextMap
- Seeded Random Utilities
- React Error Boundaries
- npcAttackOnSight.test.js
- Electron Main Process
- EarbucksShopSystem
- SurvivalCascade.js
- tmp_verify_zombie_loot.js
- OTP Input Components
- API Query Client
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
- react
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
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
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

## Communities (141 total, 35 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.03
Nodes (80): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, TradeDialog(), TradeDialogProps (+72 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (35): InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI(), CampfireUIProps (+27 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.18
Nodes (7): getProgressionForMap(), findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, AnimalSpawner, NPCSpawner, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 6 - "Action Intent System"
Cohesion: 0.04
Nodes (23): ActionPoints, AIBehavior, Burnable, Consumable, EquippedArmor, Inventory, InventoryContainer, LightEmitter (+15 more)

### Community 8 - "Tooltip Components"
Cohesion: 0.50
Nodes (3): ZombieTooltip(), ZombieTooltipProps, ZombieTypes

### Community 9 - "Entity Component System"
Cohesion: 0.09
Nodes (16): LootProgression, RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors (+8 more)

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.09
Nodes (29): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+21 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.16
Nodes (13): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+5 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (9): isInsideCompound(), TemplateMapGenerator, { GameMap }, { TemplateMapGenerator }, generator, layout, mapData, verifyRandomBuildings() (+1 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.06
Nodes (44): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, LootTooltip(), LootTooltipProps (+36 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.25
Nodes (12): MapTransitionDialog(), MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, SplitDialog(), DialogContent, DialogDescription (+4 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.07
Nodes (33): lastRainUpdate, playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., warnedMalformedEntityIds, SpeechBubbleInput(), StartModeDialog(), StartModeDialogProps (+25 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.27
Nodes (3): log, NOTE: This only moves the camera view, not any entities, Logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.15
Nodes (23): CharacterCreatorProps, StatAdjusterCardProps, CreditsWindowProps, DefeatDialog(), HelpWindow(), HelpWindowProps, VideoItem, DisplaySlot (+15 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.14
Nodes (10): MAP_GEN_CONFIG, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, LAYOUT (+2 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.18
Nodes (5): MapProgression, AttributeProgressionManager, gameRandom, map, brokenScopeStats

### Community 24 - "Turret Combat Logic"
Cohesion: 0.06
Nodes (33): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, CombatSystem, DestructionSystem, ExplosionSystem, FireSystem (+25 more)

### Community 25 - "Inventory Management System"
Cohesion: 0.06
Nodes (5): hasItemsInside(), InventoryManager, isClothingOrBackpack(), manager, verifyLoadSwaps()

### Community 26 - "Action Queue Processing"
Cohesion: 0.15
Nodes (3): COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, set()

### Community 27 - "useGame"
Cohesion: 0.10
Nodes (20): Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef, GameEvent (+12 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.27
Nodes (4): compressString(), decompressString(), runDebug(), runDebug()

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (27): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+19 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.08
Nodes (23): NPCTypes, isGroundPriority(), isPinnedInPlace(), engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, PocketLayouts (+15 more)

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Container Grid Logic"
Cohesion: 0.09
Nodes (36): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), EarbucksShopWindowProps, ShopItemRowProps, GameControls(), GameControlsProps, STAT_COLORS (+28 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.10
Nodes (6): Container, runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.16
Nodes (18): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, StartMenuButtons() (+10 more)

### Community 38 - "Building Layout Builder"
Cohesion: 0.14
Nodes (3): ScenarioMapGenerator, MapBuilder, test()

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.06
Nodes (8): compare(), evalAll(), evalCondition(), isEventActive(), EventRunner, interpolateText(), QuestState, applyItemGrants()

### Community 41 - "Map Editor Tools"
Cohesion: 0.07
Nodes (48): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents() (+40 more)

### Community 42 - "toast.tsx"
Cohesion: 0.11
Nodes (11): SeededRandom, args, config, secs, seeds, startSeed, t0, fuzzSeed() (+3 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 44 - "ImageLoader"
Cohesion: 0.27
Nodes (8): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), resolveMapEvents()

### Community 45 - "Asset Image Loader"
Cohesion: 0.19
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 46 - "Turret AI Testing"
Cohesion: 0.23
Nodes (6): MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 47 - "Game Engine State"
Cohesion: 0.16
Nodes (6): LineOfSight, Quadrant, Row, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.06
Nodes (25): GameMapProvider(), RabbitAI, DamageIntent, MoveIntent, getNPCType(), getZombieType(), doorsForBuilding(), floodFill() (+17 more)

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
Cohesion: 0.06
Nodes (29): escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret(), isTurretPassableBy() (+21 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.05
Nodes (19): AIState, PlayerSkills, Rabbit, INIT_STATES, SequencerAction, aiComp, ent, npc (+11 more)

### Community 63 - "Crafting Recipe Verification"
Cohesion: 0.17
Nodes (4): AITargeting, TurretAI, debugLog(), TurnManager

### Community 64 - "Ground Item Management"
Cohesion: 0.25
Nodes (10): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), logger, buildMap() (+2 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 66 - "Form UI Components"
Cohesion: 0.21
Nodes (9): CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), StartMenuProps, MenuButtonDef, StartMenuButtonsProps, CharacterRegistry, DEFAULT_PLAYER_STATS (+1 more)

### Community 70 - "Toast Notification State"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 72 - "Toast UI Components"
Cohesion: 0.11
Nodes (6): DevConsole(), CameraProvider(), WeatherManager, exportScenario(), MockGameMap, testWallGapFix()

### Community 74 - "Map Tile Logic"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 75 - "Map Serialization Tests"
Cohesion: 0.16
Nodes (6): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isFloor(), make()

### Community 76 - "App Routing and Scaling"
Cohesion: 0.33
Nodes (5): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG

### Community 77 - "Item Factory Methods"
Cohesion: 0.52
Nodes (3): isInsideTollGate(), isInStartArea(), ZombieSpawner

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
Cohesion: 0.29
Nodes (12): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), recalcCharacter(), rollWoundInfectionCure() (+4 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.08
Nodes (11): EntityType, Item, TestEntity, AISystem, door, engineMock, map, moveIntent (+3 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.09
Nodes (30): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+22 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.12
Nodes (10): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, ThemeProvider(), getScaleMode(), ErrorBoundary (+2 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.30
Nodes (12): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), livingZombies(), nearest(), pct(), playerTurn() (+4 more)

### Community 95 - "Weapon Attachment Logic"
Cohesion: 0.14
Nodes (3): BranchingRoadGenerator, RoadNetwork, makeSeededRandom()

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 98 - "ExplosionIntent"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 99 - "Building Hallway Tests"
Cohesion: 0.16
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 101 - "Table UI Components"
Cohesion: 0.13
Nodes (10): getBrainstemColor(), getBrainstemStewColors(), CraftingManager, CraftingRecipes, getItemName(), getFuelValue(), ItemCategory, computeBrainstemStewTreatment() (+2 more)

### Community 105 - "LineOfSight.js"
Cohesion: 0.14
Nodes (4): GameInitializationManager, MockMap, mockPlayer, verifySpawning()

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.06
Nodes (13): Health, Item, MeleeWeapon, NOTE: do NOT force itemsModified for every container/attachment item., applyNpcAIMode(), applyMapRegistries(), ZombieReplenishmentSystem, SafeEventEmitter (+5 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.19
Nodes (13): DevConsoleShopManager(), CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait() (+5 more)

### Community 116 - "SurvivalCascade.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 124 - "OTP Input Components"
Cohesion: 0.08
Nodes (32): ActionSlotButton(), ActionSlotButtonProps, ShopItemRow(), EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps (+24 more)

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 130 - "index.js"
Cohesion: 0.20
Nodes (6): inputContent, runInspector(), GameContextInner(), GameSaveSystem, verifyRestoration(), json

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.18
Nodes (4): DevConsoleProps, TabType, CardFooter, Input

### Community 173 - "react"
Cohesion: 0.25
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), LogProvider(), useIsMobile(), react

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 187 - "verify_rain_collector_size.mjs"
Cohesion: 0.05
Nodes (18): GameMap, log, basicResult, map, mutantResult, player, windowEntity, zombieBasic (+10 more)

## Knowledge Gaps
- **687 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+682 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Game Engine Context` to `chart.tsx`, `AI and Inventory Systems`, `Tooltip Components`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Container Grid Logic`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `Menubar UI Components`, `Scenario Map Generation`, `Form UI Components`, `Toast Notification State`, `Map Tile Logic`, `SurvivalCascade.js`, `tmp_verify_zombie_loot.js`, `OTP Input Components`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `react`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Container Grid Logic`, `Toast Notification State`, `External Dependencies`, `Turret AI Testing`, `Rabbit AI State`, `.generateFromScenario`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _702 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.029221882432891606 - nodes in this community are weakly interconnected._