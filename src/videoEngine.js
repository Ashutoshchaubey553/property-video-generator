/**
 * AI Property Video Generator - Main Engine
 * Orchestrates script generation, frame rendering, voiceover generation, and video assembly
 */

const path = require('path');
const fs = require('fs');
const { generateScript } = require('./scriptGenerator');
const { generateFrame, generateTitleFrame, generateCTAFrame } = require('./frameGenerator');
const { createVideoFromFrames } = require('./videoAssembler');
const { generateAllSampleImages, SAMPLE_PROPERTIES } = require('./sampleData');
const { generateVoiceover } = require('./audioGenerator');

/**
 * Generate a property video
 */
async function generatePropertyVideo(property, imagePaths = [], outputPath, options = {}) {
  const { theme = 'luxury', fps = 25, quality = 23 } = options;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏠 AI Property Video Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Property: ${property.name}`);
  console.log(`  Location: ${property.location}`);
  console.log(`  Theme:    ${theme}`);
  console.log(`  Images:   ${imagePaths.length} provided`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Generate Script
  console.log('📝 Step 1: Generating AI script...');
  const script = generateScript(property);
  console.log(`  ✅ Script ready: ${script.scenes.length} scenes, ~${script.totalDuration}s total`);
  console.log(`\n  📖 Voiceover Preview:\n  "${script.fullVoiceover.substring(0, 180)}..."\n`);

  // 2. Create temp directory
  const tempDir = path.join(path.dirname(outputPath), 'temp_frames_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const frames = [];

  try {
    // 3. Render frames
    console.log('🖼️  Step 2: Rendering frames...');
    const featureScenes = script.scenes.filter(s => s.id !== 'opening' && s.id !== 'cta');

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      process.stdout.write(`  🎨 Scene ${i + 1}/${script.scenes.length}: ${scene.id}...`);

      let frameBuffer;
      const framePath = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`);

      if (scene.id === 'opening') {
        frameBuffer = await generateTitleFrame(property, theme);
      } else if (scene.id === 'cta') {
        frameBuffer = await generateCTAFrame(property, theme);
      } else {
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

    // 4. Generate Voiceover Audio
    console.log('🔊 Step 3: Generating voiceover audio track...');
    const voiceoverPath = path.join(tempDir, 'voiceover.mp3');
    let finalAudioPath = null;

    try {
      await generateVoiceover(script.fullVoiceover, voiceoverPath, 'en');
      if (fs.existsSync(voiceoverPath) && fs.statSync(voiceoverPath).size > 1000) {
        finalAudioPath = voiceoverPath;
        console.log('  ✅ Voiceover audio generated successfully');
      }
    } catch (e) {
      console.warn('  ⚠️ Voiceover generation note:', e.message);
    }

    // 5. Assemble video with FFmpeg
    console.log('\n🎬 Step 4: Encoding video + audio with FFmpeg...');
    await createVideoFromFrames(frames, outputPath, {
      fps,
      quality,
      audioPath: finalAudioPath
    });

    // 6. Save script JSON
    const scriptPath = outputPath.replace('.mp4', '_script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
    console.log(`  📄 Script saved: ${path.basename(scriptPath)}`);

    const stat = fs.statSync(outputPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 VIDEO GENERATION COMPLETE!');
    console.log(`  📁 Output:   ${outputPath}`);
    console.log(`  📏 Size:     ${sizeMB} MB`);
    console.log(`  ⏱️  Duration: ~${script.totalDuration} seconds`);
    console.log(`  🔊 Audio:    ${finalAudioPath ? '✅ Voiceover narration included' : 'Silent'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      outputPath,
      scriptPath,
      script,
      sizeMB,
      duration: script.totalDuration,
      framesCount: frames.length,
      hasAudio: !!finalAudioPath,
    };

  } finally {
    // Cleanup temp frames
    try {
      frames.forEach(f => { try { fs.unlinkSync(f.imagePath); } catch(e){} });
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) { /* ignore */ }
  }
}

/**
 * Quick demo mode
 */
async function runDemo(outputDir = './output') {
  const property = SAMPLE_PROPERTIES[0];

  console.log('🖼️  Generating sample property images...');
  const sampleImgDir = path.join(outputDir, 'sample_images');
  const imagePaths = generateAllSampleImages(sampleImgDir, property, 6);

  const outputPath = path.join(outputDir, 'sample_property_video.mp4');
  return generatePropertyVideo(property, imagePaths, outputPath, { theme: 'luxury' });
}

module.exports = { generatePropertyVideo, runDemo };
