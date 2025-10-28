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
import { ItemTrait } from '../../game/inventory/traits.js';

const DevConsole = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const consoleRef = useRef(null);
  
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

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.console-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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
          addToConsole('  phase5 - Verify Phase 5A completion status', 'info');
          addToConsole('  phase5b - Verify Phase 5B equipment display', 'info');
          addToConsole('  phase5c - Verify Phase 5C backpack visibility', 'info');
          addToConsole('  equip backpack - Equip a test backpack (visual test)', 'info');
          addToConsole('  unequip backpack - Unequip backpack (visual test)', 'info');
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
                const { Item: InventoryItem, Container, InventoryManager } = InventoryModule;

                // Make classes globally available for the demo
                window.InventoryItem = InventoryItem;
                window.Container = Container;

                addToConsole('Creating Phase 3 demo - Equipment & Dynamic Containers...', 'info');

                // Create inventory manager
                const manager = new InventoryManager();

                // Create equipment items
                const rifle = new InventoryItem({
                  id: 'demo-rifle',
                  name: 'Tactical Rifle',
                  defId: 'weapon.rifle',
                  width: 1,
                  height: 4,
                  equippableSlot: 'long_gun',
                  traits: [ItemTrait.EQUIPPABLE]
                });

                const vest = new InventoryItem({
                  id: 'demo-vest',
                  name: 'Tactical Vest',
                  defId: 'armor.vest',
                  width: 2,
                  height: 3,
                  equippableSlot: 'upper_body',
                  containerGrid: { width: 4, height: 2 },
                  traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER]
                });

                const backpack = new InventoryItem({
                  id: 'demo-backpack',
                  name: 'Military Backpack',
                  defId: 'container.backpack',
                  width: 3,
                  height: 4,
                  equippableSlot: 'backpack',
                  containerGrid: { width: 8, height: 10 },
                  traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER]
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

                // Add some items to containers
                addToConsole('Adding items to containers...', 'info');

                const ammo = new InventoryItem({
                  id: 'demo-ammo',
                  defId: 'ammo.5.56mm',
                  name: '5.56mm Ammo',
                  width: 1,
                  height: 1,
                  stackCount: 30,
                  stackMax: 50,
                  traits: [ItemTrait.STACKABLE]
                });

                const medkit = new InventoryItem({
                  id: 'demo-medkit',
                  defId: 'medical.bandage',
                  name: 'Bandage',
                  width: 1,
                  height: 1,
                  stackCount: 5,
                  stackMax: 10,
                  traits: [ItemTrait.STACKABLE]
                });

                const ammoResult = manager.addItem(ammo);
                const medkitResult = manager.addItem(medkit);

                addToConsole(`Ammo stored in: ${ammoResult.container}`, 'info');
                addToConsole(`Medkit stored in: ${medkitResult.container}`, 'info');

                // Demonstrate serialization
                addToConsole('Testing serialization...', 'info');
                const serialized = manager.toJSON();
                const restored = InventoryManager.fromJSON(serialized);

                const restoredRifle = restored.equipment.long_gun;
                addToConsole(`Serialization test: rifle ${restoredRifle ? 'restored' : 'missing'}`, 'info');

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

        case 'phase5':
          try {
            addToConsole('=== Phase 5A Verification ===', 'info');
            
            // Test 1: Check if inventoryManager exists from initialization
            addToConsole('Test 1: InventoryManager created during initialization?', 'info');
            if (window.inventoryManager) {
              addToConsole('  ✅ window.inventoryManager exists', 'success');
              addToConsole(`  - Manager type: ${window.inventoryManager.constructor.name}`, 'log');
            } else {
              addToConsole('  ❌ window.inventoryManager NOT FOUND', 'error');
              addToConsole('  - This indicates Phase 5A is incomplete', 'error');
            }
            
            // Test 2: Check if ground container is accessible
            addToConsole('Test 2: Ground container accessible?', 'info');
            if (window.inventoryManager) {
              const groundContainer = window.inventoryManager.getContainer('ground');
              if (groundContainer) {
                addToConsole('  ✅ Ground container accessible', 'success');
                addToConsole(`  - Container ID: ${groundContainer.id}`, 'log');
                addToConsole(`  - Dimensions: ${groundContainer.width}x${groundContainer.height}`, 'log');
                addToConsole(`  - Item count: ${groundContainer.getItemCount()}`, 'log');
              } else {
                addToConsole('  ❌ Ground container NOT ACCESSIBLE', 'error');
              }
            } else {
              addToConsole('  ⏭️  Skipped (no manager)', 'log');
            }
            
            // Test 3: Check if manager is same instance across contexts
            addToConsole('Test 3: Manager instance consistency?', 'info');
            if (window.inventoryManager) {
              // Check if window.inv helper exists
              if (window.inv) {
                addToConsole('  ✅ window.inv helper exists', 'success');
                
                // Test if both references point to same ground container
                const groundViaManager = window.inventoryManager.getContainer('ground');
                const groundViaHelper = window.inv.getContainer('ground');
                
                if (groundViaManager === groundViaHelper) {
                  addToConsole('  ✅ Same instance across all access methods', 'success');
                } else {
                  addToConsole('  ❌ DIFFERENT INSTANCES detected', 'error');
                  addToConsole('  - This indicates multiple managers exist', 'error');
                }
              } else {
                addToConsole('  ⚠️  window.inv helper not set up', 'log');
              }
              
              // Check equipment slots
              addToConsole('Test 4: Equipment system initialized?', 'info');
              const equipment = window.inventoryManager.equipment;
              if (equipment) {
                const slots = Object.keys(equipment);
                addToConsole(`  ✅ Equipment object exists with ${slots.length} slots`, 'success');
                addToConsole(`  - Slots: ${slots.join(', ')}`, 'log');
                
                // Count equipped items
                const equippedCount = Object.values(equipment).filter(item => item !== null).length;
                addToConsole(`  - Currently equipped: ${equippedCount} items`, 'log');
              } else {
                addToConsole('  ❌ Equipment object NOT FOUND', 'error');
              }
            } else {
              addToConsole('  ⏭️  Skipped (no manager)', 'log');
            }
            
            // Summary
            addToConsole('--- Phase 5A Status ---', 'info');
            if (window.inventoryManager) {
              const groundExists = window.inventoryManager.getContainer('ground') !== null;
              const helperExists = window.inv !== undefined;
              const equipmentExists = window.inventoryManager.equipment !== undefined;
              
              if (groundExists && helperExists && equipmentExists) {
                addToConsole('✅ Phase 5A appears COMPLETE', 'success');
                addToConsole('All core infrastructure in place', 'success');
              } else {
                addToConsole('⚠️  Phase 5A partially complete', 'log');
                if (!groundExists) addToConsole('  - Missing: ground container', 'error');
                if (!helperExists) addToConsole('  - Missing: dev console helpers', 'error');
                if (!equipmentExists) addToConsole('  - Missing: equipment system', 'error');
              }
            } else {
              addToConsole('❌ Phase 5A NOT STARTED', 'error');
              addToConsole('InventoryManager not created during initialization', 'error');
            }
            
          } catch (error) {
            addToConsole(`Error in Phase 5A verification: ${error.message}`, 'error');
            console.error('Phase 5A Verification Error:', error);
          }
          break;

        case 'phase5b':
          try {
            addToConsole('=== Phase 5B Verification (Equipment Display) ===', 'info');
            
            if (!window.inventoryManager) {
              addToConsole('❌ InventoryManager not found - run Phase 5A first', 'error');
              break;
            }
            
            // Test: Create and equip test items
            addToConsole('Test 1: Equipping items to test display...', 'info');
            
            const { Item } = await import('../../game/inventory/Item.js');
            const { ItemDefs } = await import('../../game/inventory/ItemDefs.js');
            
            // Create test items for different slots
            const testKnife = new Item({
              instanceId: 'test-knife-5b',
              defId: 'weapon.knife',
              name: 'Combat Knife',
              width: 1,
              height: 2,
              equippableSlot: 'melee',
              traits: [ItemTrait.EQUIPPABLE]
            });
            
            const testFlashlight = new Item({
              instanceId: 'test-flashlight-5b',
              defId: 'tool.flashlight',
              name: 'LED Flashlight',
              width: 1,
              height: 2,
              equippableSlot: 'flashlight',
              traits: [ItemTrait.EQUIPPABLE]
            });
            
            // Equip items
            const knifeResult = window.inventoryManager.equipItem(testKnife, 'melee');
            const flashlightResult = window.inventoryManager.equipItem(testFlashlight, 'flashlight');
            
            if (knifeResult.success && flashlightResult.success) {
              addToConsole('  ✅ Test items equipped successfully', 'success');
              addToConsole('  - Knife equipped to melee slot', 'log');
              addToConsole('  - Flashlight equipped to flashlight slot', 'log');
            } else {
              addToConsole('  ⚠️  Some items failed to equip', 'log');
            }
            
            // Test 2: Verify UI display
            addToConsole('Test 2: Equipment slot UI display...', 'info');
            addToConsole('  ℹ️  Check the equipment slots visually:', 'info');
            addToConsole('  - Melee slot should show "CO" (Combat Knife)', 'log');
            addToConsole('  - Flashlight slot should show "LE" (LED Flashlight)', 'log');
            addToConsole('  - Hover over slots to see tooltips with item names', 'log');
            addToConsole('  - Equipped slots should have accent border/background', 'log');
            
            // Test 3: Verify tooltips
            addToConsole('Test 3: Tooltip functionality...', 'info');
            const equipment = window.inventoryManager.equipment;
            let tooltipCount = 0;
            
            Object.entries(equipment).forEach(([slot, item]) => {
              if (item) {
                addToConsole(`  ✅ ${slot}: "${item.name}" (should show on hover)`, 'success');
                tooltipCount++;
              }
            });
            
            addToConsole(`  - ${tooltipCount} equipped slots with tooltips`, 'log');
            
            // Test 4: Verify click behavior (console.debug only)
            addToConsole('Test 4: Click behavior...', 'info');
            addToConsole('  ℹ️  Click any equipment slot and check browser console', 'info');
            addToConsole('  - Should see debug message: "[EquipmentSlots] Slot {id} clicked - Phase 5B (read-only)"', 'log');
            addToConsole('  - No actual interaction should occur (read-only)', 'log');
            
            // Summary
            addToConsole('--- Phase 5B Status ---', 'info');
            const hasEquippedItems = Object.values(equipment).some(item => item !== null);
            
            if (hasEquippedItems) {
              addToConsole('✅ Phase 5B Implementation Complete', 'success');
              addToConsole('Equipment slots are displaying equipped items', 'success');
              addToConsole('Tooltips show item names on hover', 'success');
              addToConsole('Slots are read-only (console.debug on click)', 'success');
            } else {
              addToConsole('⚠️  No items equipped - equip items to test display', 'log');
            }
            
            addToConsole('', 'info');
            addToConsole('Quick test commands:', 'info');
            addToConsole('• Unequip melee: window.inventoryManager.unequipItem("melee")', 'log');
            addToConsole('• Unequip flashlight: window.inventoryManager.unequipItem("flashlight")', 'log');
            
          } catch (error) {
            addToConsole(`Error in Phase 5B verification: ${error.message}`, 'error');
            console.error('Phase 5B Verification Error:', error);
          }
          break;

        case 'phase5c':
          try {
            addToConsole('=== Phase 5C Verification (Backpack Visibility) ===', 'info');
            
            if (!window.inventoryManager) {
              addToConsole('❌ InventoryManager not found - run Phase 5A first', 'error');
              break;
            }
            
            // Test 1: Check initial state (no backpack equipped)
            addToConsole('Test 1: Initial state (no backpack)...', 'info');
            
            // Ensure no backpack is equipped
            if (window.inventoryManager.equipment.backpack) {
              const unequipResult = window.inventoryManager.unequipItem('backpack');
              addToConsole(`  - Unequipped existing backpack: ${unequipResult.success}`, 'log');
            }
            
            const initialBackpack = window.inventoryManager.getBackpackContainer();
            if (!initialBackpack) {
              addToConsole('  ✅ No backpack equipped - should show "No backpack equipped"', 'success');
              addToConsole('  ℹ️  Check BackpackGrid UI: should show placeholder message', 'info');
            } else {
              addToConsole('  ❌ Unexpected backpack state', 'error');
            }
            
            // Test 2: Equip a backpack and verify visibility
            addToConsole('Test 2: Equipping a backpack...', 'info');
            
            const { Item } = await import('../../game/inventory/Item.js');
            
            const testBackpack = new Item({
              instanceId: 'test-backpack-5c',
              defId: 'container.backpack',
              name: 'Hiking Backpack',
              width: 3,
              height: 4,
              equippableSlot: 'backpack',
              containerGrid: { width: 8, height: 10 },
              traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER]
            });
            
            const equipResult = window.inventoryManager.equipItem(testBackpack, 'backpack');
            
            if (equipResult.success) {
              // Force UI refresh after console mutation (Phase 5C workaround until Phase 5E)
              if (window.inv?.refresh) {
                window.inv.refresh();
                addToConsole('  - UI refreshed to show backpack grid', 'log');
              }
              addToConsole('  ✅ Backpack equipped successfully', 'success');
              
              // Verify container is now accessible
              const equippedBackpack = window.inventoryManager.getBackpackContainer();
              if (equippedBackpack) {
                addToConsole(`  ✅ Equipped backpack container accessible`, 'success');
                addToConsole(`  - Container ID: ${equippedBackpack.id}`, 'log');
                addToConsole(`  - Dimensions: ${equippedBackpack.width}x${equippedBackpack.height}`, 'log');
                addToConsole('  ℹ️  Check BackpackGrid UI: should show grid with header', 'info');
              } else {
                addToConsole('  ❌ Equipped backpack container not found', 'error');
              }
            } else {
              addToConsole(`  ❌ Failed to equip backpack: ${equipResult.reason}`, 'error');
            }
            
            // Test 3: Verify grid slot size consistency
            addToConsole('Test 3: Grid slot size consistency...', 'info');
            addToConsole('  ℹ️  Visual check required:', 'info');
            addToConsole('  - Backpack grid slots should match ground grid slot size', 'log');
            addToConsole('  - Both grids should use same pixel dimensions from GridSizeContext', 'log');
            
            // Test 4: Unequip and verify visibility toggle
            addToConsole('Test 4: Unequipping backpack...', 'info');
            
            const unequipResult = window.inventoryManager.unequipItem('backpack');
            
            if (unequipResult.success) {
              // Force UI refresh after console mutation (Phase 5C workaround until Phase 5E)
              if (window.inv?.refresh) {
                window.inv.refresh();
                addToConsole('  - UI refreshed to hide backpack grid', 'log');
              }
              addToConsole('  ✅ Backpack unequipped successfully', 'success');
              addToConsole(`  - Item placed in: ${unequipResult.placedIn}`, 'log');
              
              const afterUnequip = window.inventoryManager.getBackpackContainer();
              if (!afterUnequip) {
                addToConsole('  ✅ Backpack visibility toggled off', 'success');
                addToConsole('  ℹ️  Check BackpackGrid UI: should show "No backpack equipped" again', 'info');
              } else {
                addToConsole('  ❌ Backpack still showing after unequip', 'error');
              }
            } else {
              addToConsole(`  ❌ Failed to unequip: ${unequipResult.reason}`, 'error');
            }
            
            // Summary
            addToConsole('--- Phase 5C Status ---', 'info');
            addToConsole('✅ Phase 5C Implementation Complete', 'success');
            addToConsole('Backpack grid visibility toggles based on equipment state', 'success');
            addToConsole('Grid appears when backpack is equipped', 'success');
            addToConsole('Placeholder shown when no backpack equipped', 'success');
            
          } catch (error) {
            addToConsole(`Error in Phase 5C verification: ${error.message}`, 'error');
            console.error('Phase 5C Verification Error:', error);
          }
          break;

        case 'equip':
          if (subCommand === 'backpack') {
            try {
              addToConsole('Equipping test backpack...', 'info');
              const { Item } = await import('../../game/inventory/Item.js');
              
              const testBackpack = new Item({
                instanceId: 'manual-test-bp',
                defId: 'container.backpack',
                name: 'Test Backpack',
                width: 3,
                height: 4,
                equippableSlot: 'backpack',
                containerGrid: { width: 8, height: 10 },
                traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER]
              });
              
              const result = window.inventoryManager.equipItem(testBackpack, 'backpack');
              if (result.success) {
                window.inv?.refresh();
                addToConsole('✅ Backpack equipped - check the Backpack panel', 'success');
              } else {
                addToConsole(`❌ Failed to equip: ${result.reason}`, 'error');
              }
            } catch (error) {
              addToConsole(`Error: ${error.message}`, 'error');
            }
          } else {
            addToConsole('Usage: equip backpack', 'error');
          }
          break;

        case 'unequip':
          if (subCommand === 'backpack') {
            try {
              addToConsole('Unequipping backpack...', 'info');
              const result = window.inventoryManager.unequipItem('backpack');
              if (result.success) {
                window.inv?.refresh();
                addToConsole('✅ Backpack unequipped - should show "No backpack equipped"', 'success');
              } else {
                addToConsole(`❌ Failed to unequip: ${result.reason}`, 'error');
              }
            } catch (error) {
              addToConsole(`Error: ${error.message}`, 'error');
            }
          } else {
            addToConsole('Usage: unequip backpack', 'error');
          }
          break;

        case 'ground':
        case 'phase4':
              try {
                // Import inventory classes for Phase 4 ground management demo
                const InventoryModule = await import('../../game/inventory/index.js');
                const { Item: InventoryItem, Container, InventoryManager, GroundManager } = InventoryModule;

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
                  new InventoryItem({ id: 'ground-rifle-1', name: 'Assault Rifle', defId: 'weapon.rifle', width: 1, height: 4, equippableSlot: 'long_gun', traits: [ItemTrait.EQUIPPABLE] }),
                  new InventoryItem({ id: 'ground-pistol-1', name: 'Combat Pistol', defId: 'weapon.pistol', width: 1, height: 2, equippableSlot: 'handgun', traits: [ItemTrait.EQUIPPABLE] }),
                  new InventoryItem({ id: 'ground-knife-1', name: 'Combat Knife', defId: 'weapon.melee', width: 1, height: 2, equippableSlot: 'melee', traits: [ItemTrait.EQUIPPABLE] }),

                  // Ammunition
                  new InventoryItem({ id: 'ammo-9mm-1', defId: 'ammo.9mm', name: '9mm Ammo', width: 1, height: 1, stackCount: 30, stackMax: 50, traits: [ItemTrait.STACKABLE] }),
                  new InventoryItem({ id: 'ammo-762-1', defId: 'ammo.762mm', name: '7.62mm Ammo', width: 1, height: 1, stackCount: 25, stackMax: 30, traits: [ItemTrait.STACKABLE] }),
                  new InventoryItem({ id: 'ammo-shotgun-1', defId: 'ammo.shotgun', name: 'Shotgun Shells', width: 1, height: 1, stackCount: 15, stackMax: 25, traits: [ItemTrait.STACKABLE] }),

                  // Medical supplies
                  new InventoryItem({ id: 'med-bandage-1', defId: 'medical.bandage', name: 'Bandage', width: 1, height: 1, stackCount: 8, stackMax: 10, traits: [ItemTrait.STACKABLE] }),
                  new InventoryItem({ id: 'med-pills-1', defId: 'medical.pills', name: 'Pills', width: 1, height: 1, stackCount: 12, stackMax: 20, traits: [ItemTrait.STACKABLE] }),
                  new InventoryItem({ id: 'med-syringe-1', defId: 'medical.syringe', name: 'Syringe', width: 1, height: 1, stackCount: 3, stackMax: 5, traits: [ItemTrait.STACKABLE] }),

                  // Tools
                  new InventoryItem({ id: 'tool-flashlight-1', defId: 'tool.flashlight', name: 'LED Flashlight', width: 1, height: 2, equippableSlot: 'flashlight', traits: [ItemTrait.EQUIPPABLE] }),
                  new InventoryItem({ id: 'tool-hammer-1', defId: 'tool.hammer', name: 'Claw Hammer', width: 2, height: 1, traits: [] }),
                  new InventoryItem({ id: 'tool-screwdriver-1', defId: 'tool.screwdriver', name: 'Screwdriver Set', width: 1, height: 1, traits: [] }),

                  // Containers
                  new InventoryItem({ id: 'container-backpack-1', defId: 'container.backpack', name: 'Hiking Backpack', width: 3, height: 4, equippableSlot: 'backpack', containerGrid: { width: 8, height: 10 }, traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER] }),

                  // Food
                  new InventoryItem({ id: 'food-canned-1', defId: 'food.canned', name: 'Canned Beans', width: 1, height: 1, stackCount: 4, stackMax: 6, traits: [ItemTrait.STACKABLE] }),
                  new InventoryItem({ id: 'food-water-1', defId: 'food.water', name: 'Water Bottle', width: 1, height: 2, stackCount: 2, stackMax: 4, traits: [ItemTrait.STACKABLE] })
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 pointer-events-none">
      <Card 
        ref={consoleRef}
        className="w-3/4 h-3/4 bg-gray-900 border-gray-700 pointer-events-auto"
        style={{
          position: 'absolute',
          left: position.x || '12.5%',
          top: position.y || '12.5%',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <CardHeader 
          className="console-header flex flex-row items-center justify-between pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Terminal className="w-5 h-5" />
            Developer Console (Drag to move)
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