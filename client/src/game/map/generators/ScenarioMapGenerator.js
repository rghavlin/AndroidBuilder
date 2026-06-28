import { BaseMapGenerator } from './BaseMapGenerator.js';

export class ScenarioMapGenerator extends BaseMapGenerator {
  constructor(scenarioData) {
    super();
    this.scenario = scenarioData;
  }

  generate(config, builder) {
    const { tiles, metadata, entities, eventTriggers } = this.scenario;

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
      if (metadata.spawnZones) builder.metadata.spawnZones = metadata.spawnZones;
    }

    if (entities) builder.metadata.entities = entities;
    if (eventTriggers) builder.metadata.eventTriggers = eventTriggers;
  }

  getStartPosition(width, height) {
    const spawn = this.scenario.metadata?.spawnZones?.playerStart?.[0];
    if (spawn) return { x: spawn.x, y: spawn.y };
    return super.getStartPosition(width, height);
  }
}
