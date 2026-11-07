// iOS-only 32pt template assets; leave Android's existing 28pt artwork intact.
// Run from any directory: node scripts/generate-ios-tab-icons.cjs
const path = require('node:path');
const fs = require('node:fs/promises');
const { createRequire } = require('node:module');
const appRoot = path.resolve(__dirname, '../himnario');
const sharp = createRequire(path.join(appRoot, 'package.json'))('sharp');
const images = path.join(appRoot, 'assets/images');

async function main() {
  const destination = path.join(images, 'ios-tabs');
  await fs.mkdir(destination, { recursive: true });
  for (const tab of ['home', 'hymns', 'favorites', 'settings']) {
    for (const state of ['outline', 'filled']) {
      const name = `tab-${tab}-${state}`;
      // Use the highest-density original, retaining its alpha/template shape.
      for (const scale of [1, 2, 3]) {
        const suffix = scale === 1 ? '' : `@${scale}x`;
        await sharp(path.join(images, `${name}@3x.png`))
          .resize(32 * scale, 32 * scale, { kernel: 'lanczos3' })
          .png().toFile(path.join(destination, `${name}${suffix}.png`));
      }
    }
  }
  console.log('Generated eight iOS tab icons at 32pt (1x, 2x, 3x).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
