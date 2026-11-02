/**
 * Audio Generator
 * Uses Google TTS (node-gtts) with offline fallback to generate voiceover MP3
 */

const path = require('path');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Format raw script text into clean, natural spoken English
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
 * Generate a voiceover MP3 from text using Google TTS
 */
function generateVoiceover(text, outputPath, lang = 'en') {
  return new Promise((resolve, reject) => {
    try {
      const gTTS = require('node-gtts');
      const gtts = gTTS(lang);
      const cleanText = cleanTextForSpeech(text);

      if (!cleanText) {
        return reject(new Error('Voiceover text is empty'));
      }

      console.log(`  🎙️  Synthesizing voiceover (${cleanText.length} chars)...`);

      gtts.save(outputPath, cleanText, (err) => {
        if (err) {
          console.warn('  ⚠️  Google TTS failed, falling back to local ambient audio:', err.message);
          return generateAmbientFallback(outputPath, 33).then(resolve).catch(reject);
        }
        console.log('  ✅ Voiceover audio generated:', path.basename(outputPath));
        resolve(outputPath);
      });
    } catch (err) {
      console.warn('  ⚠️  TTS initialization error, using local fallback:', err.message);
      generateAmbientFallback(outputPath, 33).then(resolve).catch(reject);
    }
  });
}

/**
 * Generate soft ambient audio tone if TTS is offline
 */
function generateAmbientFallback(outputPath, duration = 30) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`sine=frequency=392:duration=${duration}`)
      .inputOptions(['-f lavfi'])
      .outputOptions([
        '-c:a libmp3lame',
        '-b:a 128k',
        '-ar 44100',
        `-t ${duration}`
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('  🎵 Ambient audio fallback created:', path.basename(outputPath));
        resolve(outputPath);
      })
      .on('error', err => reject(err))
      .run();
  });
}

module.exports = { generateVoiceover, cleanTextForSpeech, generateAmbientFallback };
