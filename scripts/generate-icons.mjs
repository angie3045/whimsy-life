import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8')
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180], ['icon-maskable', 512]]) {
  // Full-bleed background for maskable icons; the mark stays in the safe circle.
  const source = name === 'icon-maskable' ? svg.replace('rx="112"', 'rx="0"') : svg
  await sharp(Buffer.from(source)).resize(size, size).png()
    .toFile(new URL(`../public/${name}.png`, import.meta.url).pathname)
}
