import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Renders a set of distinct colors as a single CSS `background` value: one color stays
// flat, multiple colors become an even-stop diagonal gradient (e.g. a brainstem stew's
// combined buffs). Must be assigned to `background`, not `backgroundColor` — a gradient
// string is not a valid backgroundColor value and would silently no-op.
export function rainbowBackground(colors?: string[] | null): string | undefined {
  if (!colors || colors.length === 0) return undefined;
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

export function isLightTheme(theme: string | undefined | null): boolean {
  if (!theme) return false;
  return theme === 'light' || theme === 'light2';
}

export function getCategoryClass(item: any): string {
  if (!item) return '';
  const defId = item.defId || item.id;
  if (defId === 'clothing.police_shirt' || defId === 'container.guncase') return 'item-special-blue';
  
  // Use hasCategory function if available, otherwise check categories array directly
  const isFood = item.hasCategory?.('food') || item.categories?.includes('food') || item.categories?.includes('consumable');
  const isMedical = item.hasCategory?.('medical') || item.categories?.includes('medical');
  const isVehicle = item.hasCategory?.('vehicle') || item.categories?.includes('vehicle') || item.hasTrait?.('vehicle');
  
  if (isFood) return 'category-food';
  if (isMedical) return 'category-medical';
  if (isVehicle) return 'category-vehicle';
  return '';
}
