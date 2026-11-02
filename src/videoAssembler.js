/**
 * Video Assembler
 * Uses FFmpeg to stitch frames + images into an MP4 video with transitions
 */

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Create a video from a list of image frames
 * Each frame object: { imagePath, duration }
 * @param {Array} frames - Array of { imagePath, duration } objects
 * @param {string} outputPath - Output MP4 file path
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Path to the output video
 */
function createVideoFromFrames(frames, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!frames || frames.length === 0) {
      return reject(new Error('No frames provided'));
    }

    // Build a concat file for FFmpeg
    const concatFilePath = outputPath.replace('.mp4', '_concat.txt');
    const concatContent = frames
      .map(f => `file '${f.imagePath.replace(/\\/g, '/')}'\nduration ${f.duration}`)
      .join('\n');

    // Add last frame again (FFmpeg concat demuxer requires it)
    const lastFrame = frames[frames.length - 1];
    const concatFinal = concatContent + `\nfile '${lastFrame.imagePath.replace(/\\/g, '/')}'`;

    fs.writeFileSync(concatFilePath, concatFinal);

    const {
      fps = 25,
      audioPath = null,
      quality = 23,
    } = options;

    // Total duration for audio trim
    const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

    let cmd = ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        `-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`,
        '-c:v libx264',
        '-preset fast',
        `-crf ${quality}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .output(outputPath);

    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd
        .input(audioPath)
        .inputOptions([`-t ${totalDuration}`])
        .outputOptions(['-c:a aac', '-b:a 128k', '-shortest']);
    }

    cmd
      .on('start', cmdLine => {
        console.log('🎬 FFmpeg started:', cmdLine.substring(0, 120) + '...');
      })
      .on('progress', progress => {
        if (progress.percent) {
          process.stdout.write(`\r  ⏳ Encoding: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('\n  ✅ Video encoding complete');
        // Clean up concat file
        try { fs.unlinkSync(concatFilePath); } catch (e) { /* ignore */ }
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('\n  ❌ FFmpeg error:', err.message);
        try { fs.unlinkSync(concatFilePath); } catch (e) { /* ignore */ }
        reject(err);
      })
      .run();
  });
}

/**
 * Add Ken Burns (zoom) effect to an image and export as video clip
 */
function createKenBurnsClip(imagePath, outputPath, duration = 4, zoomIn = true) {
  return new Promise((resolve, reject) => {
    const startScale = zoomIn ? 1.0 : 1.08;
    const endScale = zoomIn ? 1.08 : 1.0;
    const fps = 25;
    const totalFrames = duration * fps;

    // Ken Burns zoom filter
    const zoompanFilter = `zoompan=z='if(lte(zoom,1.0),${startScale},zoom+${(endScale - startScale) / totalFrames})':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=${fps}`;

    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .outputOptions([
        `-vf ${zoompanFilter}`,
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        `-t ${duration}`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', err => reject(err))
      .run();
  });
}

/**
 * Concatenate multiple video clips into one
 */
function concatenateClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    const concatFilePath = outputPath.replace('.mp4', '_clips_concat.txt');
    const content = clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatFilePath, content);

    ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('end', () => {
        try { fs.unlinkSync(concatFilePath); } catch (e) { /* ignore */ }
        resolve(outputPath);
      })
      .on('error', err => {
        try { fs.unlinkSync(concatFilePath); } catch (e) { /* ignore */ }
        reject(err);
      })
      .run();
  });
}

module.exports = { createVideoFromFrames, createKenBurnsClip, concatenateClips };

