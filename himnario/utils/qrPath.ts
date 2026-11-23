/**
 * Builds a QR code as a single SVG path, drawn on the device.
 *
 * One path (not one rectangle per module) keeps it cheap to render, and the
 * same string is reused for the printed copy, so what you print is vector and
 * stays sharp at any paper size.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createQr = require('qrcode/lib/core/qrcode') as {
  create: (
    text: string,
    options: { errorCorrectionLevel: string },
  ) => { modules: { size: number; data: ArrayLike<number> } };
};

export type QrPath = {
  /** SVG path data, in a coordinate space of `extent` × `extent` units. */
  path: string;
  /** Width of the square viewBox, including the quiet zone. */
  extent: number;
  /** Modules per side, excluding the quiet zone. */
  size: number;
};

/**
 * `margin` is the quiet zone in modules. The QR specification asks for 4;
 * scanners manage with less when the code sits on its own white plate.
 */
export function buildQrPath(text: string, margin = 2): QrPath {
  const { modules } = createQr.create(text, { errorCorrectionLevel: 'M' });
  const { size, data } = modules;
  let path = '';
  for (let row = 0; row < size; row++) {
    let run = 0;
    for (let col = 0; col <= size; col++) {
      // Merge each horizontal run of dark modules into one rectangle.
      const dark = col < size && Boolean(data[row * size + col]);
      if (dark) {
        run++;
        continue;
      }
      if (run > 0) {
        path += `M${col - run + margin} ${row + margin}h${run}v1h-${run}z`;
        run = 0;
      }
    }
  }
  return { path, extent: size + margin * 2, size };
}
