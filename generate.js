#!/usr/bin/env node
/**
 * AI Property Video Generator - CLI Entry Point
 * Usage: node generate.js [options]
 *        node generate.js --demo
 *        node generate.js --input property.json --output video.mp4
 */

const path = require('path');
const fs = require('fs');
const { generatePropertyVideo, runDemo } = require('./src/videoEngine');

// Parse CLI args
const args = process.argv.slice(2);
const flags = {};
args.forEach((arg, i) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    flags[key] = val;
  }
});

async function main() {
  console.log('\n┌─────────────────────────────────────────────┐');
  console.log('│  🏠 AI Property Video Generator v1.0        │');
  console.log('│     Real Estate · AI Content Creation       │');
  console.log('└─────────────────────────────────────────────┘');

  const outputDir = path.resolve(flags.outdir || './output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // ── DEMO MODE ──────────────────────────────────────────────────
  if (flags.demo || args.length === 0) {
    console.log('\n  🎬 Running in DEMO mode with sample property data...');
    console.log('  (Use --input <file.json> for custom property)\n');

    const result = await runDemo(outputDir);

    if (result.success) {
      console.log('  ✅ Demo complete! Open the video at:');
      console.log(`     ${result.outputPath}`);
      console.log('\n  📋 VOICEOVER SCRIPT:');
      console.log('  ' + '─'.repeat(60));
      result.script.scenes.forEach((scene, i) => {
        console.log(`  [Scene ${i + 1}] ${scene.id.toUpperCase()}`);
        console.log(`  "${scene.voiceover}"`);
        console.log();
      });
    }
    return;
  }

  // ── CUSTOM INPUT MODE ──────────────────────────────────────────
  if (!flags.input) {
    console.error('\n  ❌ Error: --input <property.json> is required');
    console.log('\n  Usage:');
    console.log('    node generate.js --demo');
    console.log('    node generate.js --input property.json');
    console.log('    node generate.js --input property.json --output my_video.mp4');
    console.log('    node generate.js --input property.json --theme modern');
    console.log('\n  Options:');
    console.log('    --demo           Run with sample property data');
    console.log('    --input <file>   Path to property JSON file');
    console.log('    --output <file>  Output MP4 path (default: output/video.mp4)');
    console.log('    --theme <name>   Visual theme: luxury | modern | classic');
    console.log('    --images <dir>   Directory with property images');
    console.log('    --outdir <dir>   Output directory (default: ./output)');
    process.exit(1);
  }

  // Load property data
  const inputPath = path.resolve(flags.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`\n  ❌ Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let property;
  try {
    property = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (e) {
    console.error(`\n  ❌ Error: Invalid JSON in ${inputPath}: ${e.message}`);
    process.exit(1);
  }

  // Validate required fields
  if (!property.name) {
    console.warn('  ⚠️  Warning: property.name is missing, using default');
    property.name = 'Luxury Property';
  }

  // Load images
  let imagePaths = [];
  const imagesDir = flags.images ? path.resolve(flags.images) : null;

  if (imagesDir && fs.existsSync(imagesDir)) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
    imagePaths = fs.readdirSync(imagesDir)
      .filter(f => imageExts.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(imagesDir, f));
    console.log(`\n  📸 Found ${imagePaths.length} images in ${imagesDir}`);
  } else {
    console.log('\n  ℹ️  No images directory provided — using synthetic backgrounds');
    console.log('  (Use --images <dir> to include property photos)');
  }

  // Output path
  const outputPath = flags.output
    ? path.resolve(flags.output)
    : path.join(outputDir, `${property.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_video.mp4`);

  // Theme & Voice
  const theme = flags.theme || property.theme || 'luxury';
  const voice = flags.voice || 'en-IN-NeerjaNeural';

  // Generate video
  const result = await generatePropertyVideo(property, imagePaths, outputPath, { theme, voice });

  if (result.success) {
    console.log('\n  🎬 Your video is ready!');
    console.log(`  📁 ${result.outputPath}`);
  }
}

main().catch(err => {
  console.error('\n  ❌ Fatal error:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});

