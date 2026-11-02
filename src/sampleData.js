/**
 * Sample Property Data Generator
 * Creates synthetic/demo property data and sample images for testing
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Sample properties dataset
const SAMPLE_PROPERTIES = [
  {
    name: 'Skyline Heights Residency',
    location: 'Bandra West, Mumbai',
    price: 35000000,
    type: '3 BHK Luxury Apartment',
    bedrooms: 3,
    bathrooms: 3,
    area: '1,850 sq ft',
    features: [
      'Sea-facing balcony with panoramic ocean views',
      'Modular kitchen with premium appliances',
      'Master suite with walk-in wardrobe',
      'Dedicated covered parking (2 slots)',
      '24x7 security with CCTV surveillance',
    ],
    contact: '+91 98765 43210',
    cta: 'Book a Free Site Visit Today!',
    description: 'An exquisite sea-facing apartment offering luxury living in the heart of Bandra. ' +
      'This meticulously designed residence blends modern aesthetics with functional living spaces.',
    theme: 'luxury',
  },
];

/**
 * Generate a synthetic property image using Canvas
 * Creates visually distinct images for each scene type
 */
function generateSampleImage(outputPath, imageIndex, propertyName, colors = {}) {
  const WIDTH = 1280;
  const HEIGHT = 720;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Different color schemes per image
  const palettes = [
    { bg1: '#1a1a3e', bg2: '#2d1b69', accent: '#7c4dff' },
    { bg1: '#0d2137', bg2: '#1a3a5c', accent: '#00bcd4' },
    { bg1: '#1b2838', bg2: '#2a475e', accent: '#66c0f4' },
    { bg1: '#16213e', bg2: '#0f3460', accent: '#e94560' },
    { bg1: '#1a2f1a', bg2: '#2d4a2d', accent: '#4caf50' },
    { bg1: '#3e1a1a', bg2: '#5c2020', accent: '#f44336' },
    { bg1: '#2a2a1a', bg2: '#4a4a20', accent: '#ffc107' },
  ];

  const palette = palettes[imageIndex % palettes.length];

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, palette.bg1);
  gradient.addColorStop(1, palette.bg2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw geometric house/building shapes
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.15;

  // Building silhouettes
  const buildingCount = 5 + imageIndex;
  for (let i = 0; i < buildingCount; i++) {
    const bx = (WIDTH / buildingCount) * i + 50;
    const bw = 80 + Math.sin(i * 1.5) * 30;
    const bh = 150 + Math.cos(i * 0.8) * 100;
    const by = HEIGHT - bh - 60;
    ctx.fillStyle = shadeColor(palette.bg2, 20 + i * 5);
    ctx.fillRect(bx, by, bw, bh);

    // Windows
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.4;
    for (let wy = by + 20; wy < HEIGHT - 80; wy += 35) {
      for (let wx = bx + 10; wx < bx + bw - 10; wx += 25) {
        if (Math.random() > 0.3) {
          ctx.fillRect(wx, wy, 12, 18);
        }
      }
    }
    ctx.globalAlpha = 0.15;
  }

  ctx.globalAlpha = 1;

  // Scene-specific text overlay
  const sceneLabels = [
    'Living Room', 'Master Bedroom', 'Kitchen', 'Balcony View', 'Bathroom', 'Study Room', 'Terrace'
  ];
  const label = sceneLabels[imageIndex % sceneLabels.length];

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, HEIGHT - 100, WIDTH, 100);

  ctx.fillStyle = palette.accent;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`📷 ${label}`, 30, HEIGHT - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.globalAlpha = 0.6;
  ctx.fillText(propertyName || 'Sample Property', 30, HEIGHT - 35);
  ctx.globalAlpha = 1;

  // Center room icon
  const icons = ['🛋️', '🛏️', '🍳', '🌅', '🚿', '💻', '☀️'];
  ctx.font = '80px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText(icons[imageIndex % icons.length], WIDTH / 2, HEIGHT / 2 + 20);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Generate all sample images for a property
 */
function generateAllSampleImages(outputDir, property, count = 6) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const imagePaths = [];
  for (let i = 0; i < count; i++) {
    const imgPath = path.join(outputDir, `image_${i + 1}.png`);
    generateSampleImage(imgPath, i, property.name);
    imagePaths.push(imgPath);
    console.log(`  📸 Generated sample image ${i + 1}/${count}`);
  }
  return imagePaths;
}

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
  SAMPLE_PROPERTIES,
  generateSampleImage,
  generateAllSampleImages,
};

