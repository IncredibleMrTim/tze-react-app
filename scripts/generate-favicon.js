import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Generate favicon with "TZE" text
function generateFavicon(size, darkMode = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background (no fill)

  // Set font - Impact, bold - maximize size without clipping
  const fontSize = size * 0.54; // Maximum size that fits
  ctx.font = `${fontSize}px Impact, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Measure text to position it centered
  const tWidth = ctx.measureText('T').width;
  const zeWidth = ctx.measureText('ZE').width;
  const totalWidth = tWidth + zeWidth;

  // Center the text horizontally
  let x = (size - totalWidth) / 2;
  const y = size / 2;

  // Draw "T" - black for light mode, light gray for dark mode
  ctx.fillStyle = darkMode ? 'rgb(220, 220, 220)' : 'black';
  ctx.fillText('T', x, y);

  // Draw "ZE" - blue for both modes
  x += tWidth;
  ctx.fillStyle = 'rgb(73, 165, 226)';
  ctx.fillText('ZE', x, y);

  return canvas;
}

// Generate multiple sizes
const sizes = [16, 32, 48, 192, 512];
const publicDir = './public';

// Generate light mode favicons
sizes.forEach(size => {
  const canvas = generateFavicon(size, false);
  const buffer = canvas.toBuffer('image/png');
  const filename = size === 512 ? 'favicon-512.png' : size === 192 ? 'favicon-192.png' : `favicon-${size}x${size}.png`;
  writeFileSync(join(publicDir, filename), buffer);
  console.log(`Generated ${filename}`);
});

// Generate dark mode favicons
sizes.forEach(size => {
  const canvas = generateFavicon(size, true);
  const buffer = canvas.toBuffer('image/png');
  const filename = size === 512 ? 'favicon-512-dark.png' : size === 192 ? 'favicon-192-dark.png' : `favicon-${size}x${size}-dark.png`;
  writeFileSync(join(publicDir, filename), buffer);
  console.log(`Generated ${filename} (dark mode)`);
});

// Generate the main favicon.ico size (32x32 is standard)
const mainCanvas = generateFavicon(32);
const mainBuffer = mainCanvas.toBuffer('image/png');
writeFileSync(join(publicDir, 'favicon.png'), mainBuffer);
console.log('Generated favicon.png');

console.log('Favicon generation complete!');
