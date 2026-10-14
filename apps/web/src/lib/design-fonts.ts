/** Bundled font families only. Drafts cannot select URLs or arbitrary CSS. */
export const fontChoices = [
  { name: 'Poppins', category: 'Modern', weight: 700, fallback: 'sans-serif', sample: 'Make it yours.' },
  { name: 'Space Grotesk', category: 'Modern', weight: 700, fallback: 'sans-serif', sample: 'Fresh perspective.' },
  { name: 'Bebas Neue', category: 'Display', weight: 400, fallback: 'sans-serif', sample: 'MAKE A STATEMENT' },
  { name: 'Playfair Display', category: 'Serif', weight: 700, fallback: 'serif', sample: 'A little elegance.' },
  { name: 'Caveat', category: 'Handwritten', weight: 700, fallback: 'cursive', sample: 'Made by you.' },
  { name: 'Arial', category: 'Classic', weight: 700, fallback: 'sans-serif', sample: 'Keep it simple.' },
  { name: 'Georgia', category: 'Classic', weight: 700, fallback: 'serif', sample: 'Timeless ideas.' },
] as const;
export type DesignFont = typeof fontChoices[number]['name'];
export const fonts = fontChoices.map(choice => choice.name);
export function fontCSS(font: DesignFont, size: number) {
  const choice = fontChoices.find(item => item.name === font) ?? fontChoices[0];
  return `${choice.weight} ${size}px "${choice.name}", ${choice.fallback}`;
}
