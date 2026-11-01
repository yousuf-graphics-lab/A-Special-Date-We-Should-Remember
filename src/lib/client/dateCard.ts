/**
 * html-to-image is only ever imported here, and only inside the click handler —
 * it stays out of the initial bundle entirely.
 */
export async function generateDateCard(node: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image');

  // Make sure both variable fonts are actually ready before rasterising.
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts not ready — the card still renders with fallbacks */
    }
  }

  return toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: '#0B0713',
    width: 440,
    height: 620,
    style: { transform: 'none', margin: '0' },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
