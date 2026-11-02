/**
 * Image Frame Generator
 * Creates styled frames (PNG images) for each video scene using Canvas
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const WIDTH = 1280;
const HEIGHT = 720;

// Color palette for real estate videos
const THEMES = {
  luxury: {
    bg: '#1a1a2e',
    accent: '#c9a84c',
    text: '#ffffff',
    subtext: '#e0d5b5',
    badge: '#c9a84c',
    badgeText: '#1a1a2e',
    overlay: 'rgba(26, 26, 46, 0.75)',
  },
  modern: {
    bg: '#0d1b2a',
    accent: '#00bcd4',
    text: '#ffffff',
    subtext: '#b0bec5',
    badge: '#00bcd4',
    badgeText: '#0d1b2a',
    overlay: 'rgba(13, 27, 42, 0.72)',
  },
  classic: {
    bg: '#2c1810',
    accent: '#d4a853',
    text: '#f5f0e8',
    subtext: '#e8dcc8',
    badge: '#d4a853',
    badgeText: '#2c1810',
    overlay: 'rgba(44, 24, 16, 0.70)',
  },
};

/**
 * Draw a gradient background
 */
function drawBackground(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colors.bg);
  gradient.addColorStop(1, shadeColor(colors.bg, 40));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

/**
 * Draw decorative geometric elements
 */
function drawDecorations(ctx, theme) {
  const colors = THEMES[theme] || THEMES.luxury;

  // Top-left corner accent
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(160, 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(40, 160);
  ctx.stroke();

  // Bottom-right corner accent
  ctx.beginPath();
  ctx.moveTo(WIDTH - 40, HEIGHT - 40);
  ctx.lineTo(WIDTH - 160, HEIGHT - 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(WIDTH - 40, HEIGHT - 40);
  ctx.lineTo(WIDTH - 40, HEIGHT - 160);
  ctx.stroke();

  // Subtle diagonal lines
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  for (let i = -HEIGHT; i < WIDTH + HEIGHT; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + HEIGHT, HEIGHT);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw a badge/pill element
 */
function drawBadge(ctx, text, x, y, colors) {
  if (!text) return;
  ctx.font = 'bold 16px Arial';
  const textWidth = ctx.measureText(text).width;
  const padX = 20;
  const padY = 8;
  const bw = textWidth + padX * 2;
  const bh = 36;

  // Badge background
  ctx.fillStyle = colors.badge;
  roundRect(ctx, x, y - bh / 2, bw, bh, 18);
  ctx.fill();

  // Badge text
  ctx.fillStyle = colors.badgeText;
  ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), x + bw / 2, y + 5);
}

/**
 * Draw the main text overlay panel
 */
function drawTextPanel(ctx, scene, colors) {
  const { primary, secondary, badge } = scene.overlay;

  // Semi-transparent panel at bottom
  const panelH = 220;
  const gradient = ctx.createLinearGradient(0, HEIGHT - panelH, 0, HEIGHT);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, colors.overlay);
  gradient.addColorStop(1, colors.overlay);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, HEIGHT - panelH, WIDTH, panelH);

  // Accent line
  ctx.fillStyle = colors.accent;
  ctx.fillRect(60, HEIGHT - panelH + 20, 5, panelH - 40);

  // Badge
  if (badge) {
    drawBadge(ctx, badge, 80, HEIGHT - panelH + 40, colors);
  }

  // Primary text (property name / main info)
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.text;
  const primaryFontSize = primary && primary.length > 30 ? 36 : 44;
  ctx.font = `bold ${primaryFontSize}px Arial`;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;

  // Word-wrap primary text
  const maxWidth = WIDTH - 120;
  const lines = wrapText(ctx, primary || '', maxWidth);
  lines.forEach((line, idx) => {
    ctx.fillText(line, 80, HEIGHT - 140 + idx * (primaryFontSize + 8));
  });

  // Secondary text
  if (secondary) {
    ctx.fillStyle = colors.subtext;
    ctx.font = '22px Arial';
    ctx.shadowBlur = 4;
    ctx.fillText(secondary, 80, HEIGHT - 50);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Draw a top header bar
 */
function drawHeader(ctx, propertyName, colors) {
  // Top gradient bar
  const gradient = ctx.createLinearGradient(0, 0, 0, 80);
  gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, 80);

  // Property name top-left
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = colors.accent;
  ctx.textAlign = 'left';
  ctx.fillText('🏠 ' + (propertyName || 'Realty Assistant'), 60, 40);

  // Accent bar top
  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, WIDTH, 4);
}

/**
 * Generate a scene frame with property image background
 */
async function generateFrame(scene, imagePath, propertyName, theme = 'luxury') {
  const colors = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // 1. Draw background (solid color fallback)
  drawBackground(ctx, colors);

  // 2. Draw image if available
  if (imagePath && fs.existsSync(imagePath)) {
    try {
      const img = await loadImage(imagePath);
      // Scale to cover
      const scale = Math.max(WIDTH / img.width, HEIGHT / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (WIDTH - sw) / 2;
      const sy = (HEIGHT - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);

      // Dark overlay on the image
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } catch (e) {
      // Image load failed, use synthetic background
      drawDecorations(ctx, theme);
    }
  } else {
    // No image - draw decorative background
    drawDecorations(ctx, theme);
    // Draw a centered real estate icon placeholder
    drawPropertyIcon(ctx, colors);
  }

  // 3. Draw UI elements
  drawHeader(ctx, propertyName, colors);
  drawTextPanel(ctx, scene, colors);

  return canvas.toBuffer('image/png');
}

/**
 * Generate a synthetic property icon when no image is available
 */
function drawPropertyIcon(ctx, colors) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 30;
  const size = 120;

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.3;

  // House shape
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy - size * 0.2);
  ctx.lineTo(cx + size, cy + size * 0.6);
  ctx.lineTo(cx - size, cy + size * 0.6);
  ctx.lineTo(cx - size, cy - size * 0.2);
  ctx.closePath();
  ctx.stroke();

  // Door
  ctx.strokeRect(cx - 25, cy + size * 0.1, 50, size * 0.5);

  // Windows
  ctx.strokeRect(cx - size * 0.7, cy - size * 0.05, 45, 35);
  ctx.strokeRect(cx + size * 0.4, cy - size * 0.05, 45, 35);

  ctx.globalAlpha = 1;
}

/**
 * Generate a special opening title frame
 */
async function generateTitleFrame(property, theme = 'luxury') {
  const colors = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  drawBackground(ctx, colors);
  drawDecorations(ctx, theme);

  // Large centered title
  ctx.textAlign = 'center';

  // Property type badge
  const badge = property.type || 'Real Estate';
  ctx.font = 'bold 18px Arial';
  const bw = ctx.measureText(badge.toUpperCase()).width + 48;
  ctx.fillStyle = colors.badge;
  roundRect(ctx, WIDTH / 2 - bw / 2, HEIGHT / 2 - 160, bw, 40, 20);
  ctx.fill();
  ctx.fillStyle = colors.badgeText;
  ctx.fillText(badge.toUpperCase(), WIDTH / 2, HEIGHT / 2 - 133);

  // Property name
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 64px Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 15;
  const nameLines = wrapText(ctx, property.name || 'Luxury Property', WIDTH - 120);
  nameLines.forEach((line, idx) => {
    ctx.fillText(line, WIDTH / 2, HEIGHT / 2 - 60 + idx * 74);
  });

  // Separator line
  ctx.fillStyle = colors.accent;
  ctx.fillRect(WIDTH / 2 - 80, HEIGHT / 2 + 20, 160, 4);

  // Location
  if (property.location) {
    ctx.fillStyle = colors.subtext;
    ctx.font = '28px Arial';
    ctx.shadowBlur = 6;
    ctx.fillText('📍 ' + property.location, WIDTH / 2, HEIGHT / 2 + 80);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Top accent bar
  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, WIDTH, 5);
  ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

  return canvas.toBuffer('image/png');
}

/**
 * Generate a CTA (Call to Action) closing frame
 */
async function generateCTAFrame(property, theme = 'luxury') {
  const colors = THEMES[theme] || THEMES.luxury;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, colors);
  drawDecorations(ctx, theme);

  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;

  // CTA headline
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 52px Arial';
  ctx.fillText(property.cta || 'Schedule a Visit Today!', WIDTH / 2, HEIGHT / 2 - 80);

  // Property name reminder
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 32px Arial';
  ctx.fillText(property.name || 'Dream Property', WIDTH / 2, HEIGHT / 2 - 10);

  // Accent line
  ctx.fillStyle = colors.accent;
  ctx.fillRect(WIDTH / 2 - 60, HEIGHT / 2 + 20, 120, 3);

  // Contact info
  if (property.contact) {
    ctx.fillStyle = colors.subtext;
    ctx.font = '26px Arial';
    ctx.fillText('📞 ' + property.contact, WIDTH / 2, HEIGHT / 2 + 80);
  }

  // Bottom tag
  ctx.fillStyle = colors.text;
  ctx.font = '18px Arial';
  ctx.globalAlpha = 0.6;
  ctx.fillText('Powered by AI Property Video Generator', WIDTH / 2, HEIGHT - 40);
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, WIDTH, 5);
  ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

  return canvas.toBuffer('image/png');
}

// Utility: wrap text to multiple lines
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

// Utility: round rectangle
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

// Utility: shade a hex color
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.min(255, R + percent);
  G = Math.min(255, G + percent);
  B = Math.min(255, B + percent);
  return '#' + R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0');
}

module.exports = {
  generateFrame,
  generateTitleFrame,
  generateCTAFrame,
  WIDTH,
  HEIGHT,
};

