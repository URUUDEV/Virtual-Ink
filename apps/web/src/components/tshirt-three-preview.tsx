'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Design } from '@/lib/design-workspace';
import type { ShirtViewer } from '@/lib/shirt-3d';
import { downloadLocal } from '@/lib/local-download';
export function TshirtThreePreview({ design, onFallback }: { design: Design; onFallback: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), viewer = useRef<ShirtViewer | null>(null);
  const latest = useRef(design);
  useLayoutEffect(() => { latest.current = design; }, [design]);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [side, setSide] = useState('angle');
  const [exporting, setExporting] = useState(false), [exportMessage, setExportMessage] = useState('');
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    async function start() {
      try {
        const { createShirtViewer } = await import('@/lib/shirt-3d');
        if (cancelled || !canvas.current) return;
        const current = createShirtViewer(canvas.current, () => { if (!cancelled) setState('failed'); });
        viewer.current = current; await current.update(latest.current);
        if (!cancelled) setState('ready');
      } catch { if (!cancelled) setState('failed'); }
    }
    void start();
    return () => { alive.current = false; cancelled = true; viewer.current?.dispose(); viewer.current = null; };
  }, []);
  useEffect(() => {
    if (!viewer.current) return;
    void viewer.current.update(design).catch(() => setState('failed'));
  }, [design]);
  async function downloadView() {
    const current = viewer.current; if (!current || exporting) return;
    setExporting(true); setExportMessage('');
    try {
      const blob = await current.snapshot(design);
      if (!alive.current) return;
      downloadLocal(blob, 'virtual-ink-tshirt-3d.png'); setExportMessage('3D view downloaded as a PNG concept preview.');
    } catch { if (alive.current) setExportMessage('The 3D view could not be downloaded. Let the preview finish, then try again.'); }
    finally { if (alive.current) setExporting(false); }
  }
  return <div className="three-preview">
    <div className="three-stage"><canvas ref={canvas} tabIndex={state === 'ready' ? 0 : -1}
      aria-label="Interactive 3D T-shirt. Drag to rotate or use arrow keys. Use view buttons for front and back."
      aria-describedby="three-preview-help" data-testid="shirt-3d-canvas" onKeyDown={event => {
        const movement: Record<string, [number,number]> = { ArrowLeft: [-.15,0], ArrowRight: [.15,0], ArrowUp: [0,-.1], ArrowDown: [0,.1] };
        if (Object.hasOwn(movement,event.key)) { event.preventDefault(); viewer.current?.rotate(...movement[event.key]); setSide('custom'); }
      }} onPointerDown={event => {
        if (state !== 'ready') return;
        dragging.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus();
      }} onPointerMove={event => {
        if (!dragging.current) return;
        viewer.current?.rotate((event.clientX-dragging.current.x)*.01,(event.clientY-dragging.current.y)*.005);
        dragging.current = { x:event.clientX,y:event.clientY }; setSide('custom');
      }} onPointerUp={() => { dragging.current=null; }} onPointerCancel={() => { dragging.current=null; }} onLostPointerCapture={() => { dragging.current=null; }} />
      {state === 'loading' && <p className="three-overlay" role="status">Preparing your 3D shirt…</p>}
      {state === 'failed' && <div className="three-overlay" role="status"><p>3D preview is unavailable in this browser.</p><button type="button" onClick={onFallback}>Return to the 2D guide</button></div>}
      <span className="three-stage-caption">COTTON T-SHIRT / CONCEPT MODEL</span>
    </div>
    <div className="three-controls" aria-label="3D view controls">
      {(['front','back','angle'] as const).map(view => <button key={view} type="button" disabled={state !== 'ready'} aria-pressed={side === view} onClick={() => { viewer.current?.view(view); setSide(view); }}>{view === 'angle' ? 'Reset view' : view === 'front' ? 'Front' : 'Back'}</button>)}
      <button type="button" aria-label="Zoom in on shirt" disabled={state !== 'ready'} onClick={()=>viewer.current?.zoom(-.6)}>+</button>
      <button type="button" aria-label="Zoom out from shirt" disabled={state !== 'ready'} onClick={()=>viewer.current?.zoom(.6)}>−</button>
      <button type="button" disabled={state !== 'ready' || exporting} onClick={() => void downloadView()}>{exporting ? 'Preparing image…' : 'Download 3D view'}</button>
    </div>
    <p className="workspace-hint" id="three-preview-help">Drag or use arrow keys to turn the shirt. Artwork appears on the front. Download this angle as a 3D image, or use Download preview for the 2D layout. Both are concept references.</p>
    <p className="workspace-hint" role="status">{exportMessage}</p>
  </div>;
}
