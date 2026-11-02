/**
 * Ultra-Decorative Frame Generator (1080p Full HD)
 * Creates luxury real estate frames with ornate gold filigree,
 * glassmorphism panels, metallic crests, and decorative badges.
 */

const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const WIDTH = 1920;
const HEIGHT = 1080;

const THEMES = {
  luxury: {
    bg: '#0a0b14',
    gold1: '#f9e79f',
    gold2: '#d4af37',
    gold3: '#996515',
    accent: '#d4af37',
    text: '#ffffff',
    subtext: '#eedcba',
    glassBg: 'rgba(12, 14, 28, 0.82)',
    glassBorder: 'rgba(212, 175, 55, 0.65)',
    glow: 'rgba(212, 175, 55, 0.35)',
  },
  modern: {
    bg: '#080e18',
    gold1: '#80deea',
    gold2: '#00bcd4',
    gold3: '#006064',
    accent: '#00bcd4',
    text: '#ffffff',
    subtext: '#b2ebf2',
    glassBg: 'rgba(8, 14, 24, 0.82)',
    glassBorder: 'rgba(0, 188, 212, 0.65)',
    glow: 'rgba(0, 188, 212, 0.35)',
  },
  classic: {
    bg: '#140c08',
    gold1: '#ffe082',
    gold2: '#ffb300',
    gold3: '#ff6f00',
    accent: '#ffb300',
    text: '#ffffff',
    subtext: '#ffe082',
    glassBg: 'rgba(20, 12, 8, 0.82)',
    glassBorder: 'rgba(255, 179, 0, 0.65)',
    glow: 'rgba(255, 179, 0, 0.35)',
  },
};

/**
 * Draw luxurious metallic gold gradient
 */
function createGoldGradient(ctx, x1, y1, x2, y2, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, t.gold1);
  grad.addColorStop(0.3, t.gold2);
  grad.addColorStop(0.7, t.gold1);
  grad.addColorStop(1, t.gold3);
  return grad;
}

/**
 * Draw intricate ornamental corner filigree brackets
 */
function drawOrnateCorners(ctx, theme) {
  const t = THEMES[theme] || THEMES.luxury;
  const pad = 45;
  const len = 120;

  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 12;

  // 1. Outer hairline border
  ctx.strokeRect(pad, pad, WIDTH - pad * 2, HEIGHT - pad * 2);

  // 2. Inner thin border
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(pad + 10, pad + 10, WIDTH - (pad + 10) * 2, HEIGHT - (pad + 10) * 2);
  ctx.globalAlpha = 1.0;

  // 3. Ornate Corner Brackets (All 4 corners)
  const corners = [
    { x: pad, y: pad, dx: 1, dy: 1 },                           // Top-Left
    { x: WIDTH - pad, y: pad, dx: -1, dy: 1 },                  // Top-Right
    { x: pad, y: HEIGHT - pad, dx: 1, dy: -1 },                 // Bottom-Left
    { x: WIDTH - pad, y: HEIGHT - pad, dx: -1, dy: -1 },        // Bottom-Right
  ];

  corners.forEach(c => {
    // Primary corner accent
    ctx.lineWidth = 4;
    ctx.strokeStyle = createGoldGradient(ctx, c.x, c.y, c.x + c.dx * len, c.y + c.dy * len, theme);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + c.dy * len);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x + c.dx * len, c.y);
    ctx.stroke();

    // Secondary decorative stepped accent
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + c.dx * 16, c.y + c.dy * (len - 25));
    ctx.lineTo(c.x + c.dx * 16, c.y + c.dy * 16);
    ctx.lineTo(c.x + c.dx * (len - 25), c.y + c.dy * 16);
    ctx.stroke();

    // Corner Diamond pip
    ctx.fillStyle = t.gold1;
    drawDiamond(ctx, c.x + c.dx * 28, c.y + c.dy * 28, 8);
  });

  ctx.restore();
}

function drawDiamond(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw Regal Realty Assistant Top Header
 */
function drawRegalHeader(ctx, propertyName, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;

  ctx.save();
  // Header frosted glass pill
  const pillW = 560;
  const pillH = 58;
  const pillX = 65;
  const pillY = 65;

  ctx.fillStyle = t.glassBg;
  roundRect(ctx, pillX, pillY, pillW, pillH, 29);
  ctx.fill();

  ctx.strokeStyle = t.glassBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crest icon
  ctx.fillStyle = t.gold1;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('⚜️ REALTY ASSISTANT', pillX + 24, pillY + 38);

  // Vertical gold divider
  ctx.fillStyle = t.accent;
  ctx.fillRect(pillX + 310, pillY + 14, 2, 30);

  // Exclusive tag
  ctx.font = 'bold 15px Arial';
  ctx.fillStyle = t.subtext;
  ctx.fillText('VIP EXCLUSIVE', pillX + 330, pillY + 38);

  ctx.restore();
}

/**
 * Draw Ornate Decorative Glassmorphism Bottom Panel
 */
function drawDecorativePanel(ctx, scene, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;
  const { primary, secondary, badge } = scene.overlay || {};

  const panelX = 80;
  const panelW = WIDTH - 160;
  const panelH = 260;
  const panelY = HEIGHT - panelH - 75;

  ctx.save();

  // Outer glow shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;

  // Frosted Glass Base
  const grad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  grad.addColorStop(0, 'rgba(14, 16, 32, 0.90)');
  grad.addColorStop(1, 'rgba(8, 10, 20, 0.95)');
  ctx.fillStyle = grad;
  roundRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fill();

  // Metallic Golden Border
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = createGoldGradient(ctx, panelX, panelY, panelX + panelW, panelY + panelH, theme);
  ctx.lineWidth = 2.5;
  roundRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.stroke();

  // Decorative Golden Ribbon / Badge
  if (badge) {
    const badgeW = 280;
    const badgeH = 42;
    const badgeX = panelX + 45;
    const badgeY = panelY + 28;

    const bGrad = createGoldGradient(ctx, badgeX, badgeY, badgeX + badgeW, badgeY + badgeH, theme);
    ctx.fillStyle = bGrad;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    // Badge Text
    ctx.fillStyle = '#0a0b14';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`✦ ${badge.toUpperCase()} ✦`, badgeX + badgeW / 2, badgeY + 27);
  }

  // Primary Feature / Title Text (Large & Bold with drop shadow)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;

  const textLines = wrapText(ctx, primary || '', panelW - 100);
  textLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, panelX + 45, panelY + 125 + idx * 52);
  });

  // Secondary subtext / Specs with gold diamond bullet
  if (secondary) {
    ctx.fillStyle = t.subtext;
    ctx.font = 'bold 24px Arial';
    ctx.shadowBlur = 6;
    ctx.fillText(`◆ ${secondary}`, panelX + 48, panelY + 225);
  }

  // Decorative corner flourishes inside the card
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(panelX + panelW - 40, panelY + 20);
  ctx.lineTo(panelX + panelW - 20, panelY + 20);
  ctx.lineTo(panelX + panelW - 20, panelY + 40);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render a Scene Frame with 4K Image and Decorative Overlays
 */
async function generateFrame(scene, imagePath, propertyName, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // 1. Draw 4K Image (or decorative background)
  if (imagePath && fs.existsSync(imagePath)) {
    try {
      const img = await loadImage(imagePath);
      // Zoom & crop to fill 1920x1080
      const scale = Math.max(WIDTH / img.width, HEIGHT / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (WIDTH - sw) / 2;
      const sy = (HEIGHT - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);

      // Subtle rich vignette / tint
      const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 400, WIDTH / 2, HEIGHT / 2, WIDTH);
      vignette.addColorStop(0, 'rgba(0,0,0,0.15)');
      vignette.addColorStop(1, 'rgba(5, 7, 18, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } catch (e) {
      drawFallbackPattern(ctx, t);
    }
  } else {
    drawFallbackPattern(ctx, t);
  }

  // 2. Draw Ornate Framing & Header
  drawOrnateCorners(ctx, theme);
  drawRegalHeader(ctx, propertyName, theme);

  // 3. Draw Decorative Glassmorphic Info Panel
  drawDecorativePanel(ctx, scene, theme);

  return canvas.toBuffer('image/png');
}

/**
 * Opening Title Frame — Ultra-Decorative Gold Presentation
 */
async function generateTitleFrame(property, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, WIDTH);
  grad.addColorStop(0, '#1c1f3b');
  grad.addColorStop(1, '#080a14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ornate geometric pattern
  drawDecorativeGrid(ctx, t);
  drawOrnateCorners(ctx, theme);

  ctx.save();
  ctx.textAlign = 'center';

  // Royal Crown / Brand Crest
  ctx.font = '54px Arial';
  ctx.fillText('⚜️', WIDTH / 2, HEIGHT / 2 - 250);

  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = t.gold1;
  ctx.letterSpacing = '6px';
  ctx.fillText('REALTY ASSISTANT • PREMIER REAL ESTATE ADVISORY', WIDTH / 2, HEIGHT / 2 - 190);

  // Decorative Golden Divider Line
  drawGoldDivider(ctx, WIDTH / 2, HEIGHT / 2 - 150, 480, theme);

  // Property Type Badge
  const badgeW = 420;
  const badgeH = 50;
  const bGrad = createGoldGradient(ctx, WIDTH / 2 - badgeW / 2, HEIGHT / 2 - 120, WIDTH / 2 + badgeW / 2, HEIGHT / 2 - 70, theme);
  ctx.fillStyle = bGrad;
  roundRect(ctx, WIDTH / 2 - badgeW / 2, HEIGHT / 2 - 120, badgeW, badgeH, 25);
  ctx.fill();

  ctx.fillStyle = '#0a0b14';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`✦ ${(property.type || 'LUXURY RESIDENCE').toUpperCase()} ✦`, WIDTH / 2, HEIGHT / 2 - 87);

  // Property Name in Gilded Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 74px Arial';
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 30;

  const nameLines = wrapText(ctx, property.name || 'The Grand Crest', WIDTH - 240);
  nameLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, WIDTH / 2, HEIGHT / 2 + 10 + idx * 85);
  });

  // Second Divider
  drawGoldDivider(ctx, WIDTH / 2, HEIGHT / 2 + 120, 600, theme);

  // Location with Pin
  ctx.fillStyle = t.subtext;
  ctx.font = 'bold 30px Arial';
  ctx.shadowBlur = 10;
  ctx.fillText(`📍 ${property.location || 'Noida Express Highway'}`, WIDTH / 2, HEIGHT / 2 + 180);

  // Verified Badge at bottom
  ctx.font = '18px Arial';
  ctx.fillStyle = t.gold2;
  ctx.fillText('★ 100% VERIFIED EXCLUSIVE LISTING ★', WIDTH / 2, HEIGHT - 110);

  ctx.restore();
  return canvas.toBuffer('image/png');
}

/**
 * CTA Frame — Regal VIP Closing Card
 */
async function generateCTAFrame(property, theme = 'luxury') {
  const t = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, WIDTH);
  grad.addColorStop(0, '#1c1f3b');
  grad.addColorStop(1, '#080a14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawDecorativeGrid(ctx, t);
  drawOrnateCorners(ctx, theme);

  ctx.save();
  ctx.textAlign = 'center';

  // Royal Crest
  ctx.font = '54px Arial';
  ctx.fillText('🏛️', WIDTH / 2, HEIGHT / 2 - 250);

  // CTA Headline
  ctx.fillStyle = createGoldGradient(ctx, WIDTH / 2 - 400, 0, WIDTH / 2 + 400, 0, theme);
  ctx.font = 'bold 56px Arial';
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 24;
  ctx.fillText(property.cta || 'Schedule Your Exclusive VIP Site Visit!', WIDTH / 2, HEIGHT / 2 - 160);

  drawGoldDivider(ctx, WIDTH / 2, HEIGHT / 2 - 110, 500, theme);

  // Property name reminder
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Arial';
  ctx.fillText(property.name || 'The Grand Crest', WIDTH / 2, HEIGHT / 2 - 40);

  // VIP Contact Box
  const boxW = 860;
  const boxH = 140;
  const boxX = WIDTH / 2 - boxW / 2;
  const boxY = HEIGHT / 2 + 25;

  ctx.fillStyle = t.glassBg;
  roundRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fill();

  ctx.strokeStyle = t.glassBorder;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Contact line
  ctx.fillStyle = t.gold1;
  ctx.font = 'bold 34px Arial';
  ctx.fillText(`📞  ${property.contact || '+91 99990 12345'}`, WIDTH / 2, boxY + 62);

  ctx.fillStyle = t.subtext;
  ctx.font = '22px Arial';
  ctx.fillText('Direct Sales Desk  •  Realty Assistant Pvt. Ltd.', WIDTH / 2, boxY + 105);

  // Footer Tagline
  ctx.fillStyle = t.gold2;
  ctx.font = 'bold 18px Arial';
  ctx.fillText('✦ YOUR TRUSTED LUXURY REAL ESTATE PARTNER ✦', WIDTH / 2, HEIGHT - 100);

  ctx.restore();
  return canvas.toBuffer('image/png');
}

/**
 * Draw a decorative golden divider with a center diamond
 */
function drawGoldDivider(ctx, cx, cy, width, theme) {
  const t = THEMES[theme] || THEMES.luxury;
  ctx.save();
  ctx.strokeStyle = createGoldGradient(ctx, cx - width / 2, cy, cx + width / 2, cy, theme);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy);
  ctx.lineTo(cx - 20, cy);
  ctx.moveTo(cx + 20, cy);
  ctx.lineTo(cx + width / 2, cy);
  ctx.stroke();

  ctx.fillStyle = t.gold1;
  drawDiamond(ctx, cx, cy, 7);
  ctx.restore();
}

function drawDecorativeGrid(ctx, t) {
  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.05;
  for (let x = 0; x < WIDTH; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  ctx.restore();
}

function drawFallbackPattern(ctx, t) {
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, '#0a0d1d');
  grad.addColorStop(1, '#1b1f3c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawDecorativeGrid(ctx, t);
}

function wrapText(ctx, text, maxWidth) {
  const words = (text || '').split(' ');
  const lines = [];
  let current = '';

  words.forEach(word => {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

module.exports = {
  generateFrame,
  generateTitleFrame,
  generateCTAFrame,
  WIDTH,
  HEIGHT,
};
