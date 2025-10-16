
# Entity Images

This folder contains images for game entities that will be rendered on the map.

## File Naming Convention

Entity images should be named using the following pattern:
- `{entityType}.{extension}` - For basic entity types
- `{entityType}_{subtype}.{extension}` - For specific entity subtypes

## Supported File Formats

- PNG (recommended for transparency)
- JPG/JPEG
- GIF
- SVG

## Examples

### Basic Entity Types
- `player.png` - Default player character
- `zombie.png` - Default zombie
- `npc.png` - Default NPC
- `item.png` - Default item

### Item Subtypes
- `item_weapon.png` - Weapon items
- `item_food.png` - Food items
- `item_medicine.png` - Medical items
- `item_tool.png` - Tool items
- `item_ammo.png` - Ammunition

### Entity Variants
- `zombie_fast.png` - Fast zombie variant
- `zombie_bloated.png` - Bloated zombie variant
- `player_injured.png` - Injured player state

## Image Guidelines

- **Size**: 64x64 pixels recommended (will be scaled automatically)
- **Format**: PNG with transparency for best results
- **Style**: Pixel art or simple icons work best at small scales
- **Background**: Transparent background recommended

## Fallback Behavior

If an image is not found, the system will automatically fall back to the default geometric shapes:
- Player: Blue circle
- Zombie: Red circle  
- Items: Colored squares based on type
- NPCs: Green circle
- Unknown: Gray square

## Adding New Images

1. Place your image file in this folder
2. Use the correct naming convention
3. The image will be automatically loaded and cached
4. No code changes needed - the system will detect and use the image

## Performance Notes

- Images are loaded asynchronously and cached
- Common entity types are preloaded on game start
- Failed image loads are cached to avoid repeated attempts
- Clear browser cache if you update an image file
