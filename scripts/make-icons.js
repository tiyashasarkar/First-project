// One-off script: renders the Blossom app icon at every size iOS/Android need.
// Pure Node, zero dependencies (hand-rolled PNG encoder) so nothing needs to be installed.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "icons");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- tiny PNG encoder ----
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk("IDAT", idatData);
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// ---- icon drawing (procedural, no external art assets) ----
function lerp(a, b, t) { return a + (b - a) * t; }

function drawIcon(size, { squircleMask = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);

  // palette
  const bgA = [0xf6, 0xc9, 0xd8]; // powder pink
  const bgB = [0xd9, 0x8f, 0xac]; // dusty rose / mauve
  const petal = [0xff, 0xfb, 0xf7]; // warm white
  const petalShadow = [0xf3, 0xd8, 0xe0];
  const center = [0xf3, 0xc0, 0x7c]; // soft gold

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x - cx) / R;
      const ny = (y - cy) / R;
      const dist = Math.sqrt(nx * nx + ny * ny);

      // diagonal gradient background
      const t = Math.max(0, Math.min(1, (nx + ny + 1.4) / 2.8));
      let r = lerp(bgA[0], bgB[0], t);
      let g = lerp(bgA[1], bgB[1], t);
      let b = lerp(bgA[2], bgB[2], t);
      let a = 255;

      if (squircleMask) {
        // superellipse mask so standalone previews look like a rounded-square app icon
        const p = 4;
        const sd = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
        if (sd > Math.pow(0.98, p)) a = 0;
        else if (sd > Math.pow(0.94, p)) a = 255 * (1 - (sd - Math.pow(0.94, p)) / (Math.pow(0.98, p) - Math.pow(0.94, p)));
      }

      // five-petal blossom made of overlapping soft circles
      const petalR = 0.27;
      const petalOffset = 0.33;
      let inPetal = false;
      let petalDist = Infinity;
      for (let k = 0; k < 5; k++) {
        const angle = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        const px = Math.cos(angle) * petalOffset;
        const py = Math.sin(angle) * petalOffset;
        const dx = nx - px;
        const dy = ny - py;
        const d = Math.sqrt(dx * dx + dy * dy) / petalR;
        if (d < petalDist) petalDist = d;
        if (d <= 1) inPetal = true;
      }
      const centerR = 0.155;
      const centerDist = dist / centerR;

      if (inPetal || centerDist <= 1) {
        // soft edge antialiasing
        const edge = Math.min(petalDist, centerDist <= 1 ? 0 : petalDist);
        let mix = 1;
        if (petalDist > 0.88 && petalDist < 1.06 && centerDist > 1) {
          mix = 1 - Math.min(1, Math.max(0, (petalDist - 0.88) / 0.18));
        }
        const isCenter = centerDist <= 1;
        const baseColor = isCenter ? center : petal;
        // gentle shading toward the outer edge of each petal for dimension
        const shadeT = isCenter ? 0 : Math.min(1, petalDist * 0.9);
        const cr = lerp(baseColor[0], petalShadow[0], shadeT * 0.5);
        const cg = lerp(baseColor[1], petalShadow[1], shadeT * 0.5);
        const cb = lerp(baseColor[2], petalShadow[2], shadeT * 0.5);
        r = lerp(r, cr, mix);
        g = lerp(g, cg, mix);
        b = lerp(b, cb, mix);
      }

      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(a);
    }
  }
  return rgba;
}

const sizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 167, 180, 192, 384, 512];
for (const s of sizes) {
  const rgba = drawIcon(s, { squircleMask: false });
  const png = encodePNG(s, s, rgba);
  fs.writeFileSync(path.join(OUT_DIR, `icon-${s}.png`), png);
}
// maskable icon (Android adaptive) needs extra safe-area padding baked in — reuse 512 with mask off, that's fine since our art already sits well within the safe zone.
fs.copyFileSync(path.join(OUT_DIR, "icon-512.png"), path.join(OUT_DIR, "icon-512-maskable.png"));

console.log("Icons written to", OUT_DIR);
