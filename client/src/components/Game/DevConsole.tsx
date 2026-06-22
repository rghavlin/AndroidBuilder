
import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Bug, User, Shield, Flame, Skull, Zap, Package, Globe, Eye, Ghost, CloudRain, Sun, Store, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import engine from '../../game/GameEngine.js';
import { earbucksShopSystem } from '../../game/systems/EarbucksShopSystem.js';

interface DevConsoleProps {
    onClose: () => void;
    onLaunch: (config: any) => void;
    isLoading: boolean;
}

type TabType = 'player' | 'items' | 'world';

export default function DevConsole({ onClose, onLaunch, isLoading }: DevConsoleProps) {
    const [isUnlocked, setIsUnlocked] = useState(import.meta.env.DEV);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('player');
    const [isGodModeActive, setIsGodModeActive] = useState(false);

    
    // -- GOD MODE --
    const handleGodMode = () => {
        if (!engine.player) return;
        
        console.log('[DevConsole] ⚡ ACTIVATING GOD MODE (AP: 1000/1000)');
        engine.player.maxAp = 1000;
        engine.player.ap = 1000;
        
        // Also boost HP if needed, but the request was specifically for AP
        engine.notifyUpdate();
        setIsGodModeActive(true);
        setTimeout(() => setIsGodModeActive(false), 2000);
    };
    


    // -- PLAYER TAB STATE --
    const [playerStats, setPlayerStats] = useState({
        hp: 0,
        maxHp: 0,
        ap: 0,
        maxAp: 0,
        nutrition: 0,
        hydration: 0,
        energy: 0
    });

    // Sync from actual player when tab opens
    useEffect(() => {
        if (activeTab === 'player' && engine.player) {
            setPlayerStats({
                hp: engine.player.hp,
                maxHp: engine.player.maxHp,
                ap: engine.player.ap,
                maxAp: engine.player.maxAp,
                nutrition: engine.player.nutrition || 0,
                hydration: engine.player.hydration || 0,
                energy: engine.player.energy || 0
            });
        }
    }, [activeTab]);

    const updatePlayerStat = (key: string, value: number) => {
        if (!engine.player) return;
        engine.player.setStat(key, value);
        setPlayerStats(prev => ({ ...prev, [key]: value }));
        engine.notifyUpdate();
    };

    // -- ITEMS TAB STATE --
    const [availableItems, setAvailableItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [spawnCount, setSpawnCount] = useState(1);

    useEffect(() => {
        if (activeTab === 'items' && availableItems.length === 0) {
            const loadItems = async () => {
                const { ItemDefs } = await import('../../game/inventory/ItemDefs.js');
                const items = Object.keys(ItemDefs)
                    .filter(key => !key.includes('.icon') && !key.includes('.sprite'))
                    .sort();
                setAvailableItems(items);
            };
            loadItems();
        }
    }, [activeTab]);

    const filteredItems = useMemo(() => {
        return availableItems.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [availableItems, searchQuery]);

    if (!isUnlocked) {
        return (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 pointer-events-auto shadow-2xl">
                <Card className="w-full max-w-md bg-card border-primary/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <Bug className="h-6 w-6 text-primary animate-pulse" />
                            <CardTitle className="text-xl font-mono uppercase tracking-tighter text-foreground">Dev Authorization</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (passwordInput === 'roadhome') {
                            setIsUnlocked(true);
                        } else {
                            setErrorMsg('Access Denied: Incorrect Password');
                        }
                    }}>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Access Token Required</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter access code..."
                                    value={passwordInput}
                                    onChange={(e) => {
                                        setPasswordInput(e.target.value);
                                        setErrorMsg('');
                                    }}
                                    className="font-mono bg-black text-white border-primary/40 focus:border-primary text-center tracking-widest text-lg"
                                    autoFocus
                                />
                            </div>
                            {errorMsg && (
                                <p className="text-xs text-red-500 font-mono text-center">{errorMsg}</p>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 pt-4 pb-4">
                            <Button 
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
                            >
                                Authenticate
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    const spawnItem = async (defId: string) => {
        if (!engine.isReady()) {
            console.warn('[DevConsole] ❌ Cannot spawn: Engine not ready or game not initialized');
            return;
        }
        
        try {
            console.log(`[DevConsole] 🛠️ Attempting to spawn: ${defId}`);
            const { createItemFromDef } = await import('../../game/inventory/ItemDefs.js');
            const { Item } = await import('../../game/inventory/Item.js');
            
            const ground = engine.inventoryManager.getContainer('ground');
            const groundManager = engine.inventoryManager.groundManager;
            
            if (!ground || !groundManager) {
                console.error('[DevConsole] ❌ Ground container or manager not found');
                return;
            }

            let spawnedCount = 0;
            for (let i = 0; i < spawnCount; i++) {
                const itemData = createItemFromDef(defId);
                if (!itemData) {
                    console.error(`[DevConsole] ❌ Failed to create item data for: ${defId}`);
                    break;
                }
                const item = new Item(itemData);
                
                // Use addItemSmart to ensure category-specific placement
                const success = groundManager.addItemSmart(item);
                if (success) {
                    spawnedCount++;
                } else {
                    console.warn(`[DevConsole] ⚠️ Could not add item ${i+1}/${spawnCount} to ground (likely out of space)`);
                }
            }
            
            // CRITICAL: Notify UI to refresh
            engine.inventoryManager.emit('inventoryChanged');
            engine.notifyUpdate();
            
            console.log(`[DevConsole] ✅ Successfully spawned ${spawnedCount}x ${defId} to ground`);
        } catch (err) {
            console.error('[DevConsole] 🚨 Spawn process crashed:', err);
        }
    };

    // -- WORLD TAB TOOLS --
    const revealMap = () => {
        if (!engine.gameMap) return;
        for (let y = 0; y < engine.gameMap.height; y++) {
            for (let x = 0; x < engine.gameMap.width; x++) {
                const tile = engine.gameMap.getTile(x, y);
                if (tile) {
                    if (!tile.flags) tile.flags = {};
                    tile.flags.explored = true;
                }
            }
        }
        engine.notifyUpdate();
    };

    const spawnZombie = async (type = 'basic') => {
        if (!engine.isReady()) return;
        const { EntityFactory } = await import('../../game/EntityFactory.js');
        const z = EntityFactory.createZombie(engine.player.x, engine.player.y - 2, type, `spawned-${Date.now()}`);
        engine.gameMap.addEntity(z, z.x, z.y);
        engine.notifyUpdate();
    };

    const spawnFriendlyNPC = async () => {
        if (!engine.isReady()) return;
        const { EntityFactory } = await import('../../game/EntityFactory.js');
        const { createItemFromDef } = await import('../../game/inventory/ItemDefs.js');
        const { Item } = await import('../../game/inventory/Item.js');
        
        let targetX = engine.player.x;
        let targetY = engine.player.y - 1;
        if (targetY < 0) {
            targetY = engine.player.y + 1;
        }
        
        const n = EntityFactory.createNPC(targetX, targetY, false, 'survivor', 'Friendly Survivor', `spawned-npc-${Date.now()}`);
        
        // Give the NPC some basic items to facilitate bartering/trading
        const itemDefsToGive = ['food.canned_beans', 'medical.bandage', 'weapon.9mmPistol', 'ammo.bullet_9mm'];
        itemDefsToGive.forEach(defId => {
            const itemData = createItemFromDef(defId);
            if (itemData) {
                const item = new Item(itemData);
                n.inventory.addItem(item);
            }
        });

        engine.gameMap.addEntity(n, targetX, targetY);
        engine.notifyUpdate();
    };

    const clearZombies = () => {
        if (!engine.gameMap) return;
        const zombies = engine.gameMap.getEntitiesByType('zombie');
        zombies.forEach(z => engine.gameMap.removeEntity(z.id));

        // Ensure that counts as 100% of all zombies being killed for the exit window and prize
        if (engine.worldManager && engine.worldManager.currentMapId) {
            const mapId = engine.worldManager.currentMapId;
            const spawned = engine.worldManager.zombiesSpawned[mapId] || 0;
            if (spawned === 0) {
                engine.worldManager.zombiesSpawned[mapId] = zombies.length;
                engine.worldManager.zombiesKilled[mapId] = zombies.length;
            } else {
                engine.worldManager.zombiesKilled[mapId] = spawned;
            }
        }

        engine.notifyUpdate();
    };

    const toggleTextures = () => {
        engine.renderDebugColors = !engine.renderDebugColors;
        engine.notifyUpdate();
    };

    const toggleXRay = () => {
        engine.seeThroughWalls = !engine.seeThroughWalls;
        // Also reveal map if enabling X-ray for convenience
        if (engine.seeThroughWalls) {
            revealMap();
        }
        engine.notifyUpdate();
    };

    const toggleRain = () => {
        const isRaining = engine.weather?.type === 'rain';
        if (isRaining) {
            engine.setWeather('clear');
        } else {
            engine.setWeather('rain', 0.5);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 pointer-events-auto shadow-2xl">
            <Card className="w-full max-w-4xl bg-card border-primary/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2">
                        <Bug className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl font-mono uppercase tracking-tighter">Dev Console</CardTitle>
                        
                        {/* God Mode Trigger */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleGodMode}
                            className={`ml-4 h-8 px-3 gap-1.5 border-primary/40 hover:bg-primary/20 hover:border-primary transition-all ${isGodModeActive ? 'bg-primary text-primary-foreground scale-110' : ''}`}
                            title="Set AP to 1000/1000"
                        >
                            <Zap className={`h-4 w-4 ${isGodModeActive ? 'animate-pulse' : 'text-primary'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">God</span>
                        </Button>
                    </div>
                    <div className="flex gap-1 bg-secondary/30 p-1 rounded-md">
                        <TabButton id="player" icon={<User className="h-4 w-4" />} activeTab={activeTab} onClick={setActiveTab}>Stats</TabButton>
                        <TabButton id="items" icon={<Package className="h-4 w-4" />} activeTab={activeTab} onClick={setActiveTab}>Items</TabButton>
                        <TabButton id="world" icon={<Skull className="h-4 w-4" />} activeTab={activeTab} onClick={setActiveTab}>World</TabButton>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="h-[60vh] overflow-hidden flex flex-col pt-6">
                    {activeTab === 'player' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <PlayerTab stats={playerStats} updateStat={updatePlayerStat} />
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            <div className="flex gap-4">
                                <Input 
                                    placeholder="Search items..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="font-mono bg-black text-white border-primary/40 focus:border-primary"
                                />
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs shrink-0">Qty</Label>
                                    <Input 
                                        type="number" 
                                        className="w-20 text-center bg-black text-white border-primary/40" 
                                        value={spawnCount} 
                                        onChange={e => setSpawnCount(parseInt(e.target.value)||1)} 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-3 gap-2">
                                {filteredItems.map(item => (
                                    <Button 
                                        key={item} 
                                        variant="outline" 
                                        size="sm"
                                        className="justify-start text-xs font-mono h-8 overflow-hidden bg-secondary/20 hover:bg-primary/20 hover:border-primary"
                                        onClick={() => spawnItem(item)}
                                    >
                                        {item}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'world' && (
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-2 gap-4 place-items-start content-start">
                                <WorldToolButton 
                                    icon={<Eye className="h-5 w-5" />} 
                                    title="Reveal Map" 
                                    desc="Clear all Fog of War" 
                                    onClick={revealMap} 
                                />
                                <WorldToolButton 
                                    icon={<Ghost className="h-5 w-5" />} 
                                    title="Spawn Zombie" 
                                    desc="At player location" 
                                    onClick={() => spawnZombie()} 
                                />
                                <WorldToolButton 
                                    icon={<User className="h-5 w-5 text-emerald-400" />} 
                                    title="Spawn Friendly NPC" 
                                    desc="Adjacent with trade items" 
                                    onClick={() => spawnFriendlyNPC()} 
                                />
                                <WorldToolButton 
                                    icon={<Skull className="h-5 w-5 text-red-500" />} 
                                    title="Clear Population" 
                                    desc="Kill every zombie on map" 
                                    onClick={clearZombies} 
                                />
                                <WorldToolButton 
                                    icon={<Globe className={`h-5 w-5 ${engine.renderDebugColors ? 'text-red-500' : 'text-primary'}`} />} 
                                    title="Toggle Textures" 
                                    desc={engine.renderDebugColors ? "Currently: OFF (Simple Mode)" : "Currently: ON (Textured)"} 
                                    onClick={toggleTextures} 
                                />
                                <WorldToolButton 
                                    icon={<CloudRain className={`h-5 w-5 ${engine.weather?.type === 'rain' ? 'text-blue-400' : 'text-primary'}`} />} 
                                    title="Toggle Rain" 
                                    desc={engine.weather?.type === 'rain' ? "Stop Raining" : "Start Raining (Intensity 50%)"} 
                                    onClick={toggleRain} 
                                />
                                <WorldToolButton 
                                    icon={<Ghost className={`h-5 w-5 ${engine.seeThroughWalls ? 'text-purple-500' : 'text-primary'}`} />} 
                                    title="X-Ray Vision" 
                                    desc={engine.seeThroughWalls ? "Currently: ON (Zombies Visible)" : "Currently: OFF (LOS Only)"} 
                                    onClick={toggleXRay} 
                                />
                            </div>
                            
                            <DevConsoleShopManager />
                        </div>
                    )}
                </CardContent>

                <CardFooter className="border-t border-border/50 pt-4 pb-4">
                    <div className="w-full text-center text-xs text-muted-foreground italic font-mono uppercase tracking-widest">
                        Changes applied live to engine singleton
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

// -- SUB-COMPONENTS --

function TabButton({ id, icon, children, activeTab, onClick }: any) {
    const active = activeTab === id;
    return (
        <Button 
            variant={active ? "default" : "ghost"} 
            size="sm" 
            className={`flex gap-2 font-mono uppercase tracking-tighter h-8 ${active ? 'bg-primary' : 'text-muted-foreground'}`}
            onClick={() => onClick(id)}
        >
            {icon} {children}
        </Button>
    )
}

function WorldToolButton({ icon, title, desc, onClick }: any) {
    return (
        <Card className="w-full bg-secondary/20 hover:bg-secondary/40 border-primary/10 transition-colors cursor-pointer" onClick={onClick}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
                <div>
                    <h4 className="font-bold text-sm uppercase">{title}</h4>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
            </CardContent>
        </Card>
    )
}


function PlayerTab({ stats, updateStat }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary tracking-widest border-b border-primary/20 pb-1">Vitals</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <StatSlider label="Health" value={stats.hp} max={stats.maxHp} onChange={v => updateStat('hp', v)} color="bg-red-500" />
                        <StatInput label="Max Health" value={stats.maxHp} onChange={v => updateStat('maxHp', parseInt(v)||0)} />
                    </div>
                    <div className="space-y-2">
                        <StatSlider label="Action Points" value={stats.ap} max={stats.maxAp} onChange={v => updateStat('ap', v)} color="bg-blue-500" />
                        <StatInput label="Max Action Points" value={stats.maxAp} onChange={v => updateStat('maxAp', parseInt(v)||0)} />
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary tracking-widest border-b border-primary/20 pb-1">Metabolics</h3>
                <div className="space-y-4">
                    <StatSlider label="Nutrition" value={stats.nutrition} max={100} onChange={v => updateStat('nutrition', v)} color="bg-orange-500" />
                    <StatSlider label="Hydration" value={stats.hydration} max={100} onChange={v => updateStat('hydration', v)} color="bg-cyan-500" />
                    <StatSlider label="Energy" value={stats.energy} max={100} onChange={v => updateStat('energy', v)} color="bg-yellow-500" />
                </div>
            </div>
        </div>
    )
}

function StatInput({ label, value, onChange }: any) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">{label}</Label>
            <Input 
                type="number" 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="h-7 font-mono bg-black text-white border-primary/40 focus:border-primary" 
            />
        </div>
    )
}

function StatSlider({ label, value, max, onChange, color }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
                <span className="uppercase font-bold">{label}</span>
                <span className="font-mono">{value} / {max}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                onChange(Math.round(pct * max));
            }}>
                <div className={`h-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
            </div>
        </div>
    )
}

function DevConsoleShopManager() {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [itemDefs, setItemDefs] = useState<any>({});
    const [selectedDefId, setSelectedDefId] = useState('');
    const [price, setPrice] = useState(5);
    
    const currentMapId = engine.worldManager?.currentMapId || 'map_001';
    
    const catalog = useSyncExternalStore(
        (cb) => engine.subscribe(cb),
        () => earbucksShopSystem.getCatalog(currentMapId)
    );

    useEffect(() => {
        const loadItemDefs = async () => {
            const { ItemDefs } = await import('../../game/inventory/ItemDefs.js');
            setItemDefs(ItemDefs);
            const keys = Object.keys(ItemDefs).filter(key => !key.includes('.icon') && !key.includes('.sprite')).sort();
            if (keys.length > 0) {
                setSelectedDefId(keys[0]);
            }
        };
        loadItemDefs();
    }, []);

    const handleAddItem = () => {
        if (!selectedDefId) return;
        const name = itemDefs[selectedDefId]?.name || selectedDefId;
        earbucksShopSystem.addItem(currentMapId, { defId: selectedDefId, name, price });
    };

    const handleRemoveItem = (defId: string) => {
        earbucksShopSystem.removeItem(currentMapId, defId);
    };

    const itemKeys = Object.keys(itemDefs).filter(key => !key.includes('.icon') && !key.includes('.sprite')).sort();

    return (
        <div className="w-full border border-white/10 rounded-xl bg-zinc-950/40 p-4 mt-2">
            <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white uppercase tracking-wider">Shop Management</span>
                </div>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronUp className="h-4 w-4 text-zinc-400" />}
            </div>

            {!isCollapsed && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest border-b border-white/5 pb-2">
                        Current Shop Catalog ({currentMapId})
                    </div>

                    {catalog.length === 0 ? (
                        <div className="text-xs text-zinc-500 italic py-2">No items in shop catalog.</div>
                    ) : (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {catalog.map(item => (
                                <div key={item.defId} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-lg text-xs font-mono">
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <span className="text-emerald-400">[{item.price} ♪]</span>
                                        <span>{item.name}</span>
                                        <span className="text-[10px] text-zinc-600">({item.defId})</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded"
                                        onClick={() => handleRemoveItem(item.defId)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-white/5 pt-4">
                        <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-2">
                            Add Item to Catalog
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Item Definition</Label>
                                <select 
                                    value={selectedDefId}
                                    onChange={e => setSelectedDefId(e.target.value)}
                                    className="h-9 w-full bg-black text-white border border-primary/40 focus:border-primary rounded-md px-3 font-mono text-xs focus-visible:outline-none"
                                >
                                    {itemKeys.map(key => (
                                        <option key={key} value={key} className="bg-zinc-950 font-mono text-xs">
                                            {itemDefs[key]?.name || key} ({key})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-24 flex flex-col gap-1.5">
                                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Price (♪)</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={price}
                                    onChange={e => setPrice(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="bg-black text-white border-primary/40 focus:border-primary text-center font-mono h-9"
                                />
                            </div>

                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 gap-1"
                                onClick={handleAddItem}
                            >
                                <Plus className="h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
