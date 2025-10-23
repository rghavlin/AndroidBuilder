import React, { useState, useRef, useEffect } from 'react';
import { X, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Item } from '../../game/entities/TestEntity.js';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';

const DevConsole = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  
  // Phase 4: Direct sub-context access for debugging data
  const { playerRef, playerStats } = usePlayer();
  const { gameMapRef, worldManagerRef } = useGameMap();
  const { cameraRef } = useCamera();
  const { turn, isPlayerTurn, isInitialized } = useGame();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addToConsole = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setHistory(prev => [...prev, { message, type, timestamp }]);
  };

  const executeCommand = async (command) => {
    addToConsole(`> ${command}`, 'command');

    const parts = command.toLowerCase().trim().split(' ');
    const mainCommand = parts[0];
    const subCommand = parts[1];

    try {
      switch (mainCommand) {
        case 'help':
          addToConsole('Available commands:', 'info');
          addToConsole('  help - Show this help message', 'info');
          addToConsole('  clear - Clear console', 'info');
          addToConsole('  game status - Show game status', 'info');
          addToConsole('  inventory test - Run inventory tests', 'info');
          addToConsole('  inventory demo - Run inventory demo', 'info');
          addToConsole('  entity spawn <type> - Spawn an entity', 'info');
          addToConsole('  entity list - List all entities', 'info');
          addToConsole('• demo - Run Phase 3 inventory demo (Equipment & Dynamic Containers)', 'log');
          addToConsole('• ground/phase4 - Run Phase 4 ground management demo', 'log');
          break;

        case 'clear':
          setHistory([]);
          break;

        case 'game':
          if (subCommand === 'status') {
            if (isInitialized && playerRef.current) {
              const player = playerRef.current;
              const gameMap = gameMapRef.current;
              const worldManager = worldManagerRef.current;
              const camera = cameraRef.current;
              
              addToConsole(`Player: ${player.id} at (${player.x}, ${player.y})`, 'info');
              addToConsole(`Current Map: ${worldManager?.currentMapId || 'unknown'}`, 'info');
              addToConsole(`Map Size: ${gameMap ? `${gameMap.width}x${gameMap.height}` : 'unknown'}`, 'info');
              addToConsole(`Turn: ${turn}`, 'info');
              addToConsole(`Player Turn: ${isPlayerTurn ? 'Yes' : 'No'}`, 'info');
              addToConsole(`HP: ${playerStats.hp}/${playerStats.maxHp}`, 'info');
              addToConsole(`AP: ${playerStats.ap}/${playerStats.maxAp}`, 'info');
              addToConsole(`Camera: (${camera ? `${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}` : 'null'})`, 'info');
              addToConsole(`Zoom: ${camera ? camera.zoomLevel.toFixed(2) : 'unknown'}`, 'info');
              
              // Entity counts
              if (gameMap) {
                const zombies = gameMap.getEntitiesByType('zombie');
                const items = gameMap.getEntitiesByType('item');
                const npcs = gameMap.getEntitiesByType('npc');
                addToConsole(`Entities: ${zombies.length} zombies, ${items.length} items, ${npcs.length} NPCs`, 'info');
              }
            } else {
              addToConsole('Game not initialized or player not available', 'error');
            }
          } else {
            addToConsole('Unknown game command. Try: game status', 'error');
          }
          break;

        case 'inventory':
        case 'inv':
          switch (subCommand) {
            case 'test':
              try {
                if (typeof window.runContainerTests === 'function') {
                  addToConsole('Running container tests...', 'info');
                  const results = window.runContainerTests();

                  // Results are string messages, parse them
                  if (Array.isArray(results)) {
                    results.forEach(result => {
                      if (typeof result === 'string') {
                        const isPass = result.includes('PASSED');
                        const status = isPass ? '✅' : '❌';
                        const message = result.replace('✅ ', '').replace('❌ ', '');
                        addToConsole(`${status} ${message}`, isPass ? 'success' : 'error');
                      }
                    });

                    const passed = results.filter(r => r.includes('PASSED')).length;
                    const total = results.length;
                    addToConsole(`Tests completed: ${passed}/${total} passed`, passed === total ? 'success' : 'error');
                  } else {
                    addToConsole('Test results format unexpected', 'error');
                  }
                } else {
                  addToConsole('Container tests not available', 'error');
                }
              } catch (error) {
                addToConsole(`Test execution failed: ${error.message}`, 'error');
              }
              break;

            case 'demo':
              try {
                // Import inventory classes for demonstration (avoiding name conflict with TestEntity Item)
                const InventoryModule = await import('../../game/inventory/index.js');
                const { Item: InventoryItem, Container, InventoryManager, createWeapon, createArmor, createAttachment, createItem, createAmmo, createMedical } = InventoryModule;

                // Make classes globally available for the demo
                window.InventoryItem = InventoryItem;
                window.Container = Container;

                addToConsole('Creating Phase 3 demo - Equipment & Dynamic Containers...', 'info');

                // Create inventory manager
                const manager = new InventoryManager();

                // Create equipment items
                const rifle = createWeapon('rifle', {
                  id: 'demo-rifle',
                  name: 'Tactical Rifle',
                  attachmentSlots: [
                    { name: 'muzzle', compatibleTypes: ['suppressor', 'compensator'] },
                    { name: 'optic', compatibleTypes: ['scope', 'red-dot'] },
                    { name: 'rail', compatibleTypes: ['flashlight', 'laser'] }
                  ]
                });

                const vest = createArmor('vest', {
                  id: 'demo-vest',
                  name: 'Tactical Vest',
                  containerGrid: { width: 4, height: 2 }
                });

                const backpack = createItem('container', 'backpack', {
                  id: 'demo-backpack',
                  name: 'Military Backpack',
                  width: 3,
                  height: 4,
                  equippableSlot: 'backpack',
                  containerGrid: { width: 8, height: 10 }
                });

                // Create attachments
                const suppressor = createAttachment('suppressor', {
                  id: 'demo-suppressor',
                  name: 'Sound Suppressor'
                });

                const scope = createAttachment('scope', {
                  id: 'demo-scope',
                  name: '4x Scope',
                  width: 2,
                  height: 1
                });

                // Demonstrate equipment system
                addToConsole('Equipping items...', 'info');

                const rifleResult = manager.equipItem(rifle);
                const vestResult = manager.equipItem(vest);
                const backpackResult = manager.equipItem(backpack);

                addToConsole(`Rifle equipped: ${rifleResult.success}`, 'info');
                addToConsole(`Vest equipped: ${vestResult.success}`, 'info');
                addToConsole(`Backpack equipped: ${backpackResult.success}`, 'info');

                // Demonstrate dynamic containers
                const containers = manager.getAllContainers();
                const dynamicContainers = containers.filter(c => c.type === 'dynamic-pocket' || c.type === 'equipped-backpack');
                addToConsole(`Dynamic containers created: ${dynamicContainers.length}`, 'info');

                dynamicContainers.forEach(container => {
                  addToConsole(`  - ${container.name}: ${container.width}x${container.height}`, 'info');
                });

                // Demonstrate firearm attachments
                addToConsole('Adding weapon attachments...', 'info');

                const suppressorResult = rifle.addAttachment('muzzle', suppressor);
                const scopeResult = rifle.addAttachment('optic', scope);

                addToConsole(`Suppressor attached: ${suppressorResult.success}`, 'info');
                addToConsole(`Scope attached: ${scopeResult.success}`, 'info');

                const attachmentCount = rifle.attachments.size;
                addToConsole(`Total attachments on rifle: ${attachmentCount}`, 'info');

                // Add some items to containers
                addToConsole('Adding items to containers...', 'info');

                const ammo = createAmmo('5.56mm', 30, {
                  id: 'demo-ammo',
                  stackMax: 50
                });

                const medkit = createMedical('bandage', 5, {
                  id: 'demo-medkit',
                  stackMax: 10
                });

                const ammoResult = manager.addItem(ammo);
                const medkitResult = manager.addItem(medkit);

                addToConsole(`Ammo stored in: ${ammoResult.container}`, 'info');
                addToConsole(`Medkit stored in: ${medkitResult.container}`, 'info');

                // Demonstrate serialization
                addToConsole('Testing serialization...', 'info');
                const serialized = manager.toJSON();
                const restored = InventoryManager.fromJSON(serialized);

                const restoredRifle = restored.equipment.rifle;
                const restoredAttachments = restoredRifle ? restoredRifle.attachments.size : 0;
                addToConsole(`Serialization test: ${restoredAttachments} attachments restored`, 'info');

                // Make demo available globally
                window.inventoryManager = manager;
                window.inventoryDemo = manager.getBackpackContainer();
                addToConsole('Phase 3 demo complete!', 'success');
                addToConsole('Manager available as window.inventoryManager', 'info');
                addToConsole('Backpack container available as window.inventoryDemo', 'info');

                // Show summary
                const totalItems = manager.getTotalItemCount();
                const equippedItems = Object.values(manager.getEquippedItems()).length;
                addToConsole(`Summary: ${totalItems} total items, ${equippedItems} equipped`, 'info');

              } catch (error) {
                addToConsole(`Error in Phase 3 demo: ${error.message}`, 'error');
                console.error('Phase 3 Demo Error:', error);
              }
              break;

            default:
              addToConsole('Unknown inventory command. Try: inventory test, inventory demo', 'error');
          }
          break;

        case 'entity':
          if (subCommand === 'spawn') {
            const entityType = parts[2];
            if (entityType) {
              const newEntity = new Item({
                id: `console-${entityType}-${Date.now()}`,
                type: entityType,
                x: 10,
                y: 10
              });
              addToConsole(`Spawned ${entityType} entity with ID: ${newEntity.id}`, 'success');
            } else {
              addToConsole('Please specify entity type to spawn', 'error');
            }
          } else if (subCommand === 'list') {
            addToConsole('Entity list command not implemented yet', 'info');
          } else {
            addToConsole('Unknown entity command. Try: entity spawn <type>, entity list', 'error');
          }
          break;

        case 'ground':
        case 'phase4':
              try {
                // Import inventory classes for Phase 4 ground management demo
                const InventoryModule = await import('../../game/inventory/index.js');
                const { Item: InventoryItem, Container, InventoryManager, GroundManager, createWeapon, createArmor, createAttachment, createItem, createAmmo, createMedical } = InventoryModule;

                window.InventoryItem = InventoryItem;
                window.Container = Container;
                window.GroundManager = GroundManager;
                window.InventoryManager = InventoryManager;

                addToConsole('Creating Phase 4 demo - Advanced Ground Management...', 'info');

                // Create inventory manager
                const manager = new InventoryManager();

                // Create diverse ground items for testing organization
                const groundItems = [
                  // Weapons
                  createWeapon('rifle', { id: 'ground-rifle-1', name: 'Assault Rifle' }),
                  createWeapon('pistol', { id: 'ground-pistol-1', name: 'Combat Pistol' }),
                  createWeapon('melee', { id: 'ground-knife-1', name: 'Combat Knife', equippableSlot: 'meleeWeapon' }),

                  // Ammunition
                  createAmmo('9mm', { id: 'ammo-9mm-1', stackCount: 30 }),
                  createAmmo('762mm', { id: 'ammo-762-1', stackCount: 25 }),
                  createAmmo('shotgun', { id: 'ammo-shotgun-1', stackCount: 15 }),

                  // Medical supplies
                  createMedical('bandage', { id: 'med-bandage-1', stackCount: 8 }),
                  createMedical('pills', { id: 'med-pills-1', stackCount: 12 }),
                  createMedical('syringe', { id: 'med-syringe-1', stackCount: 3 }),

                  // Tools
                  createItem('tool', 'flashlight', { id: 'tool-flashlight-1', name: 'LED Flashlight' }),
                  createItem('tool', 'hammer', { id: 'tool-hammer-1', name: 'Claw Hammer' }),
                  createItem('tool', 'screwdriver', { id: 'tool-screwdriver-1', name: 'Screwdriver Set' }),

                  // Containers
                  createItem('container', 'backpack', { id: 'container-backpack-1', name: 'Hiking Backpack' }),

                  // Food
                  createItem('food', 'canned', { id: 'food-canned-1', stackCount: 4, name: 'Canned Beans' }),
                  createItem('food', 'water', { id: 'food-water-1', stackCount: 2, name: 'Water Bottle' })
                ];

                // Add items to ground randomly
                for (const item of groundItems) {
                  manager.groundContainer.addItem(item);
                }

                addToConsole(`✓ Added ${groundItems.length} diverse items to ground`, 'success');

                // Test Phase 4 features
                addToConsole('--- Phase 4 Ground Management Features ---', 'info');

                // 1. Show ground statistics before organization
                const beforeStats = manager.getGroundStatistics();
                addToConsole(`Before organization: ${beforeStats.totalItems} items in ${beforeStats.categories.length} categories`, 'info');
                beforeStats.categoryBreakdown.forEach(cat => {
                  addToConsole(`  ${cat.category}: ${cat.items} items (${cat.stacks} total count)`, 'log');
                });

                // 2. Organize ground items by category
                addToConsole('Organizing ground items by category...', 'info');
                manager.organizeGroundItems();
                addToConsole('✓ Ground items organized by category', 'success');

                // 3. Show statistics after organization
                const afterStats = manager.getGroundStatistics();
                addToConsole(`After organization - Grid utilization: ${Math.round((afterStats.gridUtilization.used / afterStats.gridUtilization.total) * 100)}%`, 'success');

                // 4. Test category-based pickup
                addToConsole('Testing quick pickup of ammunition...', 'info');
                const pickupResult = manager.quickPickupByCategory('ammunition');
                addToConsole(`✓ Picked up ${pickupResult.collected} ammo items, ${pickupResult.failed} failed`, 'success');

                // 5. Test valuable item pickup
                addToConsole('Testing pickup of valuable items (weapons)...', 'info');
                const valuableResult = manager.quickPickupValuables();
                addToConsole(`✓ Picked up ${valuableResult.collected} valuable items`, 'success');

                // 6. Test search functionality
                addToConsole('Testing search for "flashlight"...', 'info');
                const searchResults = manager.searchGroundItems('flashlight');
                addToConsole(`✓ Found ${searchResults.length} items matching "flashlight"`, 'success');

                // 7. Show final ground state
                const finalStats = manager.getGroundStatistics();
                addToConsole(`Final ground state: ${finalStats.totalItems} items remaining`, 'info');

                // Make manager globally available for testing
                window.testGroundManager = manager;
                window.testGroundItems = groundItems;

                addToConsole('Phase 4 demo complete! Available commands:', 'success');
                addToConsole('• testGroundManager.organizeGroundItems() - Reorganize ground', 'log');
                addToConsole('• testGroundManager.quickPickupByCategory("weapons") - Pick up weapons', 'log');
                addToConsole('• testGroundManager.quickPickupValuables() - Pick up valuable items', 'log');
                addToConsole('• testGroundManager.searchGroundItems("medical") - Search items', 'log');
                addToConsole('• testGroundManager.getGroundStatistics() - Get stats', 'log');
                addToConsole('• testGroundManager.compactGroundItems() - Compact layout', 'log');

              } catch (error) {
                addToConsole(`Error in Phase 4 demo: ${error.message}`, 'error');
                console.error('Phase 4 Demo Error:', error);
              }
              break;

        default:
          addToConsole(`Unknown command: ${mainCommand}. Type 'help' for available commands.`, 'error');
      }
    } catch (error) {
      addToConsole(`Command error: ${error.message}`, 'error');
      console.error('Console command error:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setCommandHistory(prev => [input, ...prev]);
      setHistoryIndex(-1);
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'command': return 'text-blue-400';
      case 'info':
      default: return 'text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Terminal className="w-5 h-5" />
            Developer Console
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col h-full pb-4">
          <ScrollArea className="flex-1 mb-4 bg-black rounded p-2" ref={scrollRef}>
            <div className="font-mono text-sm space-y-1">
              {history.map((entry, index) => (
                <div key={index} className={getMessageColor(entry.type)}>
                  <span className="text-gray-500 text-xs mr-2">[{entry.timestamp}]</span>
                  {entry.message}
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-mono">
                &gt;
              </span>
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 bg-gray-800 border-gray-600 text-white font-mono"
                placeholder="Enter command..."
              />
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Execute
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevConsole;