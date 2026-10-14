'use client';
import './tshirt-workspace.css';
import { useEffect, useReducer, useRef, useState, type PointerEvent } from 'react';
import { Download, FolderOpen, ImagePlus, Move, Palette, Redo2, RotateCcw, Save, Trash2, Type, Undo2 } from 'lucide-react';
import { designReducer, draftKey, initialDesign, initialHistory, parseDraft, shirtColours, type Design } from '@/lib/design-workspace';
import { paintDesign, prepareArtwork, previewSize, printArea } from '@/lib/design-canvas';
import { DesignFontPicker } from './design-font-picker';
import { TshirtThreePreview } from './tshirt-three-preview';
import { downloadLocal } from '@/lib/local-download';

export function TshirtWorkspace() {
  const [history, dispatch] = useReducer(designReducer, initialHistory);
  const design = history.present;
  const latestDesign = useRef(design); latestDesign.current = design;
  const canvas = useRef<HTMLCanvasElement>(null);
  const importing = useRef(0);
  const dragging = useRef(false);
  const [layer, setLayer] = useState<'text' | 'artwork'>('text');
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [message, setMessage] = useState('Your changes stay in this tab until you save on this device.');
  const [error, setError] = useState('');
  function change(patch: Partial<Design>) { setError(''); dispatch({ type: 'change', design: { ...design, ...patch } }); }
  function begin() { dispatch({ type: 'begin' }); }
  function end() { dispatch({ type: 'end' }); }
  useEffect(() => {
    try { setHasSaved(localStorage.getItem(draftKey) !== null); } catch { /* Device saving is optional. */ }
    return () => { importing.current++; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const staging = document.createElement('canvas');
    paintDesign(staging, design).then(() => {
      if (cancelled || !canvas.current) return;
      const context = canvas.current.getContext('2d');
      if (!context) throw new Error();
      context.clearRect(0, 0, previewSize.width, previewSize.height);
      context.drawImage(staging, 0, 0);
      setReady(true);
    }).catch(() => { if (!cancelled) setError('The preview could not be drawn. Try removing artwork or reloading the editor.'); });
    return () => { cancelled = true; };
  }, [design]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      const target = event.target;
      if (!(event.ctrlKey || event.metaKey) || event.altKey ||
        target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault(); dispatch({ type: key === 'y' || event.shiftKey ? 'redo' : 'undo' });
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, []);
  function position(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) * previewSize.width / bounds.width - printArea.x) / printArea.width * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) * previewSize.height / bounds.height - printArea.y) / printArea.height * 100));
    change(layer === 'text' ? { textX: x, textY: y } : { artX: x, artY: y });
  }
  async function addArtwork(file: File | undefined) {
    if (!file) return;
    const request = ++importing.current;
    setBusy(true); setError('');
    try {
      const artwork = await prepareArtwork(file);
      if (request !== importing.current) return;
      // Async completion merges with current state, including keyboard undo during decoding.
      dispatch({ type: 'artwork', artwork }); setLayer('artwork');
      setMessage('Artwork prepared locally. It has not been sent to a server.');
    } catch {
      if (request === importing.current) setError('Artwork could not be prepared. Choose a still PNG, JPEG or WebP up to 2 MB, 4096 pixels per side and 16 megapixels.');
    } finally { if (request === importing.current) setBusy(false); }
  }
  function save() {
    end();
    try { localStorage.setItem(draftKey, JSON.stringify(design)); setHasSaved(true); setMessage('Draft saved in this browser. Save again to keep later changes.'); }
    catch { setError('This browser could not save the draft. You can still download the preview.'); }
  }
  function load() {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) { setHasSaved(false); setMessage('There is no saved draft on this device.'); return; }
      const restored = parseDraft(saved);
      dispatch({ type: 'change', design: restored }); setError(''); setMessage('Saved draft restored. Undo returns to your previous design.');
    } catch { setError('The saved draft could not be restored. Start a new design or remove the saved draft.'); }
  }
  function forget() {
    try { localStorage.removeItem(draftKey); setHasSaved(false); setMessage('Saved draft removed. Your current design is still open in this tab.'); }
    catch { setError('This browser could not remove the saved draft.'); }
  }
  async function download() {
    setBusy(true); setError('');
    try {
      const output = document.createElement('canvas');
      await paintDesign(output, design, false);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error()), 'image/png'));
      downloadLocal(blob, 'virtual-ink-tshirt-preview.png');
      setMessage('Preview downloaded. This is a layout reference, not a print-ready proof.');
    } catch { setError('The preview could not be downloaded. Try again after the preview finishes drawing.'); }
    finally { setBusy(false); }
  }
  function exportProject() {
    end(); setError('');
    try {
      downloadLocal(new Blob([JSON.stringify(design)], { type: 'application/json' }), 'virtual-ink-tshirt-design.json');
      setMessage('Editable design file downloaded. It includes your artwork; keep it private and open it here to continue.');
    } catch { setError('The design file could not be downloaded. Try again.'); }
  }
  async function importProject(file: File | undefined) {
    if (!file) return;
    const request = ++importing.current, previous = latestDesign.current;
    setBusy(true); setError(''); end();
    try {
      if (!file.size || file.size > 3_001_000) throw new Error();
      const restored = parseDraft(await file.text());
      // Confirm image decoding before replacing an existing design.
      await paintDesign(document.createElement('canvas'), restored);
      if (request !== importing.current) return;
      if (latestDesign.current !== previous) { setError('Your design changed while the file was opening. Open it again to restore.'); return; }
      dispatch({ type: 'change', design: restored }); setLayer(restored.artwork ? 'artwork' : 'text');
      setMessage('Design file opened. Undo returns to your previous design.');
    } catch { if (request === importing.current) setError('This design file could not be opened. Use an exported T-shirt JSON file up to 3 MB with supported local artwork.'); }
    finally { if (request === importing.current) setBusy(false); }
  }
  const xKey = layer === 'text' ? 'textX' : 'artX', yKey = layer === 'text' ? 'textY' : 'artY';
  const sizeKey = layer === 'text' ? 'textSize' : 'artSize';
  const ranges = [
    { label: 'Horizontal position', key: xKey, min: 0, max: 100, unit: '%' },
    { label: 'Vertical position', key: yKey, min: 0, max: 100, unit: '%' },
    { label: layer === 'text' ? 'Text size' : 'Artwork size', key: sizeKey, min: layer === 'text' ? 16 : 10, max: layer === 'text' ? 56 : 100, unit: layer === 'text' ? '' : '%' },
  ] as const;
  return <div className="design-workspace">
    <div className="workspace-actions"><div><span className="workspace-step">01 / CREATE YOUR CONCEPT</span><p>Cotton T-Shirt <span>·</span> Front placement guide</p></div>
      <div className="workspace-history"><button type="button" className="workspace-icon" aria-label="Undo design change" disabled={busy || !history.past.length && !history.start} onClick={() => dispatch({ type: 'undo' })}><Undo2 size={18} /></button>
        <button type="button" className="workspace-icon" aria-label="Redo design change" disabled={busy || !history.future.length} onClick={() => dispatch({ type: 'redo' })}><Redo2 size={18} /></button>
        <button type="button" className="workspace-icon" aria-label="Reset design" disabled={busy} onClick={() => { dispatch({ type: 'change', design: initialDesign }); setLayer('text'); setMessage('Design reset. Undo brings your previous design back.'); }}><RotateCcw size={18} /></button></div></div>
    <div className="workspace-grid"><aside className="workspace-tools" aria-label="Design controls"><fieldset disabled={busy}>
      <div className="workspace-panel-heading"><Type size={19} /><h2>Your words, your way.</h2></div>
      <label className="workspace-field" htmlFor="design-text">Text<textarea id="design-text" aria-describedby="design-text-help" value={design.text} maxLength={72} rows={3} onFocus={begin} onBlur={end} onChange={event => {
        if (event.target.value.split('\n').length > 3 || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(event.target.value)) { setError('Use up to three lines of text.'); return; }
        change({ text: event.target.value }); setLayer('text');
      }} /></label><p id="design-text-help" className="workspace-hint">Up to 72 characters and three lines. Long lines shrink to fit.</p>
      <DesignFontPicker value={design.font} onChange={font => change({font})} />
      <label className="workspace-field workspace-ink-colour">Ink colour<input type="color" value={design.colour} onFocus={begin} onBlur={end} onChange={event => change({ colour: event.target.value })} /></label>
      <div className="workspace-divider" /><div className="workspace-panel-heading"><ImagePlus size={19} /><h2>Add your artwork.</h2></div>
      <label className="artwork-picker" htmlFor="design-artwork">{design.artwork ? 'Replace artwork' : 'Choose artwork'}<input id="design-artwork" aria-describedby="design-artwork-help" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void addArtwork(file); }} /></label>
      <p id="design-artwork-help" className="workspace-hint">Still PNG, JPEG or WebP · Up to 2 MB.<br />Artwork is prepared in your browser.</p>
      {design.artwork && <button type="button" className="workspace-text-button" onClick={() => { change({ artwork: null }); setLayer('text'); }}><Trash2 size={15} /> Remove artwork</button>}
      <div className="workspace-divider" /><div className="workspace-panel-heading"><Palette size={19} /><h2>The canvas for your idea.</h2></div>
      <div className="shirt-swatches" aria-label="Shirt colour">{Object.entries(shirtColours).map(([name, colour]) => <button type="button" key={name} className={`shirt-swatch ${design.shirt === name ? 'selected' : ''}`} aria-label={`${name[0].toUpperCase()}${name.slice(1)} shirt`} aria-pressed={design.shirt === name} onClick={() => change({ shirt: name as Design['shirt'] })}><span style={{ background: colour }} />{name}</button>)}</div>
    </fieldset></aside>
    <section className="workspace-preview" aria-label="Design preview"><div className="workspace-preview-bar"><span>{view === '2d' ? 'FRONT / 2D GUIDE' : 'EXPLORE / 3D SHIRT'}</span><span className="workspace-preview-badge">{ready ? 'Live preview' : 'Drawing preview…'}</span></div>
      <div className="workspace-view-switch" aria-label="Preview mode"><button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}>2D placement</button><button type="button" aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D shirt</button></div>
      {view === '3d' && <TshirtThreePreview design={design} onFallback={() => setView('2d')} />}
      <div hidden={view !== '2d'}>
      <canvas ref={canvas} width={previewSize.width} height={previewSize.height} tabIndex={0} aria-label="T-shirt design preview. Use placement controls to move your text or artwork." aria-describedby="design-preview-summary" onPointerDown={event => { if (busy || layer === 'artwork' && !design.artwork) return; dragging.current = true; begin(); event.currentTarget.setPointerCapture(event.pointerId); position(event); }} onPointerMove={event => { if (dragging.current) position(event); }} onPointerUp={() => { dragging.current = false; end(); }} onPointerCancel={() => { dragging.current = false; end(); }} onLostPointerCapture={() => { dragging.current = false; end(); }}>Your browser needs canvas support to display this design preview.</canvas>
      </div><div className="workspace-preview-footer"><Move size={16} /><p>{view === '2d' ? 'Drag the selected layer, or use the placement controls.' : 'Turn the shirt to explore your concept.'}</p></div>
      <p id="design-preview-summary" className="sr-only">{design.shirt} shirt. Text: {design.text || 'None'}. Typeface: {design.font}. {design.artwork ? 'One artwork image added.' : 'No artwork image.'}</p>
    </section>
    <aside className="workspace-placement" aria-label="Placement and draft controls"><fieldset disabled={busy}><div className="workspace-panel-heading"><Move size={19} /><h2>A place for everything.</h2></div>
      <div className="workspace-layer-picker" aria-label="Selected layer"><button type="button" aria-pressed={layer === 'text'} onClick={() => setLayer('text')}><Type size={15} /> Text</button><button type="button" aria-pressed={layer === 'artwork'} disabled={!design.artwork} onClick={() => setLayer('artwork')}><ImagePlus size={15} /> Artwork</button></div>
      {ranges.map(range => <label className="placement-control" key={range.key}><span>{range.label}<output>{Math.round(design[range.key])}{range.unit}</output></span><input type="range" aria-label={range.label} min={range.min} max={range.max} value={design[range.key]} onFocus={begin} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onBlur={end} disabled={layer === 'artwork' && !design.artwork} onChange={event => change({ [range.key]: Number(event.target.value) })} /></label>)}
      {layer === 'text' && <label className="placement-control"><span>Rotation<output>{Math.round(design.rotation)}°</output></span><input type="range" aria-label="Rotation" aria-valuetext={`${Math.round(design.rotation)} degrees`} min={-180} max={180} step={5} value={design.rotation} onFocus={begin} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onBlur={end} onChange={event => change({ rotation: Number(event.target.value) })} /></label>}
      <button type="button" className="workspace-text-button" onClick={() => change(layer === 'text' ? { textX: 50, textY: 50, rotation: 0 } : { artX: 50, artY: 50 })} disabled={layer === 'artwork' && !design.artwork}><Move size={15} /> Centre selected layer</button>
      <div className="workspace-divider" /><p className="workspace-guide-note">A placement concept, ready to explore.<br />Colours and the guide area are illustrative. Vendor specifications and print proofs come later.</p>
      <button type="button" className="button button-primary workspace-download" disabled={!ready} onClick={() => void download()}><Download size={17} /> Download preview</button>
      <button type="button" className="workspace-save" onClick={exportProject}><Download size={16} /> Download editable design</button>
      <label className="artwork-picker workspace-project-picker" htmlFor="design-project">Open a design file<input id="design-project" type="file" accept="application/json,.json" aria-describedby="design-project-help" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importProject(file); }} /></label>
      <p id="design-project-help" className="workspace-hint">Exported JSON · Up to 3 MB. Opens locally; Undo restores your previous work.</p>
      <button type="button" className="workspace-save" onClick={save}><Save size={16} /> Save on this device</button>
      <p className="workspace-hint">Device drafts include your artwork. Use a private device; remove the saved draft when finished.</p>
      {hasSaved && <div className="workspace-draft-actions"><button type="button" onClick={load}><FolderOpen size={15} /> Load saved draft</button><button type="button" onClick={forget}><Trash2 size={15} /> Remove saved draft</button></div>}
    </fieldset></aside></div>
    <div className="workspace-status"><p role="status" aria-label="Design status">{busy ? 'Preparing your design…' : message}</p>{error && <p role="alert">{error}</p>}</div>
  </div>;
}
