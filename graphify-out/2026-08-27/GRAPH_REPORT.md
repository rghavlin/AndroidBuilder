# Graph Report - AndroidBuilder  (2026-08-27)

## Corpus Check
- 562 files · ~7,278,211 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3396 nodes · 9304 edges · 188 communities (131 shown, 57 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bacc68cf`
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
- CombatResolver
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
- MapBuilder.js
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
- .pos
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
- DecorationPlanner.js
- Crafting Recipe Verification
- PhoneWindow.tsx
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
- JournalUI.tsx
- context-menu.tsx
- FurniturePlanner.js
- MusicManager
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
- .isEdgeBlocked
- EarbucksShopSystem
- verify_firefighter_spawn.js
- toggle-group.tsx
- toggle-group.tsx
- runContainerTests
- context-menu.tsx
- Logger
- TileChunkCache
- JournalUI.tsx
- lineOfSight.test.js
- TurretAI.js
- MoveIntent
- apEconomy.js
- rcVehicleMovement.test.js
- rcVehicle.test.js
- addItemToPlayer.test.js
- beltSearch.test.js
- toggle-group.tsx
- .executeAction
- ._processCurrentStep
- apEconomy.js
- npcAttackOnSight.test.js
- ExplosionSystem.js
- verify_road_template_p3_09.mjs
- File Integrity Checks
- Zombie Bleeding Logic
- TestEntity.js
- ._restoreTilesAndEntities
- log
- verify_loot_constraints.js
- npcLoadout.test.js
- .generateFromScenario
- Image Cropping Scripts
- MockGameMap
- index.js
- DialogOverlay.tsx
- migrateEvents.js
- NPM Configuration Testing
- stairsTransition.test.js
- bench_houses.mjs
- Electron Preload Script
- Quadrant
- mapRestoreParity.test.js
- test_noise.js
- Firestation Layout Verification
- Special Window Layouts
- Vite Electron Configuration
- .addEntity
- test_noise_assert.js
- tmp_verify_loot.js
- tmp_verify_loot_summary.js
- test_noise.js
- test_noise_assert.js
- verify_saveload.mjs
- TestMapBuilder
- Drone
- corridorGenerator.test.js
- .generateFromScenario
- MapMetadata.js
- npcLoadout.test.js
- verify_army_tent.js
- tmp_verify_fix.js

## God Nodes (most connected - your core abstractions)
1. `createItemFromDef()` - 177 edges
2. `Item` - 149 edges
3. `cn()` - 124 edges
4. `GameMap` - 109 edges
5. `engine` - 92 edges
6. `Entity` - 87 edges
7. `InventoryManager` - 85 edges
8. `gameRandom` - 64 edges
9. `GameHarness` - 53 edges
10. `useInventory()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `GameMapProvider()` --indirect_call--> `newMap()`  [INFERRED]
  client/src/contexts/GameMapContext.jsx → test/quest/mapEnterEvents.test.js
- `makeVehicle()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/balance/wagonDrag.test.js → client/src/game/inventory/ItemDefs.js
- `make()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/inventory/groundPriority.test.js → client/src/game/inventory/ItemDefs.js
- `flyDrone()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/phone/phoneTurn.test.js → client/src/game/inventory/ItemDefs.js
- `arm()` --calls--> `createItemFromDef()`  [EXTRACTED]
  test/quest/attackEntityStep.test.js → client/src/game/inventory/ItemDefs.js

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

## Communities (188 total, 57 thin omitted)

### Community 0 - "traits.js"
Cohesion: 0.11
Nodes (25): drawImprovedCursor(), lastRainUpdate, MapCanvas(), playerRenderScratch, rainParticles, NOTE: PLACE_ICON and ITEM are intentionally excluded., renderRain(), warnedMalformedEntityIds (+17 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (37): ARCHETYPES, BUNGALOW_2BED_LARGE, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_EXTRA_WIDE, BUNGALOW_3BED_WIDE, BY_SIZE, CENTER_HALL_12, CENTER_HALL_14 (+29 more)

### Community 4 - "AI and Inventory Systems"
Cohesion: 0.09
Nodes (38): BarterWindow(), BarterWindowProps, EarbucksShopWindow(), InventoryPanel(), TollWindow(), TollWindowProps, BackpackGrid(), CampfireUI() (+30 more)

### Community 5 - "NPC AI Behavior"
Cohesion: 0.19
Nodes (5): applyNpcAIMode(), log, cureInfection(), infectPlayer(), runCycle()

### Community 6 - "Action Intent System"
Cohesion: 0.14
Nodes (25): RcVehicleConfig, clearOrder(), estimateTurns(), getOrder(), getOrders(), restoreOrders(), serializeOrders(), setDestination() (+17 more)

### Community 7 - "CombatResolver"
Cohesion: 0.23
Nodes (4): CharacterCreator(), PlayerSkillsUI(), CombatResolver, fireManyAtLongRange()

### Community 8 - "Tooltip Components"
Cohesion: 0.05
Nodes (35): DestroyIntent, NoiseEvent, IntentQueue, SimulationManager, DestructionSystem, ExplosionSystem, FireSystem, MovementSystem (+27 more)

### Community 9 - "Entity Component System"
Cohesion: 0.31
Nodes (6): beginTween(), ease(), endTween(), settleTween(), tweenAlongPath(), PATH

### Community 10 - "Item Metadata and Traits"
Cohesion: 0.06
Nodes (49): btnStyle(), CONDITION_KIND_OPTIONS, ConditionListEditor(), ConditionRow(), emptyCondition(), emptyReward(), emptyStep(), EventWindow() (+41 more)

### Community 11 - "External Dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion, @hookform/resolvers (+45 more)

### Community 12 - "Inventory and Skill Windows"
Cohesion: 0.20
Nodes (14): DroneConfig, isTerrainWalkable(), droneEntityFilter(), findDronePath(), finishFlight(), moveActiveDevice(), previewMoveCost(), canAffordFlight() (+6 more)

### Community 13 - "Entity and Item Types"
Cohesion: 0.06
Nodes (28): BuildingTooltip(), BuildingTooltipProps, CropTooltip(), CropTooltipProps, DoorTooltip(), DoorTooltipProps, DroneTooltip(), DroneTooltipProps (+20 more)

### Community 14 - "Rabbit AI State"
Cohesion: 0.15
Nodes (7): DEFAULT_SHOP_CATALOG, MAP_1_CATALOG, MAP_2_CATALOG, SHOP_CATALOG_BY_MAP, EMPTY_CATALOG, AnimalSpawner, NPCSpawner

### Community 15 - "HUD and Dialog UI"
Cohesion: 0.05
Nodes (38): Container, CraftingRecipes, engine, NOTE: equipItem intentionally has NO "Items inside" guard (unlike moveItem)., _warnedCatchAllProps, ItemDefs, TODO: art — shares rcreceiver.png until autonomouscontroller.png exists., getMeterPercent() (+30 more)

### Community 16 - "Shop and Pricing Config"
Cohesion: 0.12
Nodes (7): EarbucksShopWindowProps, ShopItemRow(), ShopItemRowProps, debugLog(), ImageLoader, TILESET_MISSING_TERRAINS, useItemImage()

### Community 17 - "Entity Spawning and Scent"
Cohesion: 0.09
Nodes (26): AttributeCard(), AttributeCardProps, CompactSkillRow(), CompactSkillRowProps, SkillProgressBar(), SkillProgressBarProps, FloatingContainerOverlay(), FloatingContainerOverlayProps (+18 more)

### Community 18 - "Map Template Generation"
Cohesion: 0.08
Nodes (9): ActionPoints, EquippedArmor, DERIVED_CONDITIONS, ITEM_SERIALIZED_FIELDS, NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to, NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see, SERIALIZED_FIELDS, SequencerAction (+1 more)

### Community 19 - "Character and Menu Windows"
Cohesion: 0.13
Nodes (26): CharacterCreatorProps, StatAdjusterCardProps, CharacterRegistryWindow(), CharacterRegistryWindowProps, CreditsWindow(), CreditsWindowProps, DefeatDialog(), HelpWindow() (+18 more)

### Community 20 - "Game Map Management"
Cohesion: 0.16
Nodes (11): args, base, rows, runs, scenario, secs, startSeed, summary (+3 more)

### Community 21 - "World Progression and Spawning"
Cohesion: 0.15
Nodes (7): doorsForBuilding(), floodFill(), PLAYER_FLOOD_OPTS, validateConnectivity(), MinHeap, Pathfinding, testWindowCost()

### Community 22 - "Game Initialization Manager"
Cohesion: 0.13
Nodes (13): CATEGORY_PRICES, field(), FLAT_PRICES, FREE_ITEMS, getItemPrice(), hasCategory(), hasTrait(), healValue() (+5 more)

### Community 23 - "Door"
Cohesion: 0.18
Nodes (12): DamageIntent, getZombieType(), getMeleeReach(), AISystem, getBeelineIntent(), getGreedyHuntIntent(), huntPlayer(), investigate() (+4 more)

### Community 24 - "Turret Combat Logic"
Cohesion: 0.11
Nodes (3): TemplateMapGenerator, verifyRandomBuildings(), generator

### Community 26 - "Action Queue Processing"
Cohesion: 0.19
Nodes (20): PhoneWindow(), canTogglePhonePower(), ensurePhone(), getPhone(), phoneBlockedReason(), phoneCharges(), phoneOnline(), setPhonePower() (+12 more)

### Community 27 - "useGame"
Cohesion: 0.07
Nodes (26): LootProgression, MapProgression, TEMPLATE_METADATA, dropZombieDeathLoot(), getBrainstemColor(), getBrainstemStewColors(), getCorpseOverrides(), ZombieCorpseConfig (+18 more)

### Community 28 - "MapBuilder.js"
Cohesion: 0.11
Nodes (16): MAP_GEN_CONFIG, BuildingTypes, isSpecialBuilding(), SPECIAL_BUILDING_SPECS, FLOORPLAN_FOOTPRINTS, FLOORPLANS, orientFloorplan(), rotateFloorplan() (+8 more)

### Community 29 - "Sidebar UI Components"
Cohesion: 0.06
Nodes (37): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+29 more)

### Community 31 - "EventRunner"
Cohesion: 0.23
Nodes (8): collectDeviceFov(), deviceFovHashPart(), devicePos(), visionSources(), addWagon(), DRONE_POS, NEAR_DRONE, PLAYER_POS

### Community 33 - "Options and Crafting UI"
Cohesion: 0.33
Nodes (8): FloatingContainer(), FloatingContainerProps, GridSlotSizeConfig, useGridSlotSize(), getScaleFactor(), getScaleMode(), useWindowSize(), WindowSize

### Community 34 - "Camera Viewport Control"
Cohesion: 0.10
Nodes (3): Camera, log, NOTE: This only moves the camera view, not any entities

### Community 36 - "Loot and Layout Estimation"
Cohesion: 0.23
Nodes (11): bundledScenarioDir, createWindow(), __dirname, __filename, getMimeType(), hardenWindow(), mimeTypes, resolveScenarioForRead() (+3 more)

### Community 37 - "Road and Town Generation"
Cohesion: 0.30
Nodes (10): applyEnergyApCap(), applySurvivalCascade(), deriveSecondaryStats(), maxApBonusFromAttributes(), maxHpFromAttributes(), previewDerivedStats(), sicknessPenalties(), STEW_ATTRS (+2 more)

### Community 39 - "Tile Rendering and Cache"
Cohesion: 0.08
Nodes (54): ActionSlotButton(), ActionSlotButtonProps, GameControls(), GameControlsProps, STAT_COLORS, StatBar, StatBarProps, GameScreenContent() (+46 more)

### Community 41 - "Map Editor Tools"
Cohesion: 0.08
Nodes (45): emptyEntityRegistry(), emptyEvent(), emptyQuestRegistry(), LegacyDialogStep, downconvertEvents(), btnStyle(), BubbleEvent, BubbleLine (+37 more)

### Community 43 - "Crafting Manager Logic"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Asset Image Loader"
Cohesion: 0.10
Nodes (12): AIState, PlayerSkills, onItemCrafted(), recordDefense(), recordHit(), aiComp, ent, npc (+4 more)

### Community 46 - "Turret AI Testing"
Cohesion: 0.13
Nodes (9): inputContent, runInspector(), compressString(), decompressString(), DEFAULT_PLAYER_STATS, GameSaveSystem, idbStore, runDebug() (+1 more)

### Community 48 - "Build and Dev Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, cross-env, electron, electron-builder, esbuild, postcss, @replit/vite-plugin-cartographer (+13 more)

### Community 49 - "DevConsole.tsx"
Cohesion: 0.21
Nodes (6): LineOfSight, logger, Quadrant, slope(), test(), los()

### Community 50 - "Window and Door Interaction"
Cohesion: 0.42
Nodes (8): buildMarker(), computeDesiredMarkers(), isMarker(), log, purgeOrphanMarkers(), reconcileTile(), syncEventMarkers(), resolveMapEvents()

### Community 51 - ".pos"
Cohesion: 0.14
Nodes (4): PlayerCombatSystem, ENEMY_TYPES, GameHarness, NOTE: GameHarness drives the global engine/gameRandom singletons, so only

### Community 52 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, checkJs, esModuleInterop, incremental, jsx (+12 more)

### Community 53 - "Developer Console UI"
Cohesion: 0.06
Nodes (36): createItemFromDef(), synthesizeZombieVirusCure(), getFoodRejectionChance(), LootGenerator, isInsideAnyBuilding(), applyItemGrants(), equipBackpack(), makeItem() (+28 more)

### Community 55 - "pagination.tsx"
Cohesion: 0.10
Nodes (27): EarbucksDisplay(), GameEventLog(), GameEventLogProps, getLogColor(), getLogColor(), LogHistoryWindow(), LogHistoryWindowProps, MenuButtonDef (+19 more)

### Community 56 - "Menubar UI Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 57 - "Entity Serialization Tests"
Cohesion: 0.19
Nodes (8): formatTimestamp(), LoadGameWindow(), MainMenuWindow(), OptionsWindow(), formatTimestamp(), SaveGameWindow(), StartMenu(), IndexedDBStore

### Community 58 - "Audio Management System"
Cohesion: 0.19
Nodes (10): args, config, secs, seeds, startSeed, t0, fuzzSeed(), OP (+2 more)

### Community 59 - "UI Framework Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 61 - "MapBuilder.js"
Cohesion: 0.14
Nodes (4): GameInitializationManager, MockMap, mockPlayer, verifySpawning()

### Community 62 - "DecorationPlanner.js"
Cohesion: 0.16
Nodes (12): BUILTIN_FACTIONS, BUILTIN_STANCES, builtinStanceValue(), cloneStances(), deltaKeys, DISPOSITION, DISPOSITIONS, FACTIONS (+4 more)

### Community 64 - "PhoneWindow.tsx"
Cohesion: 0.19
Nodes (12): BATTERY_SLOT, DeviceList(), deviceName(), deviceStatus(), MessageReader(), PhoneAppIcon(), PhoneScreen, PhoneScreenContent() (+4 more)

### Community 66 - "Form UI Components"
Cohesion: 0.09
Nodes (9): DevConsole(), Burnable, Rabbit, map, mockTile, npc, player, rabbit (+1 more)

### Community 68 - "Road Generation Logic"
Cohesion: 0.18
Nodes (4): DevConsoleProps, DevConsoleShopManager(), TabType, CardFooter

### Community 70 - "Toast Notification State"
Cohesion: 0.19
Nodes (14): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+6 more)

### Community 72 - "Toast UI Components"
Cohesion: 0.11
Nodes (7): isGroundPriority(), isPinnedInPlace(), runContainerTests(), runTest(), testResults, KNOWN_FAILURES, results

### Community 73 - "World Object Spawning"
Cohesion: 0.21
Nodes (14): DRONE_ITEM_DEF_IDS, isRemoteDevice(), FIRESTARTER_DEF_IDS, frameRenderFlags, getDominantItemCached(), getDominantItemInTile(), getTileIconRank(), getTileItemsCached() (+6 more)

### Community 74 - "Map Tile Logic"
Cohesion: 0.35
Nodes (11): FactionRegistry, escalateFactionAgainstPlayer(), factionOf(), getAttackableTurretOnTile(), getCarriedPoweredTurret(), getExposedTurretTargets(), getPoweredTurretOnTile(), isPoweredTurret() (+3 more)

### Community 75 - "Map Serialization Tests"
Cohesion: 0.45
Nodes (11): applyHitProgression(), lx(), ly(), NOOP_UI, performMeleeAttack(), performRangedAttack(), processEntityKill(), provokeAndWarn() (+3 more)

### Community 76 - "App Routing and Scaling"
Cohesion: 0.08
Nodes (7): EntityType, GarageDoor, PlaceIcon, NOTE: Structural damage (hp reduction, break/open flags) was already, ENTITY_RESTORERS, buildMap(), mapWithEdgeWindow()

### Community 77 - "Item Factory Methods"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 78 - "Item Movement Logic"
Cohesion: 0.21
Nodes (12): BUDGET_PATH, countLines(), GOD_OBJECTS, measureAll(), readBudget(), REPO_ROOT, actual, existing (+4 more)

### Community 79 - ".executeTransition"
Cohesion: 0.33
Nodes (6): btnStyle(), inputStyle, LootAmount, LootGeneratorModal(), LootGeneratorModalProps, LootGeneratorMode

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
Cohesion: 0.29
Nodes (13): applyKnob(), ATTR_KNOBS, avg(), cloneScenario(), configurePlayerVitals(), livingZombies(), nearest(), pct() (+5 more)

### Community 84 - "JournalUI.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 85 - "context-menu.tsx"
Cohesion: 0.07
Nodes (21): getProgressionForMap(), EntityFactory, engine, INIT_STATES, NOTE: do NOT force itemsModified for every container/attachment item., isInsideCompound(), isInsideTollGate(), isInStartArea() (+13 more)

### Community 87 - "MusicManager"
Cohesion: 0.12
Nodes (14): OptionsWindowProps, CraftingCategory, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+6 more)

### Community 92 - ".generateFromScenario"
Cohesion: 0.21
Nodes (9): hashLocation(), hashNavigate(), useHashLocation(), ScreenScaler(), ScreenScalerProps, Toaster(), ThemeProvider(), GamePage() (+1 more)

### Community 93 - "EntityRenderer.js"
Cohesion: 0.40
Nodes (5): btnStyle(), DecorationGeneratorConfig, DecorationGeneratorModal(), DecorationGeneratorModalProps, inputStyle

### Community 96 - "Project Package Metadata"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, optionalDependencies, bufferutil, type (+1 more)

### Community 97 - "MapConnectivityValidator.js"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 98 - "TollGateSystem"
Cohesion: 0.14
Nodes (18): MapTransitionDialogProps, NPCDemandDialogProps, TutorialEndDialog(), TutorialEndDialogProps, Command, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 99 - "Building Hallway Tests"
Cohesion: 0.50
Nodes (4): btnStyle(), inputStyle, ZombieGeneratorModal(), ZombieGeneratorModalProps

### Community 100 - "ConfigManager"
Cohesion: 0.29
Nodes (4): ScenarioPickerWindow(), electronStorage, idbStorage, ScenarioStorage

### Community 104 - ".runTurn"
Cohesion: 0.07
Nodes (26): CorridorLootGenerator, spawnLabBuildingLoot(), FOOD_SCARCITY, LOOT_CONSTANTS, MAP_WIDE_REQUIREMENTS, SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, isAllRoad() (+18 more)

### Community 107 - "WeatherManager"
Cohesion: 0.31
Nodes (6): gridItems(), hasItemsInside(), chargerContents(), makeTurret(), makeWagonCarrying(), nestedAmmo()

### Community 108 - "Seeded Random Utilities"
Cohesion: 0.07
Nodes (3): Entity, get(), set()

### Community 110 - "React Error Boundaries"
Cohesion: 0.25
Nodes (3): GameErrorBoundary, Props, State

### Community 111 - "npcAttackOnSight.test.js"
Cohesion: 0.05
Nodes (18): AIBehavior, Consumable, Health, Inventory, InventoryContainer, Item, LightEmitter, MeleeWeapon (+10 more)

### Community 113 - "EarbucksShopSystem"
Cohesion: 0.03
Nodes (76): EquipmentSlot, EquipmentSlotProps, SLOT_INFO, GridSlot, GridSlotProps, ItemTooltip(), ItemTooltipProps, getAdjustedBgColor() (+68 more)

### Community 114 - "verify_firefighter_spawn.js"
Cohesion: 0.27
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 115 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 116 - "toggle-group.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 118 - "context-menu.tsx"
Cohesion: 0.22
Nodes (7): apValues, arenaSeed, args, configs, referenceDistance, rows, searchCostPerStop

### Community 120 - "TileChunkCache"
Cohesion: 0.10
Nodes (7): TileChunkCache, BW_TERRAIN_COLORS, GRASS_VARIANTS, NOTE: the map is deliberately theme-independent — the UI theme never changes, SPRITE_ATLAS_MAP, TERRAIN_COLORS, TileRenderer

### Community 121 - "JournalUI.tsx"
Cohesion: 0.31
Nodes (5): AITargeting, TurretAI, removeDestroyedTurret(), hydratedGridItems(), TurretSystem

### Community 122 - "lineOfSight.test.js"
Cohesion: 0.52
Nodes (4): compare(), evalAll(), evalCondition(), isEventActive()

### Community 123 - "TurretAI.js"
Cohesion: 0.25
Nodes (5): hasCorner, map, MockGameMap, outOfRange, visible

### Community 124 - "MoveIntent"
Cohesion: 0.43
Nodes (5): EDITOR_GENERATOR_CHOICES, EDITOR_TEMPLATE_CHOICES, FIXED_TEMPLATE_ASSIGNMENTS, getTemplateForMapNumber(), POST_MAP_7_CYCLE

### Community 125 - "apEconomy.js"
Cohesion: 0.25
Nodes (7): door, engineMock, map, moveIntent, player, z1, z2

### Community 126 - "rcVehicleMovement.test.js"
Cohesion: 0.32
Nodes (6): attachmentGrids(), consumeItemRecursive(), countItemRecursive(), findStackRecursive(), nestedGrids(), ownGrids()

### Community 127 - "rcVehicle.test.js"
Cohesion: 0.29
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 128 - "addItemToPlayer.test.js"
Cohesion: 0.22
Nodes (8): canSeeBlocked, canSeeWindow, map, player, resultBlocked, resultWindow, windowEntity, zombie

### Community 129 - "beltSearch.test.js"
Cohesion: 0.25
Nodes (7): basicResult, map, mutantResult, player, windowEntity, zombieBasic, zombieMutant

### Community 131 - ".executeAction"
Cohesion: 0.23
Nodes (3): debugLog(), TurnManager, CombatSystem

### Community 132 - "._processCurrentStep"
Cohesion: 0.14
Nodes (15): Drone, consumeDeployCharge(), getRcVehicle(), isWagon(), listRcVehicles(), hasReceiver(), canOperate(), deploy() (+7 more)

### Community 135 - "ExplosionSystem.js"
Cohesion: 0.29
Nodes (3): makeVehicle(), MOTOR_PAIRS, penalty()

### Community 137 - "verify_road_template_p3_09.mjs"
Cohesion: 0.33
Nodes (3): InventoryExtensionWindow(), InventoryExtensionWindowProps, LeftPanelWindowProps

### Community 138 - "File Integrity Checks"
Cohesion: 0.40
Nodes (4): content, fs, lines, path

### Community 140 - "TestEntity.js"
Cohesion: 0.22
Nodes (6): getNPCType(), NPCTypes, findSouthTransitionTile(), findAttackSlotPath(), isMeleeAttackPosition(), NPCAISystem

### Community 142 - "log"
Cohesion: 0.40
Nodes (4): applyMapRegistries(), hasScenario, loadScenario(), SCENARIO

### Community 143 - "verify_loot_constraints.js"
Cohesion: 0.71
Nodes (5): compareVitals(), makeOpenArena(), maxScavengeRadius(), stopsAtDistance(), walkCost()

### Community 144 - "npcLoadout.test.js"
Cohesion: 0.33
Nodes (7): DECORATION_DENSITIES, getDecorationCategory(), INDOOR_DECORATIONS, isInsideCompound(), OUTDOOR_DECORATIONS, planDecorations(), ROAD_DECORATIONS

### Community 145 - ".generateFromScenario"
Cohesion: 0.15
Nodes (18): clearOfOccupied(), contactSides(), footprintPlaceable(), FURNISH_PLAN, HEAD_SIDE, planFurniture(), resolveRoles(), ringOpenness() (+10 more)

### Community 147 - "MockGameMap"
Cohesion: 0.22
Nodes (4): generator, indoorMap, MockGameMap, outdoorMap

### Community 149 - "DialogOverlay.tsx"
Cohesion: 0.48
Nodes (6): buildScriptedAttackAction(), LIVING_TARGETS, log, performScriptedAttack(), resolveAttackMode(), resolveScriptedDeath()

### Community 150 - "migrateEvents.js"
Cohesion: 0.26
Nodes (3): LabMapGenerator, LAYOUT, testLabGen()

### Community 152 - "stairsTransition.test.js"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 153 - "bench_houses.mjs"
Cohesion: 0.21
Nodes (9): assignRoles(), classifyShape(), DIRS, edgeBlocked(), findRooms(), interiorBounds(), makeGameMapGrid(), roleOf() (+1 more)

### Community 156 - "mapRestoreParity.test.js"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 170 - "test_noise_assert.js"
Cohesion: 0.60
Nodes (4): migrateBubbleEvent(), migrateDialogTrigger(), migrateLegacyEvents(), REPRESENTABLE_LEGACY_STEP_TYPES

### Community 172 - "tmp_verify_loot_summary.js"
Cohesion: 0.38
Nodes (4): getPoweredTurretForEntity(), showsAsPoweredTurret(), make(), makeTurret()

### Community 175 - "verify_saveload.mjs"
Cohesion: 0.60
Nodes (3): deployAndLaunch(), equipPhone(), freshBattery()

### Community 176 - "TestMapBuilder"
Cohesion: 0.36
Nodes (3): printHouse(), runTests(), TestMapBuilder

### Community 182 - "MapMetadata.js"
Cohesion: 0.40
Nodes (3): PERSISTED_KEYS, pickPersistedMetadata(), restoreMapMetadata()

### Community 188 - "tmp_verify_fix.js"
Cohesion: 0.50
Nodes (3): generator, layout, mapData

## Knowledge Gaps
- **720 isolated node(s):** `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps`, `BuildingTooltipProps`, `CharacterCreatorProps` (+715 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `EarbucksShopSystem` to `AI and Inventory Systems`, `Entity and Item Types`, `Shop and Pricing Config`, `Entity Spawning and Scent`, `Character and Menu Windows`, `stairsTransition.test.js`, `Action Queue Processing`, `mapRestoreParity.test.js`, `Sidebar UI Components`, `Options and Crafting UI`, `Tile Rendering and Cache`, `Crafting Manager Logic`, `pagination.tsx`, `Menubar UI Components`, `Crafting Recipe Verification`, `PhoneWindow.tsx`, `JournalUI.tsx`, `MusicManager`, `MapConnectivityValidator.js`, `TollGateSystem`, `verify_firefighter_spawn.js`, `toggle-group.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `react` connect `rcVehicle.test.js` to `traits.js`, `AI and Inventory Systems`, `Toast Notification State`, `Tile Rendering and Cache`, `External Dependencies`, `Entity Serialization Tests`, `.generateFromScenario`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `createItemFromDef()` connect `Developer Console UI` to `Item Interaction Logic`, `AI and Inventory Systems`, `._processCurrentStep`, `Action Intent System`, `ExplosionSystem.js`, `Tooltip Components`, `Inventory and Skill Windows`, `Entity and Item Types`, `Rabbit AI State`, `HUD and Dialog UI`, `MockGameMap`, `Game Initialization Manager`, `Turret Combat Logic`, `bench_houses.mjs`, `Action Queue Processing`, `useGame`, `EventRunner`, `Container Grid Logic`, `Tile Rendering and Cache`, `Map Editor Tools`, `toast.tsx`, `tmp_verify_loot_summary.js`, `test_noise.js`, `Asset Image Loader`, `verify_saveload.mjs`, `Window and Door Interaction`, `.pos`, `.addEntity`, `npcLoadout.test.js`, `World Object Spawning`, `Map Serialization Tests`, `context-menu.tsx`, `Weapon Attachment Logic`, `Table UI Components`, `.runTurn`, `LineOfSight.js`, `WeatherManager`, `EarbucksShopSystem`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `inputContent`, `ActionSlotButtonProps`, `BarterWindowProps` to the rest of the system?**
  _736 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traits.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._
- **Should `Item Interaction Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05341614906832298 - nodes in this community are weakly interconnected._