
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CraftingCategory {
  id: string;
  name: string;
  icon: string;
}

export default function CraftingPanel() {
  const craftingCategories: CraftingCategory[] = [
    { id: 'tools', name: 'Tools', icon: '🔧' },
    { id: 'weapons', name: 'Weapons', icon: '⚔️' },
    { id: 'medical', name: 'Medical', icon: '🏥' },
    { id: 'survival', name: 'Survival', icon: '🏕️' },
  ];

  return (
    <div className="p-3 h-full">
      <h3 className="text-xs font-semibold text-muted-foreground mb-3">
        CRAFTING & RECIPES
      </h3>
      
      <Tabs defaultValue="tools" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          {craftingCategories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id} 
              className="text-xs"
              data-testid={`crafting-tab-${category.id}`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {craftingCategories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id} 
            className="flex-1 mt-2"
          >
            <div className="h-full border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="text-2xl mb-2 block">{category.icon}</span>
                <p className="text-sm font-medium">{category.name} Crafting</p>
                <p className="text-xs mt-1">Ready for Integration</p>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
