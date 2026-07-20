import { BaseMapGenerator } from './BaseMapGenerator.js';

export class ScenarioMapGenerator extends BaseMapGenerator {
  constructor(scenarioData) {
    super();
    this.scenario = scenarioData;
  }

  generate(config, builder) {
    const { tiles, metadata, entities, eventTriggers, bubbleEvents, events, questRegistry, entityRegistry } = this.scenario;

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const t = tiles[y][x];
        builder.setTerrain(x, y, t.terrain);
        if (t.edgeWalls) {
          for (const edge of ['n', 'e', 's', 'w']) {
            builder.setEdgeWall(x, y, edge, t.edgeWalls[edge]);
          }
        }
        if (t.inventoryItems) {
          builder.layout[y][x].inventoryItems = t.inventoryItems;
        }
      }
    }

    if (metadata) {
      if (metadata.doors) builder.metadata.doors = metadata.doors;
      if (metadata.windows) builder.metadata.windows = metadata.windows;
      if (metadata.buildings) builder.metadata.buildings = metadata.buildings;
      if (metadata.specialBuildings) builder.metadata.specialBuildings = metadata.specialBuildings;
      if (metadata.placeIcons) builder.metadata.placeIcons = metadata.placeIcons;
      if (metadata.furniture) builder.metadata.furniture = metadata.furniture;
      if (metadata.spawnZones) builder.metadata.spawnZones = metadata.spawnZones;
      if (metadata.lowSpots) builder.metadata.lowSpots = metadata.lowSpots;
    }

    if (entities) builder.metadata.entities = entities;
    if (eventTriggers) builder.metadata.eventTriggers = eventTriggers;
    if (bubbleEvents) builder.metadata.bubbleEvents = bubbleEvents;
    // Unified GameEvent model — this is what EventRunner actually reads at
    // runtime (see QUEST_SYSTEM_PLAN.md §6); the legacy arrays above are kept
    // for back-compat with older saved maps.
    if (events) builder.metadata.events = events;
    // Switches & Variables registry (editor authoring aid) — read once at map
    // load to seed initial flag/var values (see QuestState.seedFromRegistry).
    if (questRegistry) builder.metadata.questRegistry = questRegistry;
    if (entityRegistry) builder.metadata.entityRegistry = entityRegistry;

    if (this.scenario.mapTransitions) {
      builder.metadata.mapTransitions = this.scenario.mapTransitions;
      for (const tr of this.scenario.mapTransitions) {
        builder.setTerrain(tr.x, tr.y, 'transition');
      }
    }
  }

  getStartPosition(width, height) {
    const spawn = this.scenario.metadata?.spawnZones?.playerStart?.[0];
    if (spawn) return { x: spawn.x, y: spawn.y };
    return super.getStartPosition(width, height);
  }
}
