/**
 * AI Property Video Generator — Web Server
 * Express app with UI form → video generation → download
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generatePropertyVideo } = require('./src/videoEngine');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup multer for image uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (.jpg, .png, .webp)'));
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/sample-images', express.static(path.join(__dirname, 'sample-data/images')));

// API to list real Realty Assistant sample photos
app.get('/api/sample-images', (req, res) => {
  const imagesDir = path.join(__dirname, 'sample-data/images');
  if (!fs.existsSync(imagesDir)) return res.json({ images: [] });
  const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const files = fs.readdirSync(imagesDir)
    .filter(f => validExts.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      name: f,
      url: `/sample-images/${f}`,
    }));
  res.json({ images: files });
});

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(getHTML());
});

// ── GENERATE VIDEO API ─────────────────────────────────────────────────────
app.post('/generate', upload.array('images', 12), async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const {
      name, location, price, type,
      bedrooms, bathrooms, area,
      features, contact, cta, description, theme,
    } = req.body;

    if (!name || !name.trim()) {
      cleanup(uploadedFiles);
      return res.status(400).json({ error: 'Property name is required.' });
    }

    const parsedPrice = price ? parseFloat(String(price).replace(/[^0-9.]/g, '')) || price : null;

    const featureList = (features || '')
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const property = {
      name: name.trim(),
      location: location ? location.trim() : '',
      price: parsedPrice,
      type: type ? type.trim() : 'Property',
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area ? area.trim() : '',
      features: featureList,
      contact: contact ? contact.trim() : '',
      cta: cta ? cta.trim() : 'Contact us today!',
      description: description ? description.trim() : '',
      theme: theme || 'luxury',
    };

    const imagePaths = uploadedFiles.map(f => f.path);

    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${safeName}_${Date.now()}.mp4`);

    console.log(`\n🎬 Request: Generating video for "${name}" with ${imagePaths.length} photos`);

    const result = await generatePropertyVideo(property, imagePaths, outputPath, {
      theme: theme || 'luxury',
    });

    cleanup(uploadedFiles);

    if (result.success) {
      const videoFile = path.basename(result.outputPath);
      res.json({
        success: true,
        videoUrl: `/output/${videoFile}`,
        videoFile,
        duration: result.duration,
        sizeMB: result.sizeMB,
        hasAudio: result.hasAudio,
        script: result.script.scenes.map(s => ({
          scene: s.id,
          voiceover: s.voiceover,
        })),
      });
    } else {
      res.status(500).json({ error: 'Video generation failed.' });
    }

  } catch (err) {
    console.error('Error during generation:', err.message);
    cleanup(uploadedFiles);
    res.status(500).json({ error: err.message || 'Unexpected error occurred.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Realty Assistant Video Generator', version: '1.3.0' });
});

function cleanup(files) {
  files.forEach(f => {
    try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
  });
}

app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────┐`);
  console.log(`│  🏠 Realty Assistant - AI Video Generator   │`);
  console.log(`│  🔊 Voiceover Audio: ENABLED               │`);
  console.log(`│  📸 Real Property Photos: LOADED           │`);
  console.log(`│  🌐 Server running on port ${PORT}             │`);
  console.log(`│  📍 http://localhost:${PORT}                  │`);
  console.log(`└─────────────────────────────────────────────┘\n`);
});

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Realty Assistant — AI Property Video Generator</title>
  <style>
    :root {
      --gold: #c9a84c;
      --gold-hover: #dfbc5e;
      --dark: #0b0c16;
      --card: #151728;
      --card2: #1b1e36;
      --text: #f0f0f5;
      --muted: #9598b5;
      --green: #22c55e;
      --red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--dark);
      color: var(--text);
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, #0b0c16 0%, #151728 100%);
      border-bottom: 2px solid var(--gold);
      padding: 20px 36px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand-logo {
      font-size: 2.2rem;
      background: linear-gradient(135deg, var(--gold), #fefefe);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 900;
      letter-spacing: -1px;
    }
    header h1 { font-size: 1.5rem; color: #fff; }
    header p { color: var(--muted); font-size: 0.85rem; }
    .badge-realty {
      margin-left: auto;
      background: rgba(201, 168, 76, 0.12);
      border: 1px solid var(--gold);
      color: var(--gold);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    main {
      max-width: 940px;
      margin: 28px auto;
      padding: 0 20px;
    }

    .card {
      background: var(--card);
      border: 1px solid #232742;
      border-radius: 16px;
      padding: 26px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }
    .card h2 {
      color: var(--gold);
      font-size: 1.15rem;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full { grid-column: 1 / -1; }
    label { display: block; color: var(--muted); font-size: 0.78rem; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    input, textarea, select {
      width: 100%;
      background: #0d0e1c;
      border: 1px solid #262a4a;
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--gold); }
    textarea { resize: vertical; min-height: 105px; font-family: inherit; line-height: 1.5; }

    /* ACTION BUTTONS IN CARD HEADER */
    .btn-quick-fill {
      background: rgba(201, 168, 76, 0.12);
      border: 1px solid var(--gold);
      color: var(--gold);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-quick-fill:hover {
      background: var(--gold);
      color: #000;
    }

    /* DRAG & DROP UPLOAD ZONE */
    .upload-zone {
      border: 2px dashed #383c66;
      border-radius: 14px;
      padding: 30px 20px;
      text-align: center;
      cursor: pointer;
      background: #0f1022;
      transition: all 0.25s ease;
    }
    .upload-zone:hover {
      border-color: var(--gold);
      background: rgba(201,168,76,0.06);
    }
    .upload-zone.drag-active {
      border-color: var(--gold);
      background: rgba(201,168,76,0.15);
      transform: scale(1.01);
      box-shadow: 0 0 25px rgba(201,168,76,0.25);
    }
    .upload-zone input[type=file] { display: none; }
    .upload-zone .icon { font-size: 2.8rem; margin-bottom: 8px; }
    .upload-zone p { color: var(--muted); font-size: 0.92rem; }
    .upload-zone strong { color: var(--gold); }

    .preview-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .preview-card {
      position: relative;
      background: #0d0e1c;
      border: 1px solid #232742;
      border-radius: 10px;
      overflow: hidden;
      aspect-ratio: 4/3;
      display: flex;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .preview-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .preview-card .remove-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(239, 68, 68, 0.88);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview-card .filename {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.8);
      color: #eee;
      font-size: 10px;
      padding: 3px 6px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .themes { display: flex; gap: 12px; }
    .theme-btn {
      flex: 1;
      padding: 12px;
      border: 2px solid #232742;
      border-radius: 10px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .theme-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
    .theme-btn .dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; margin-bottom: 6px; }

    .btn-generate {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #c9a84c, #9d752c);
      color: #0b0c16;
      font-size: 1.15rem;
      font-weight: 800;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(201, 168, 76, 0.3);
    }
    .btn-generate:hover { opacity: 0.94; transform: translateY(-1px); }
    .btn-generate:active { transform: scale(0.99); }
    .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

    #status-box { display: none; }
    .progress-bar {
      height: 6px;
      background: #232742;
      border-radius: 3px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold), #22c55e);
      border-radius: 3px;
      width: 0%;
      transition: width 0.3s ease;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      color: var(--muted);
      font-size: 0.88rem;
    }
    .step.active { color: var(--gold); font-weight: 600; }
    .step.done { color: var(--green); }

    #result-box { display: none; }
    .video-card {
      background: #0d0e1c;
      border: 1px solid var(--green);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
    }
    .video-card h3 { color: var(--green); margin-bottom: 14px; font-size: 1.25rem; }
    video { width: 100%; border-radius: 10px; max-height: 460px; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 12px 30px;
      background: var(--green);
      color: #fff;
      font-weight: 700;
      border-radius: 8px;
      text-decoration: none;
      font-size: 1.05rem;
      transition: opacity 0.2s;
    }
    .btn-download:hover { opacity: 0.9; }

    .script-box {
      background: #0d0e1c;
      border: 1px solid #232742;
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
      text-align: left;
    }
    .script-box h4 { color: var(--gold); margin-bottom: 12px; }
    .script-scene {
      border-left: 3px solid var(--gold);
      padding: 8px 12px;
      margin-bottom: 8px;
      background: rgba(201,168,76,0.04);
      border-radius: 0 6px 6px 0;
    }
    .script-scene .label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; font-weight: 700; }
    .script-scene .text { color: var(--text); font-size: 0.9rem; margin-top: 2px; font-style: italic; }

    #error-box {
      display: none;
      background: rgba(239,68,68,0.1);
      border: 1px solid var(--red);
      border-radius: 10px;
      padding: 16px;
      color: var(--red);
      margin-top: 16px;
    }

    footer {
      text-align: center;
      color: var(--muted);
      font-size: 0.82rem;
      padding: 32px 20px;
    }
    footer a { color: var(--gold); text-decoration: none; }
  </style>
</head>
<body>

<header>
  <div class="brand-logo">RA</div>
  <div>
    <h1>Realty Assistant — AI Video Generator</h1>
    <p>Automated promotional video creation with real photos & voiceover narration</p>
  </div>
  <div class="badge-realty">
    Official AI Task Solution
  </div>
</header>

<main>
  <form id="videoForm" enctype="multipart/form-data">

    <!-- PROPERTY DETAILS -->
    <div class="card">
      <h2>
        <span>📋 Property Details</span>
        <button type="button" class="btn-quick-fill" onclick="loadRealtyPreset()">⚡ Reset to Realty Assistant Preset</button>
      </h2>
      <div class="grid">
        <div class="full">
          <label>Property Name *</label>
          <input type="text" id="propName" name="name" required value="The Grand Crest by Realty Assistant"/>
        </div>
        <div>
          <label>Location</label>
          <input type="text" id="propLocation" name="location" value="Sector 150, Noida Express Highway"/>
        </div>
        <div>
          <label>Price (₹)</label>
          <input type="text" id="propPrice" name="price" value="28500000"/>
        </div>
        <div>
          <label>Property Type</label>
          <input type="text" id="propType" name="type" value="4 BHK Ultra-Luxury Residence"/>
        </div>
        <div>
          <label>Bedrooms</label>
          <input type="number" id="propBeds" name="bedrooms" value="4" min="0" max="20"/>
        </div>
        <div>
          <label>Bathrooms</label>
          <input type="number" id="propBaths" name="bathrooms" value="4" min="0" max="20"/>
        </div>
        <div>
          <label>Area</label>
          <input type="text" id="propArea" name="area" value="2,450 sq ft"/>
        </div>
        <div>
          <label>Contact Number</label>
          <input type="text" id="propContact" name="contact" value="+91 99990 12345 | info@realtyassistant.in"/>
        </div>
        <div class="full">
          <label>Key Features (one per line)</label>
          <textarea id="propFeatures" name="features">Expansive living room with double-height panoramic windows
Italian modular kitchen equipped with premium appliances
Palatial master bedroom suite with walk-in dressing lounge
Sun-drenched balcony overlooking scenic landscaped greens
Resort-style infinity pool and luxury wellness clubhouse</textarea>
        </div>
        <div class="full">
          <label>Call to Action (CTA)</label>
          <input type="text" id="propCta" name="cta" value="Book an Exclusive Site Visit with Realty Assistant!"/>
        </div>
      </div>
    </div>

    <!-- DRAG & DROP IMAGES -->
    <div class="card">
      <h2>
        <span>📸 Property Images</span>
        <button type="button" class="btn-quick-fill" onclick="loadSamplePhotos()">✨ Load 8 Real Property Photos</button>
      </h2>
      
      <div class="upload-zone" id="dropZone">
        <input type="file" id="imageUpload" multiple accept=".jpg,.jpeg,.png,.webp,.bmp"/>
        <div class="icon">📥</div>
        <p><strong>Drag & Drop real property photos here</strong></p>
        <p style="margin-top:4px">or click to browse files from your computer</p>
        <p style="font-size:0.78rem;color:#787b9e;margin-top:8px">Supports real photos (JPG, PNG, WEBP) · Click "Load 8 Real Property Photos" above for instant demo</p>
      </div>

      <div class="preview-container" id="previewContainer"></div>
    </div>

    <!-- THEME -->
    <div class="card">
      <h2>🎨 Visual Theme</h2>
      <div class="themes">
        <button type="button" class="theme-btn active" onclick="setTheme('luxury', this)">
          <div><div class="dot" style="background:#c9a84c;margin:0 auto 6px"></div></div>
          <strong>Realty Luxury</strong><br/><small style="color:var(--muted)">Navy + Gold</small>
        </button>
        <button type="button" class="theme-btn" onclick="setTheme('modern', this)">
          <div><div class="dot" style="background:#00bcd4;margin:0 auto 6px"></div></div>
          <strong>Modern Urban</strong><br/><small style="color:var(--muted)">Deep Blue + Cyan</small>
        </button>
        <button type="button" class="theme-btn" onclick="setTheme('classic', this)">
          <div><div class="dot" style="background:#d4a853;margin:0 auto 6px"></div></div>
          <strong>Classic Heritage</strong><br/><small style="color:var(--muted)">Rich Timber + Amber</small>
        </button>
      </div>
      <input type="hidden" name="theme" id="themeInput" value="luxury"/>
    </div>

    <!-- GENERATE -->
    <button type="submit" class="btn-generate" id="generateBtn">
      <span>🎬</span> Generate Property Video with Real Photos & Voiceover
    </button>

    <!-- STATUS -->
    <div class="card" id="status-box" style="margin-top:20px">
      <h2>⚙️ Producing your promotional video...</h2>
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <div class="step" id="step1"><span class="step-icon">📝</span> 1. Writing AI voiceover narrative from listing facts...</div>
      <div class="step" id="step2"><span class="step-icon">🖼️</span> 2. Styling real photographs with branded overlays...</div>
      <div class="step" id="step3"><span class="step-icon">🔊</span> 3. Generating natural voiceover narration...</div>
      <div class="step" id="step4"><span class="step-icon">🎬</span> 4. Muxing video and audio with FFmpeg...</div>
    </div>

    <!-- ERROR -->
    <div id="error-box"></div>
  </form>

  <!-- RESULT -->
  <div class="card" id="result-box">
    <div class="video-card">
      <h3>🎉 Your Video is Ready!</h3>
      <video id="videoPlayer" controls playsinline></video>
      <div style="margin-top:12px;color:var(--muted);font-size:0.9rem">
        🔊 Full AI voiceover audio included!
      </div>
      <br/>
      <a id="downloadBtn" href="#" download class="btn-download">⬇️ Download Video (MP4)</a>
    </div>

    <div class="script-box">
      <h4>📋 Voiceover Script</h4>
      <div id="scriptContent"></div>
    </div>

    <div style="margin-top:20px;text-align:center">
      <button onclick="resetForm()" style="background:transparent;border:1px solid var(--gold);color:var(--gold);padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.95rem">
        🔄 Generate Another Video
      </button>
    </div>
  </div>

</main>

<footer>
  <p>🏢 Built for Realty Assistant · AI Content Creation Task</p>
  <p style="margin-top:6px"><a href="https://github.com/Ashutoshchaubey553/property-video-generator" target="_blank">📂 View Repository on GitHub</a></p>
</footer>

<script>
  let selectedFiles = [];

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('imageUpload');
  const previewContainer = document.getElementById('previewContainer');

  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    addFiles(droppedFiles);
  }, false);

  fileInput.addEventListener('change', (e) => {
    const pickedFiles = Array.from(e.target.files);
    addFiles(pickedFiles);
  });

  function addFiles(newFiles) {
    newFiles.forEach(file => {
      if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        selectedFiles.push(file);
      }
    });
    renderPreviews();
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
  }

  function renderPreviews() {
    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'preview-card';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '✕';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeFile(index);
      };

      const filename = document.createElement('div');
      filename.className = 'filename';
      filename.textContent = file.name.replace(/^[0-9]+_/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      card.appendChild(img);
      card.appendChild(removeBtn);
      card.appendChild(filename);
      previewContainer.appendChild(card);
    });
  }

  // Pre-load the 8 real downloaded photos via one click!
  async function loadSamplePhotos() {
    try {
      const resp = await fetch('/api/sample-images');
      const data = await resp.json();
      if (!data.images || data.images.length === 0) return alert('No sample images found');

      for (const item of data.images) {
        const fileResp = await fetch(item.url);
        const blob = await fileResp.blob();
        const file = new File([blob], item.name, { type: blob.type || 'image/jpeg' });
        addFiles([file]);
      }
    } catch(err) {
      alert('Could not auto-load images: ' + err.message);
    }
  }

  function loadRealtyPreset() {
    document.getElementById('propName').value = 'The Grand Crest by Realty Assistant';
    document.getElementById('propLocation').value = 'Sector 150, Noida Express Highway';
    document.getElementById('propPrice').value = '28500000';
    document.getElementById('propType').value = '4 BHK Ultra-Luxury Residence';
    document.getElementById('propBeds').value = '4';
    document.getElementById('propBaths').value = '4';
    document.getElementById('propArea').value = '2,450 sq ft';
    document.getElementById('propContact').value = '+91 99990 12345 | info@realtyassistant.in';
    document.getElementById('propFeatures').value = 'Expansive living room with double-height panoramic windows\nItalian modular kitchen equipped with premium appliances\nPalatial master bedroom suite with walk-in dressing lounge\nSun-drenched balcony overlooking scenic landscaped greens\nResort-style infinity pool and luxury wellness clubhouse';
    document.getElementById('propCta').value = 'Book an Exclusive Site Visit with Realty Assistant!';
  }

  // Auto-load sample photos on first load so the user sees real images immediately!
  window.addEventListener('DOMContentLoaded', () => {
    loadSamplePhotos();
  });

  function setTheme(theme, btn) {
    document.getElementById('themeInput').value = theme;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  let progressTimer = null;
  function startProgress() {
    const fill = document.getElementById('progressFill');
    const steps = ['step1', 'step2', 'step3', 'step4'];
    let pct = 0, stepIdx = 0;
    fill.style.width = '0%';
    steps.forEach(s => { document.getElementById(s).className = 'step'; });
    document.getElementById('step1').className = 'step active';

    progressTimer = setInterval(() => {
      if (pct < 90) {
        pct += 1.8;
        fill.style.width = Math.min(pct, 90) + '%';
        const si = Math.floor((pct / 90) * steps.length);
        if (si < steps.length && si !== stepIdx) {
          if (stepIdx > 0) document.getElementById(steps[stepIdx-1]).className = 'step done';
          document.getElementById(steps[si]).className = 'step active';
          stepIdx = si;
        }
      }
    }, 450);
  }

  function stopProgress() {
    clearInterval(progressTimer);
    document.getElementById('progressFill').style.width = '100%';
    ['step1', 'step2', 'step3', 'step4'].forEach(s => {
      document.getElementById(s).className = 'step done';
    });
  }

  document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('generateBtn');
    const statusBox = document.getElementById('status-box');
    const resultBox = document.getElementById('result-box');
    const errorBox = document.getElementById('error-box');

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Generating Video with Real Photos...';
    statusBox.style.display = 'block';
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    startProgress();

    const formData = new FormData(e.target);
    formData.delete('images');
    selectedFiles.forEach(file => {
      formData.append('images', file, file.name);
    });

    try {
      const resp = await fetch('/generate', { method: 'POST', body: formData });
      const data = await resp.json();
      stopProgress();

      if (data.success) {
        const player = document.getElementById('videoPlayer');
        player.src = data.videoUrl;
        player.muted = false;
        player.load();

        document.getElementById('downloadBtn').href = data.videoUrl;
        document.getElementById('downloadBtn').download = data.videoFile;

        const scriptDiv = document.getElementById('scriptContent');
        scriptDiv.innerHTML = data.script.map(s => \`
          <div class="script-scene">
            <div class="label">\${s.scene.replace(/_/g, ' ')}</div>
            <div class="text">"\${s.voiceover}"</div>
          </div>
        \`).join('');

        statusBox.style.display = 'none';
        resultBox.style.display = 'block';
        resultBox.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      stopProgress();
      statusBox.style.display = 'none';
      errorBox.style.display = 'block';
      errorBox.textContent = '❌ Error: ' + err.message;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>🎬</span> Generate Property Video with Real Photos & Voiceover';
    }
  });

  function resetForm() {
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('videoForm').reset();
    selectedFiles = [];
    renderPreviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>
</body>
</html>`;
}

module.exports = app;
