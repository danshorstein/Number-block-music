/**
 * Generates the PWA icons: a four-block staircase on the app's background.
 *
 * Hand-rolled PNG encoding because this container has no image tooling, and a build
 * that depends on ImageMagick being present is a build that breaks on someone else's
 * machine. Run with: node scripts/make-icons.mjs
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BACKGROUND = [27, 17, 54]
const BARS = [
  { fill: [226, 59, 52], shade: [182, 43, 38] },
  { fill: [251, 210, 74], shade: [217, 174, 40] },
  { fill: [47, 168, 220], shade: [33, 131, 174] },
  { fill: [142, 82, 184], shade: [110, 62, 144] },
]

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor
  const raw = Buffer.alloc(height * (width * 3 + 1))
  let offset = 0
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0 // no per-scanline filter
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3
      raw[offset++] = rgb[index]
      raw[offset++] = rgb[index + 1]
      raw[offset++] = rgb[index + 2]
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 3)
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BACKGROUND[0]
    pixels[i * 3 + 1] = BACKGROUND[1]
    pixels[i * 3 + 2] = BACKGROUND[2]
  }

  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const index = (y * size + x) * 3
    pixels[index] = color[0]
    pixels[index + 1] = color[1]
    pixels[index + 2] = color[2]
  }

  // Maskable-safe: the staircase stays inside the middle 80% so a circular mask
  // cannot crop it.
  const margin = Math.round(size * 0.18)
  const usable = size - margin * 2
  const cube = usable / 4
  const baseline = size - margin

  BARS.forEach((bar, column) => {
    const height = cube * (column + 1)
    const left = Math.round(margin + column * cube + cube * 0.08)
    const right = Math.round(margin + (column + 1) * cube - cube * 0.08)
    const top = Math.round(baseline - height)
    const lipStart = Math.round(baseline - cube * 0.16)

    for (let y = top; y < baseline; y++) {
      for (let x = left; x < right; x++) {
        put(x, y, y >= lipStart ? bar.shade : bar.fill)
      }
    }
  })

  return encodePng(size, size, pixels)
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), drawIcon(size))
  console.log(`wrote icon-${size}.png`)
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1b1136"/>
  ${BARS.map((bar, i) => {
    const cube = 44 / 4
    const height = cube * (i + 1)
    return `<rect x="${10 + i * cube + 0.8}" y="${54 - height}" width="${cube - 1.6}" height="${height}" rx="2" fill="rgb(${bar.fill.join(',')})"/>`
  }).join('\n  ')}
</svg>
`
writeFileSync(join(OUT_DIR, 'favicon.svg'), favicon)
console.log('wrote favicon.svg')
