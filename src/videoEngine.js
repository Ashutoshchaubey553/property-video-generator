/**
 * AI Property Video Generator - Main Engine
 * Orchestrates script generation, frame rendering, and video assembly
 */

const path = require('path');
const fs = require('fs');
const { generateScript } = require('./scriptGenerator');
const { generateFrame, generateTitleFrame, generateCTAFrame } = require('./frameGenerator');
const { createVideoFromFrames } = require('./videoAssembler');
const { generateAllSampleImages, SAMPLE_PROPERTIES } = require('./sampleData');

/**
 * Generate a property video
 * @param {Object} property - Property data
 * @param {Array<string>} imagePaths - Array of property image paths
 * @param {string} outputPath - Output MP4 file path
 * @param {Object} options - Options (theme, fps, quality)
 * @returns {Promise<Object>} - Result with output path and script
 */
async function generatePropertyVideo(property, imagePaths = [], outputPath, options = {}) {
  const { theme = 'luxury', fps = 25, quality = 23 } = options;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏠 AI Property Video Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Property: ${property.name}`);
  console.log(`  Location: ${property.location}`);
  console.log(`  Theme: ${theme}`);
  console.log(`  Images: ${imagePaths.length} provided`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Generate Script
  console.log('📝 Step 1: Generating AI script...');
  const script = generateScript(property);
  console.log(`  ✅ Script ready: ${script.scenes.length} scenes, ~${script.totalDuration}s total`);
  console.log(`\n  📖 Voiceover Preview:\n  "${script.fullVoiceover.substring(0, 200)}..."\n`);

  // 2. Create temp directory for frames
  const tempDir = path.join(path.dirname(outputPath), 'temp_frames_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const frames = [];

  try {
    // 3. Generate frames for each scene
    console.log('🖼️  Step 2: Rendering frames...');

    // Distribute images across scenes
    const featureScenes = script.scenes.filter(s => s.id !== 'opening' && s.id !== 'cta');

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      process.stdout.write(`  🎨 Rendering scene ${i + 1}/${script.scenes.length}: ${scene.id}...`);

      let frameBuffer;
      const framePath = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`);

      if (scene.id === 'opening') {
        // Title frame
        frameBuffer = await generateTitleFrame(property, theme);
      } else if (scene.id === 'cta') {
        // CTA frame
        frameBuffer = await generateCTAFrame(property, theme);
      } else {
        // Feature/content scene with property image background
        const featureIdx = featureScenes.findIndex(s => s.id === scene.id);
        const imgIdx = featureIdx % Math.max(imagePaths.length, 1);
        const imgPath = imagePaths.length > 0 ? imagePaths[imgIdx] : null;

        frameBuffer = await generateFrame(scene, imgPath, property.name, theme);
      }

      fs.writeFileSync(framePath, frameBuffer);
      frames.push({ imagePath: framePath, duration: scene.duration });
      console.log(' ✅');
    }

    console.log(`\n  ✅ All ${frames.length} frames rendered\n`);

    // 4. Assemble video
    console.log('🎬 Step 3: Assembling video with FFmpeg...');
    await createVideoFromFrames(frames, outputPath, { fps, quality });

    // 5. Save script to JSON
    const scriptPath = outputPath.replace('.mp4', '_script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
    console.log(`\n  📄 Script saved: ${path.basename(scriptPath)}`);

    // 6. Get output file info
    const stat = fs.statSync(outputPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 VIDEO GENERATION COMPLETE!');
    console.log(`  📁 Output: ${outputPath}`);
    console.log(`  📏 Size: ${sizeMB} MB`);
    console.log(`  ⏱️  Duration: ~${script.totalDuration} seconds`);
    console.log(`  🎞️  Frames: ${frames.length} scenes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      outputPath,
      scriptPath,
      script,
      sizeMB,
      duration: script.totalDuration,
      framesCount: frames.length,
    };

  } finally {
    // Cleanup temp frames
    try {
      frames.forEach(f => {
        if (fs.existsSync(f.imagePath)) fs.unlinkSync(f.imagePath);
      });
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true });
    } catch (e) { /* ignore cleanup errors */ }
  }
}

/**
 * Quick demo mode - generates video with sample data
 */
async function runDemo(outputDir = './output') {
  const property = SAMPLE_PROPERTIES[0];

  // Generate sample images
  console.log('🖼️  Generating sample property images...');
  const sampleImgDir = path.join(outputDir, 'sample_images');
  const imagePaths = generateAllSampleImages(sampleImgDir, property, 6);

  const outputPath = path.join(outputDir, 'sample_property_video.mp4');

  return generatePropertyVideo(property, imagePaths, outputPath, { theme: 'luxury' });
}

module.exports = { generatePropertyVideo, runDemo };

