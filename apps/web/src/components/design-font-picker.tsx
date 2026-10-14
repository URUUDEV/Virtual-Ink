'use client';
import { fontChoices, type DesignFont } from '@/lib/design-fonts';
export function DesignFontPicker({ value, onChange }: { value: DesignFont; onChange: (font: DesignFont) => void }) {
  return <fieldset className="font-picker"><legend>Choose your typeface</legend>
    <div className="font-choice-grid">{fontChoices.map(font => <label className={`font-choice ${font.name === value ? 'selected' : ''}`} key={font.name}>
      <input type="radio" name="design-font" value={font.name} checked={value === font.name} onChange={() => onChange(font.name)} />
      <span className="font-choice-meta"><span>{font.name}</span><small>{font.category}</small></span>
      <span className="font-choice-sample" style={{ fontFamily: `"${font.name}", ${font.fallback}`, fontWeight: font.weight }}>{font.sample}</span>
    </label>)}</div>
    <p className="workspace-hint">Typefaces are included with the editor. Your PNG preview uses the selected font.</p>
  </fieldset>;
}
