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
