/** Fixed-name local downloads. Never accepts a remote URL or caller-supplied path. */
type LocalFilename = 'virtual-ink-tshirt-preview.png' | 'virtual-ink-tshirt-3d.png' | 'virtual-ink-tshirt-design.json' | 'virtual-ink-vendor-profile.json' | 'virtual-ink-vendor-draft.json';
export function downloadLocal(blob: Blob, filename: LocalFilename) {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}
