// 生成占位扩展图标：#00A1D6 圆角底 + 白色禁止符号（屏蔽语义）。
// 手工构造 PNG（IHDR/IDAT/IEND + zlib），无第三方依赖。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICON_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const SIZES = [16, 32, 48, 128];

const BG = [0x00, 0xa1, 0xd6]; // #00A1D6
const FG = [0xff, 0xff, 0xff];
const TRANSPARENT = [0, 0, 0];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([length, crcInput, crc]);
}

function isTransparent(x, y, size) {
  // 圆角：四角各切 size/8 半径的 1/4 圆
  const radius = size / 8;
  const corner = (cx, cy) => (x - cx) ** 2 + (y - cy) ** 2 > radius ** 2;
  if (x < radius && y < radius) return corner(radius, radius);
  if (x >= size - radius && y < radius) return corner(size - radius - 1, radius);
  if (x < radius && y >= size - radius) return corner(radius, size - radius - 1);
  if (x >= size - radius && y >= size - radius) return corner(size - radius - 1, size - radius - 1);
  return false;
}

function glyphColor(x, y, size) {
  // 禁止符号：圆环 + 45° 斜杠
  const center = (size - 1) / 2;
  const outerRadius = size * 0.36;
  const ringWidth = Math.max(1.5, size * 0.09);
  const distance = Math.hypot(x - center, y - center);
  if (distance <= outerRadius && distance >= outerRadius - ringWidth) {
    return FG;
  }
  // 斜杠：沿 y = x 方向，宽度约为环宽
  const diagonal = Math.abs(x - y) / Math.SQRT2;
  if (diagonal <= ringWidth / 2 && distance <= outerRadius - ringWidth / 2) {
    return FG;
  }
  return null;
}

function makeIcon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      let rgb = BG;
      if (isTransparent(x, y, size)) {
        rgb = TRANSPARENT;
        raw[pixelStart + 3] = 0;
      } else {
        const glyph = glyphColor(x, y, size);
        if (glyph) rgb = glyph;
        raw[pixelStart + 3] = 255;
      }
      raw[pixelStart] = rgb[0];
      raw[pixelStart + 1] = rgb[1];
      raw[pixelStart + 2] = rgb[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // compression / filter / interlace = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(ICON_DIR, { recursive: true });
for (const size of SIZES) {
  writeFileSync(join(ICON_DIR, `icon-${size}.png`), makeIcon(size));
  console.info(`icons/icon-${size}.png 已生成`);
}
