# Graph Report - AndroidBuilder  (2026-08-03)

## Corpus Check
- 487 files · ~6,596,464 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3066 nodes · 7967 edges · 156 communities (115 shown, 41 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e06c7f2`
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
- verify_firefighter_spawn.js
- InventoryProvider
- MoveIntent
- RoadGenerator
- alert.tsx
- TurretAI.js
- droneRoundTrip.test.js
- tmp_verify_zombie_loot.js
- EntityType
- OTP Input Components
- MapConnectivityValidator.js
- droneVision.test.js
- API Query Client
- MirroredWindingRoadGenerator
- chart.tsx
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- Container.test.js
- npcLoadout.test.js
- form.tsx
- Image Cropping Scripts
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
3. `createItemFromDef()` - 107 edges
4. `GameMap` - 94 edges
5. `Entity` - 85 edges
6. `InventoryManager` - 76 edges
7. `engine` - 66 edges
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
- `penalty()` --references--> `VehicleUtils`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/utils/VehicleUtils.js
- `verifyRandomBuildings()` --references--> `json`  [EXTRACTED]
  tmp_verify_random_map.js → verify_phase_2.mjs

## Import Cycles
- 1-file cycle: `test/balance/apEconomy.mjs -> test/balance/apEconomy.mjs`
- 1-file cycle: `test/balance/balance.mjs -> test/balance/balance.mjs`

## Communities (156 total, 41 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.18
Nodes (13): consumeDeployCharge(), consumeHoverCharge(), droneChargesRemaining(), canOperate(), deploy(), land(), launch(), listControllables() (+5 more)

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (47): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+39 more)

### Community 3 - "Game Engine Context"
Cohesion: 0.05
Nodes (30): StartMenuButtonsProps, AttachmentSlot, AttachmentSlotProps, WeaponModPanelProps, AccordionContent, AccordionItem, AccordionTrigger, Alert (+22 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.08
Nodes (43): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryExtensionWindowProps, InventoryPanel(), PlayerSkillsWindowProps, TollWindow(), TollWindowProps (+35 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.20
Nodes (3): getProgressionForMap(), NPCSpawner, runDebug()

### Community 6 - "Action Intent System"
Cohesion: 0.09
Nodes (8): AIBehavior, InventoryContainer, Movable, Renderable, Vision, EntityFactory, npc(), runTest()

### Community 7 - "Shop and Log UI"
Cohesion: 0.08
Nodes (3): Door, GarageDoor, Window

### Community 8 - "Tooltip Components"
Cohesion: 0.11
Nodes (13): CraftingRecipes, getItemName(), ItemDefs, ItemCategory, make(), hammerRecipe, hatchetRecipe, clothingKeys (+5 more)

### Community 9 - "Entity Component System"
Cohesion: 0.25
Nodes (6): { ItemCategory }, { ItemDefs }, clothingKeys, lootGen, subtypes, { LootGenerator }

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.10
Nodes (28): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+20 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.11
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (14): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, isInsideCompound(), NOTE: previously spawned a 'placeable.help' ("?") item on every legacy, TemplateMapGenerator, { GameMap } (+6 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.08
Nodes (22): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+14 more)

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.08
Nodes (36): SpeechBubbleInput(), StartModeDialog(), StartModeDialogProps, ActionContext, ActionProvider(), CameraContext, CameraProvider(), useCamera() (+28 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.28
Nodes (6): LootProgression, MapProgression, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), TEMPLATE_METADATA, logger

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (28): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+20 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.13
Nodes (18): DevConsoleShopManager(), DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, CATEGORY_PRICES, field(), FLAT_PRICES (+10 more)

### Community 22 - "Game Initialization Manager"
Cohesion: 0.13
Nodes (7): BaseMapGenerator, gameRandom, makeSeededRandom(), map, brokenScopeStats, templates, tmg

### Community 23 - "Door"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 24 - "Turret Combat Logic"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 25 - "Inventory Management System"
Cohesion: 0.05
Nodes (8): hasItemsInside(), InventoryManager, isClothingOrBackpack(), runContainerTests(), runTest(), KNOWN_FAILURES, manager, results

### Community 26 - "Action Queue Processing"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 27 - "useGame"
Cohesion: 0.09
Nodes (23): CompareOp, Condition, DownconvertedEvents, EntityRegistry, EntityRegistryEntry, EventAppearance, FactionDef, FlagDef (+15 more)

### Community 28 - "Combat and Turn Management"
Cohesion: 0.09
Nodes (20): actionQueue, activeZombie, diedAny, ecsEntities, explosionIntent, intentQueue, item, itemDef (+12 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.07
Nodes (28): Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 30 - "Map Generation Config"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 31 - "EventRunner"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 33 - "Options and Crafting UI"
Cohesion: 0.13
Nodes (3): Container, isGroundPriority(), isPinnedInPlace()

### Community 35 - "Dialog and Button UI"
Cohesion: 0.10
Nodes (21): engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, PocketLayouts, testResults, CategoryDisplayName, CategoryPriority, EquipmentSlot (+13 more)

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.17
Nodes (17): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, formatTimestamp() (+9 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 40 - "Line of Sight System"
Cohesion: 0.05
Nodes (19): compare(), evalAll(), evalCondition(), isEventActive(), buildMarker(), computeDesiredMarkers(), isMarker(), log (+11 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.09
Nodes (42): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine, buildFullItem() (+34 more)

### Community 42 - "toast.tsx"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.19
Nodes (13): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+5 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.16
Nodes (6): Drone, SequencerAction, consumePhoneChargeOncePerTurn(), equipPhone(), freshBattery(), makeAirborneDrone()

### Community 46 - "Turret AI Testing"
Cohesion: 0.11
Nodes (14): inputContent, runInspector(), MainMenuWindow(), OptionsWindow(), StartMenu(), MenuButtonDef, StartMenuButtons(), compressString() (+6 more)

### Community 47 - "Game Engine State"
Cohesion: 0.21
Nodes (5): LineOfSight, Quadrant, slope(), test(), los()

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 50 - "Window and Door Interaction"
Cohesion: 0.35
Nodes (10): DroneConfig, droneEntityFilter(), ease(), findDronePath(), finishFlight(), getActiveDrone(), moveActiveDevice(), previewMoveCost() (+2 more)

### Community 51 - "Rendering Optimization Tests"
Cohesion: 0.15
Nodes (7): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), MinHeap, Pathfinding, testWindowCost()

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.22
Nodes (5): PlaceIcon, findSouthTransitionTile(), computeTollGateLayout(), TOLLGATE_DEFAULTS, NOTE: this only PLACES the gate. The turret-firing rules during a toll run

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 60 - "TemplateMapGenerator.js"
Cohesion: 0.08
Nodes (28): AITargeting, TurretAI, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile() (+20 more)

### Community 64 - "Ground Item Management"
Cohesion: 0.07
Nodes (26): logger, PlayerContext, PlayerProvider(), NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame, log, isTurretPassableBy(), getEffectiveHour(), getLightMode() (+18 more)

### Community 65 - "Scenario Map Generation"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 66 - "Form UI Components"
Cohesion: 0.10
Nodes (9): Rabbit, AnimalSpawner, map, mockTile, npc, player, rabbit, zombie (+1 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.17
Nodes (6): getNPCType(), NPCTypes, findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem, runCycle()

### Community 70 - "Toast Notification State"
Cohesion: 0.06
Nodes (34): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toast, ToastAction, ToastActionElement (+26 more)

### Community 71 - "Carousel UI Components"
Cohesion: 0.14
Nodes (15): ZombieTooltip(), ZombieTooltipProps, DamageIntent, getZombieType(), ZombieTypes, getMeleeReach(), AISystem, getBeelineIntent() (+7 more)

### Community 73 - "World Object Spawning"
Cohesion: 0.16
Nodes (7): log, NOTE: This only moves the camera view, not any entities, PlayerSkills, INIT_STATES, isInStartArea(), ZombieReplenishmentSystem, ZombieSpawner

### Community 74 - "Map Tile Logic"
Cohesion: 0.12
Nodes (12): RarityWeights, FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, allErrors, generator (+4 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.12
Nodes (12): createItemFromDef(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), isInsideTollGate(), isFloor(), applyItemGrants(), deployDrone() (+4 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 77 - "Item Factory Methods"
Cohesion: 0.05
Nodes (19): GameMap, log, restoreEntity(), basicResult, map, mutantResult, player, windowEntity (+11 more)

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.14
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

### Community 83 - "Campfire Visibility Tests"
Cohesion: 0.12
Nodes (25): ActionSlotButton(), GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent(), InfectionHUD() (+17 more)

### Community 84 - "verify_molotov.mjs"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 85 - "context-menu.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 86 - "FurniturePlanner.js"
Cohesion: 0.10
Nodes (28): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, FURNITURE_FOOTPRINTS, HEAD_SIDE, planFurniture(), resolveRoles() (+20 more)

### Community 87 - "TurretCombat.js"
Cohesion: 0.10
Nodes (8): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, LIGHT_TERRAIN_COLORS, SPRITE_ATLAS_MAP, STEAMPUNK_TERRAIN_COLORS, TERRAIN_COLORS, TileRenderer

### Community 90 - "Weather Management System"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 91 - "apEconomy.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 92 - ".generateFromScenario"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 93 - "EntityRenderer.js"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), computeBrainstemStewTreatment(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties() (+2 more)

### Community 94 - "DevConsole.tsx"
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.17
Nodes (8): AIState, aiComp, ent, npc, player, rabbit, restored, zombie

### Community 98 - "ExplosionIntent"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 99 - "Building Hallway Tests"
Cohesion: 0.15
Nodes (3): ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 100 - "Game.tsx"
Cohesion: 0.44
Nodes (7): DEFAULT_TERRAIN_PROPS, getTerrainProps(), isTerrainDestructible(), isTerrainWalkable(), TERRAIN_PROPS, terrainBlocksSight(), EXPECTED

### Community 101 - "Table UI Components"
Cohesion: 0.16
Nodes (6): dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig, CraftingManager

### Community 106 - ".generateNextMap"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 107 - "WeatherManager"
Cohesion: 0.12
Nodes (6): DevConsole(), WeatherManager, exportScenario(), MockGameMap, testWallGapFix(), verifyRestoration()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.05
Nodes (10): CharacterCreator(), PlayerSkillsUI(), FactionRegistry, COMPONENT_NAME_BY_CTOR, DERIVED_CONDITIONS, Entity, get(), set() (+2 more)

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (13): ActionPoints, Consumable, EquippedArmor, Health, Inventory, Item, LightEmitter, MeleeWeapon (+5 more)

### Community 112 - "Electron Main Process"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.29
Nodes (3): MockMap, mockPlayer, verifySpawning()

### Community 120 - "TurretAI.js"
Cohesion: 0.70
Nodes (4): deployAndLaunch(), equipPhone(), freshBattery(), makeStowedDrone()

### Community 121 - "droneRoundTrip.test.js"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 122 - "tmp_verify_zombie_loot.js"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 123 - "EntityType"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 124 - "OTP Input Components"
Cohesion: 0.06
Nodes (49): ActionSlotButtonProps, EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps (+41 more)

### Community 126 - "droneVision.test.js"
Cohesion: 0.26
Nodes (7): collectDeviceFov(), deviceFovHashPart(), devicePos(), listAirborneDevices(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 128 - "API Query Client"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 131 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 144 - "form.tsx"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 156 - "navigation-menu.tsx"
Cohesion: 0.15
Nodes (6): DevConsoleProps, TabType, CardFooter, Input, Label, labelVariants

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

## Knowledge Gaps
- **698 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+693 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `OTP Input Components` to `Game Engine Context`, `AI and Inventory Systems`, `chart.tsx`, `Inventory and Skill Windows`, `Rabbit AI State`, `HUD and Dialog UI`, `form.tsx`, `Character and Menu Windows`, `Door`, `Action Queue Processing`, `navigation-menu.tsx`, `Sidebar UI Components`, `EventRunner`, `Loot and Layout Estimation`, `Tile Rendering and Cache`, `Turret AI Testing`, `Menubar UI Components`, `TestEntity`, `Scenario Map Generation`, `Toast Notification State`, `Carousel UI Components`, `Campfire Visibility Tests`, `context-menu.tsx`, `Weather Management System`, `.generateFromScenario`, `tmp_verify_zombie_loot.js`, `EntityType`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Project Package Metadata`, `Server and Vite Config`, `tmp_verify_zombie_loot.js`, `Turret Combat Logic`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `react` connect `Turret Combat Logic` to `AI and Inventory Systems`, `Toast Notification State`, `Crafting Manager Logic`, `External Dependencies`, `Turret AI Testing`, `Entity Spawning and Scent`, `Campfire Visibility Tests`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _713 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._
- **Should `Game Engine Context` be split into smaller, more focused modules?**
  _Cohesion score 0.047872340425531915 - nodes in this community are weakly interconnected._