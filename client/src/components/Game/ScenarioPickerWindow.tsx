import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScenarioStorage } from '@/game/ScenarioStorage';

interface ScenarioInfo {
  name: string;
  width: number;
  height: number;
  fileName?: string;
}

interface ScenarioPickerWindowProps {
  onClose: () => void;
  onLoad: (scenarioData: any) => void;
}

export default function ScenarioPickerWindow({ onClose, onLoad }: ScenarioPickerWindowProps) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const list = await ScenarioStorage.list();
      setScenarios(list as ScenarioInfo[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (s: ScenarioInfo) => {
    try {
      const data = await ScenarioStorage.load(s.fileName || s.name);
      if (data) onLoad(data);
    } catch (e: any) {
      setError(`Failed to load: ${e.message}`);
    }
  };

  const handleDelete = async (s: ScenarioInfo) => {
    if (!confirm(`Delete scenario "${s.name}"?`)) return;
    await ScenarioStorage.remove(s.fileName || s.name);
    loadList();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.name || !data.tiles) {
          setError('Invalid scenario file');
          return;
        }
        await ScenarioStorage.save(data);
        loadList();
      } catch (err: any) {
        setError(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-[420px] max-h-[80vh] metal-panel border-border shadow-2xl flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-foreground flex justify-between items-center">
            Custom Scenarios
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              X
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 overflow-hidden">
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="overflow-y-auto max-h-[50vh] flex flex-col gap-2">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : scenarios.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No scenarios yet. Export one from the Map Editor or import a .scenario.json file.
              </p>
            ) : (
              scenarios.map(s => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded border border-border bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.width} x {s.height}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="metal-button-green"
                      onClick={() => handleSelect(s)}
                    >
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(s)}
                    >
                      Del
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              className="flex-1 metal-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Import File
            </Button>
            <Button
              className="flex-1 metal-button"
              onClick={() => { ScenarioStorage.openEditorWindow(); }}
            >
              Open Editor
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
