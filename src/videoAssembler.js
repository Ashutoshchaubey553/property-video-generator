/**
 * Video Assembler
 * Creates perfectly synchronized scene-by-scene video clips and concatenates them
 * Ensures audio speech and scene imagery are locked 1:1 without any drift.
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
    let cmd = ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1']);

    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd.input(audioPath);
    } else {
      // If no audio, generate silent audio stream so concat works uniformly
      cmd = cmd.input('anullsrc=channel_layout=stereo:sample_rate=44100').inputOptions(['-f lavfi']);
    }

    cmd
      .outputOptions([
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
 * Concatenate all synchronized scene clips into the final video
 */
function concatenateClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    if (!clipPaths || clipPaths.length === 0) {
      return reject(new Error('No clips to concatenate'));
    }

    const concatListPath = outputPath.replace('.mp4', `_concat_list_${Date.now()}.txt`);
    const content = clipPaths
      .map(p => `file '${p.replace(/\\/g, '/')}'`)
      .join('\n');

    fs.writeFileSync(concatListPath, content);

    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', () => {
        console.log('  🎬 Assembling synchronized scene clips into final MP4...');
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

module.exports = {
  createSceneClip,
  concatenateClips,
};
