/**
 * Professional Studio Audio Generator
 * Uses Microsoft Edge Neural Human Voice Models (Authentic Female Presenters)
 * Supported Female Voices:
 *  - en-IN-NeerjaNeural (Warm Indian Professional Female Presenter)
 *  - en-US-JennyNeural  (Sophisticated US Female Presenter)
 *  - en-US-AriaNeural   (Expressive Luxury Brand Female Presenter)
 */

const path = require('path');
const fs = require('fs');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const DEFAULT_FEMALE_VOICE = 'en-IN-NeerjaNeural';

/**
 * Format raw property text into natural, spoken English
 */
function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/₹\s*([0-9.]+)\s*Cr/gi, '$1 Crore Rupees')
    .replace(/₹\s*([0-9.]+)\s*L/gi, '$1 Lakh Rupees')
    .replace(/₹/g, 'Rupees ')
    .replace(/(\d+)\s*BHK/gi, '$1 B H K')
    .replace(/sq\s*ft/gi, 'square feet')
    .replace(/24x7/gi, 'twenty-four seven')
    .replace(/CCTV/gi, 'C C T V')
    .replace(/\+/g, ' plus ')
    .replace(/•/g, ', ')
    .replace(/CTA/gi, '')
    .replace(/[*#_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate human female studio voiceover for a single scene
 * @param {string} text - Voiceover sentence for this scene
 * @param {string} outputPath - MP3 file destination
 * @param {string} voice - Neural female voice identifier
 * @returns {Promise<{ path: string, duration: number }>}
 */
async function generateSceneVoiceover(text, outputPath, voice = DEFAULT_FEMALE_VOICE) {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    throw new Error('Scene text is empty');
  }

  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tts = new EdgeTTS({ voice });
    await tts.ttsPromise(clean, outputPath);

    // Measure exact audio duration
    const duration = await getAudioDuration(outputPath);
    return { path: outputPath, duration };
  } catch (err) {
    console.warn(`  ⚠️ EdgeTTS warning for "${clean.substring(0, 30)}...":`, err.message);
    // Fallback: Google TTS
    return fallbackGoogleTTS(clean, outputPath);
  }
}

/**
 * Fallback to Google TTS if offline or network issue
 */
function fallbackGoogleTTS(text, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const gTTS = require('node-gtts')('en');
      gTTS.save(outputPath, text, async (err) => {
        if (err) return reject(err);
        try {
          const duration = await getAudioDuration(outputPath);
          resolve({ path: outputPath, duration });
        } catch (e) {
          resolve({ path: outputPath, duration: 4.0 });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Measure exact duration of an audio file using ffprobe
 */
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const dur = metadata && metadata.format && metadata.format.duration;
      resolve(dur ? parseFloat(dur) : 4.0);
    });
  });
}

module.exports = {
  generateSceneVoiceover,
  cleanTextForSpeech,
  getAudioDuration,
  DEFAULT_FEMALE_VOICE,
};
