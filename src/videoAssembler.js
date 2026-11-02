/**
 * Video Assembler
 * Creates synchronized scene clips, concatenates them,
 * and mixes soft continuous background ambient music from start to end.
 */

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Create a single synchronized scene clip
 * (Locks image and woman voiceover together for this scene's exact duration)
 */
function createSceneClip(imagePath, audioPath, duration, outputPath) {
  return new Promise((resolve, reject) => {
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}

    let cmd = ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1']);

    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd.input(audioPath);
    } else {
      cmd = cmd.input('anullsrc=channel_layout=stereo:sample_rate=44100').inputOptions(['-f lavfi']);
    }

    cmd
      .outputOptions([
        '-y',
        '-c:v libx264',
        '-preset fast',
        '-crf 20',
        '-pix_fmt yuv420p',
        '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1',
        '-c:a aac',
        '-b:a 192k',
        '-ar 44100',
        '-af apad',
        '-shortest',
        `-t ${duration}`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', err => reject(err))
      .run();
  });
}

/**
 * Concatenate all synchronized scene clips into a video
 */
function concatenateClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    if (!clipPaths || clipPaths.length === 0) {
      return reject(new Error('No clips to concatenate'));
    }

    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}

    const concatListPath = outputPath.replace('.mp4', `_concat_list_${Date.now()}.txt`);
    const content = clipPaths
      .map(p => `file '${p.replace(/\\/g, '/')}'`)
      .join('\n');

    fs.writeFileSync(concatListPath, content);

    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-y',
        '-c:v copy',
        '-c:a copy',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', () => {
        console.log('  🔗 Assembling synchronized scene clips...');
      })
      .on('end', () => {
        try { if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath); } catch (e) {}
        resolve(outputPath);
      })
      .on('error', err => {
        try { if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath); } catch (e) {}
        reject(err);
      })
      .run();
  });
}

/**
 * Mix soft continuous background music from start to end underneath the woman's voice
 * @param {string} videoPath - Input video with woman voice
 * @param {string} bgMusicPath - Background music MP3 file
 * @param {string} outputPath - Destination MP4
 * @param {number} musicVolume - Volume level (default: 0.12 = 12% soft level)
 */
function mixBackgroundMusic(videoPath, bgMusicPath, outputPath, musicVolume = 0.12) {
  return new Promise((resolve, reject) => {
    if (!bgMusicPath || !fs.existsSync(bgMusicPath)) {
      console.log('  ℹ️  No background music file found, keeping voiceover track only');
      if (videoPath !== outputPath) {
        fs.copyFileSync(videoPath, outputPath);
      }
      return resolve(outputPath);
    }

    // Measure video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.warn('  ⚠️ FFprobe warning, copying video directly:', err.message);
        if (videoPath !== outputPath) fs.copyFileSync(videoPath, outputPath);
        return resolve(outputPath);
      }

      const totalDur = parseFloat(metadata.format.duration || 60);
      const fadeOutStart = Math.max(totalDur - 2.5, 1).toFixed(1);

      console.log(`  🎵 Mixing low background ambient music (${totalDur.toFixed(1)}s, volume: ${Math.round(musicVolume * 100)}%)...`);

      const tempOut = outputPath.includes('temp_') ? outputPath : outputPath.replace('.mp4', '_mixed.mp4');

      ffmpeg()
        .input(videoPath)
        .input(bgMusicPath)
        .complexFilter([
          '[0:a]volume=1.0[voice]',
          `[1:a]volume=${musicVolume},afade=t=in:ss=0:d=1.5,afade=t=out:st=${fadeOutStart}:d=2.5[bgm]`,
          '[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]'
        ])
        .outputOptions([
          '-y',
          '-map 0:v:0',
          '-map [aout]',
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-ar 44100',
          '-movflags +faststart'
        ])
        .output(tempOut)
        .on('end', () => {
          console.log('  ✅ Background music mixed continuously from start till end!');
          if (tempOut !== outputPath) {
            try {
              if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
              fs.renameSync(tempOut, outputPath);
            } catch(e) {}
          }
          resolve(outputPath);
        })
        .on('error', mixErr => {
          console.warn('  ⚠️ Background music mix error, falling back to voiceover only:', mixErr.message);
          if (videoPath !== outputPath) fs.copyFileSync(videoPath, outputPath);
          resolve(outputPath);
        })
        .run();
    });
  });
}

module.exports = {
  createSceneClip,
  concatenateClips,
  mixBackgroundMusic,
};
