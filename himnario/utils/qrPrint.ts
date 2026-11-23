/**
 * The printable page for a QR code (a church or a hymn): heading, optional
 * subheading, the code as inline vector SVG, a scanning hint and the app name.
 * Pure string building, so it can be tested without a device.
 */
import type { QrPath } from './qrPath';

export const QR_INK = '#1A1412';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

export function qrPrintHtml(page: {
  title: string;
  subtitle?: string;
  hint: string;
  brand: string;
  qr: QrPath;
}): string {
  const { title, subtitle, hint, brand, qr } = page;
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { margin: 28px; }
  body { font-family: -apple-system, "Helvetica Neue", Roboto, sans-serif;
         text-align: center; color: ${QR_INK}; padding: 24px 16px; }
  h1 { font-size: 30px; margin: 0 0 6px; }
  .subtitle { font-size: 15px; color: #5A5048; margin: 0 0 26px; }
  svg { width: 340px; height: 340px; }
  .hint { font-size: 16px; margin: 24px auto 4px; max-width: 420px; line-height: 1.45; }
  .brand { font-size: 13px; color: #6e1619; margin-top: 18px; letter-spacing: 0.4px; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">${escapeHtml(subtitle ?? '')}</p>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.extent} ${qr.extent}" shape-rendering="crispEdges">
    <rect width="${qr.extent}" height="${qr.extent}" fill="#FFFFFF"/>
    <path d="${qr.path}" fill="${QR_INK}"/>
  </svg>
  <p class="hint">${escapeHtml(hint)}</p>
  <p class="brand">${escapeHtml(brand)}</p>
</body></html>`;
}
