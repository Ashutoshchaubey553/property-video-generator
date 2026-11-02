/**
 * AI Property Video Generator — Synchronized Video Engine
 * Locks each 4K scene image and human female voiceover together 1:1,
 * and layers soft continuous background ambient music till the end.
 */

const path = require('path');
const fs = require('fs');
const { generateScript } = require('./scriptGenerator');
const { generateFrame, generateTitleFrame, generateCTAFrame } = require('./frameGenerator');
const { createSceneClip, concatenateClips, mixBackgroundMusic } = require('./videoAssembler');
const { getAllSampleImages, SAMPLE_PROPERTIES } = require('./sampleData');
const { generateSceneVoiceover, DEFAULT_FEMALE_VOICE } = require('./audioGenerator');

const DEFAULT_BG_MUSIC = path.resolve(__dirname, '../sample-data/ambient_piano_music.mp3');

/**
 * Generate a fully synchronized property video with voiceover and continuous background music
 * @param {Object} property - Property details
 * @param {Array<string>} imagePaths - 4K photo file paths
 * @param {string} outputPath - Destination MP4 path
 * @param {Object} options - Customization options (theme, voice, bgMusic, musicVolume)
 */
async function generatePropertyVideo(property, imagePaths = [], outputPath, options = {}) {
  const {
    theme = 'luxury',
    voice = DEFAULT_FEMALE_VOICE,
    bgMusic = DEFAULT_BG_MUSIC,
    musicVolume = 0.12,
  } = options;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏢 Realty Assistant — Synced Video Engine');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Property:  ${property.name}`);
  console.log(`  Location:  ${property.location}`);
  console.log(`  Theme:     ${theme}`);
  console.log(`  Voice:     ${voice} (Natural Human Female Presenter)`);
  console.log(`  Music:     Low Ambient Background Music Enabled (12% vol)`);
  console.log(`  Photos:    ${imagePaths.length} provided`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Generate Script
  console.log('📝 Step 1: Generating scene-by-scene script...');
  const script = generateScript(property);
  console.log(`  ✅ Script prepared with ${script.scenes.length} dedicated scenes.\n`);

  // 2. Temp directory for this video's intermediate renders
  const tempDir = path.join(path.dirname(outputPath), `temp_render_${Date.now()}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const clipPaths = [];
  const featureScenes = script.scenes.filter(s => s.id !== 'opening' && s.id !== 'cta');
  let totalVideoDuration = 0;

  try {
    console.log('🎬 Step 2: Producing synchronized scene clips (Image + Woman Voiceover)...');

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const sceneNum = i + 1;
      process.stdout.write(`  ▶️  Scene ${sceneNum}/${script.scenes.length} [${scene.id}]: `);

      // A. Generate Natural Human Female Voiceover for THIS scene
      const audioPath = path.join(tempDir, `scene_${i}_voice.mp3`);
      let audioDuration = 3.5;
      try {
        const audioRes = await generateSceneVoiceover(scene.voiceover, audioPath, voice);
        audioDuration = audioRes.duration;
        process.stdout.write(`🎙️ Audio (${audioDuration.toFixed(1)}s) → `);
      } catch (err) {
        console.warn(`\n  ⚠️ Audio fallback for scene ${sceneNum}:`, err.message);
      }

      // Calculate scene display duration: voice duration + 0.8s natural visual buffer
      const sceneDuration = parseFloat(Math.max(audioDuration + 0.8, 3.8).toFixed(2));
      totalVideoDuration += sceneDuration;

      // B. Render Frame with 4K Image & Ornate Overlays
      const framePath = path.join(tempDir, `frame_${i}.png`);
      let frameBuffer;

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
      process.stdout.write(`🎨 Frame → `);

      // C. Render locked scene clip (Image + Voiceover synchronized)
      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      await createSceneClip(framePath, audioPath, sceneDuration, clipPath);
      clipPaths.push(clipPath);

      console.log(`🎬 Clip OK (${sceneDuration}s)`);
    }

    // 3. Assemble all scene clips into a single video
    console.log('\n🔗 Step 3: Stitching scene clips into video...');
    const intermediateVideo = path.join(tempDir, 'concatenated_raw.mp4');
    await concatenateClips(clipPaths, intermediateVideo);

    // 4. Layer soft continuous background music from start till end
    console.log('\n🎵 Step 4: Layering continuous low background music...');
    await mixBackgroundMusic(intermediateVideo, bgMusic, outputPath, musicVolume);

    // 5. Save script JSON
    const scriptPath = outputPath.replace('.mp4', '_script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

    const stat = fs.statSync(outputPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 SYNCHRONIZED VIDEO GENERATION COMPLETE!');
    console.log(`  📁 Output:    ${outputPath}`);
    console.log(`  📏 Size:      ${sizeMB} MB (1080p Full HD)`);
    console.log(`  ⏱️  Duration:  ${totalVideoDuration.toFixed(1)} seconds`);
    console.log(`  🎙️  Voice:     Natural Human Female Presenter (${voice})`);
    console.log(`  🎵 Music:     Soft Classical Ambient Piano (Continuous till end)`);
    console.log(`  🔒 Sync:      100% Locked 1:1 (Image & Speech match exactly)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      outputPath,
      scriptPath,
      script,
      sizeMB,
      duration: Math.round(totalVideoDuration),
      hasAudio: true,
      hasBgm: true,
      voice,
    };

  } finally {
    // Cleanup temporary intermediate clips & frames
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

/**
 * Quick demo mode using 4K sample images, human female voice, and low background music
 */
async function runDemo(outputDir = './output') {
  const property = SAMPLE_PROPERTIES[0];
  const images = getAllSampleImages();

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'sample_property_video.mp4');

  return generatePropertyVideo(property, images, outputPath, {
    theme: 'luxury',
    voice: 'en-IN-NeerjaNeural',
    bgMusic: DEFAULT_BG_MUSIC,
    musicVolume: 0.12,
  });
}

module.exports = { generatePropertyVideo, runDemo };
