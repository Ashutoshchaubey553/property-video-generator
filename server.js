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
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (.jpg, .png, .webp)'));
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve generated videos as static files
app.use('/output', express.static(path.join(__dirname, 'output')));

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(getHTML());
});

// ── GENERATE VIDEO API ─────────────────────────────────────────────────────
app.post('/generate', upload.array('images', 8), async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const {
      name, location, price, type,
      bedrooms, bathrooms, area,
      features, contact, cta, description, theme,
    } = req.body;

    // Validate
    if (!name || !name.trim()) {
      cleanup(uploadedFiles);
      return res.status(400).json({ error: 'Property name is required.' });
    }

    // Parse price
    const parsedPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) || price : null;

    // Parse features (textarea, one per line)
    const featureList = (features || '')
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const property = {
      name: name.trim(),
      location: location || '',
      price: parsedPrice,
      type: type || 'Property',
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area || '',
      features: featureList,
      contact: contact || '',
      cta: cta || 'Contact us today!',
      description: description || '',
      theme: theme || 'luxury',
    };

    // Get uploaded image paths
    const imagePaths = uploadedFiles.map(f => f.path);

    // Output path
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${safeName}_${Date.now()}.mp4`);

    console.log(`\n🎬 Generating video for: ${name}`);

    const result = await generatePropertyVideo(property, imagePaths, outputPath, {
      theme: theme || 'luxury',
    });

    // Cleanup uploaded images
    cleanup(uploadedFiles);

    if (result.success) {
      const videoFile = path.basename(result.outputPath);
      res.json({
        success: true,
        videoUrl: `/output/${videoFile}`,
        videoFile,
        duration: result.duration,
        sizeMB: result.sizeMB,
        script: result.script.scenes.map(s => ({
          scene: s.id,
          voiceover: s.voiceover,
        })),
      });
    } else {
      res.status(500).json({ error: 'Video generation failed.' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    cleanup(uploadedFiles);
    res.status(500).json({ error: err.message || 'Unexpected error occurred.' });
  }
});

// ── HEALTH CHECK ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Property Video Generator', version: '1.0.0' });
});

// ── HELPERS ────────────────────────────────────────────────────────────────
function cleanup(files) {
  files.forEach(f => {
    try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
  });
}

// ── START SERVER ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────┐`);
  console.log(`│  🏠 AI Property Video Generator             │`);
  console.log(`│  🌐 Server running on port ${PORT}             │`);
  console.log(`│  📍 http://localhost:${PORT}                  │`);
  console.log(`└─────────────────────────────────────────────┘\n`);
});

// ── HTML UI ────────────────────────────────────────────────────────────────
function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>🏠 AI Property Video Generator</title>
  <style>
    :root {
      --gold: #c9a84c;
      --dark: #0f0f1a;
      --card: #1a1a2e;
      --card2: #16213e;
      --text: #e8e8e8;
      --muted: #9898b8;
      --accent: #c9a84c;
      --green: #22c55e;
      --red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--dark);
      color: var(--text);
      min-height: 100vh;
    }

    /* HEADER */
    header {
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      border-bottom: 2px solid var(--gold);
      padding: 24px 40px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    header h1 { font-size: 1.8rem; color: var(--gold); }
    header p { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
    .logo { font-size: 2.4rem; }

    /* LAYOUT */
    main {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
    }

    /* CARD */
    .card {
      background: var(--card);
      border: 1px solid #2a2a4a;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .card h2 {
      color: var(--gold);
      font-size: 1.1rem;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* FORM */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full { grid-column: 1 / -1; }
    label { display: block; color: var(--muted); font-size: 0.82rem; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    input, textarea, select {
      width: 100%;
      background: #0d0d1f;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
      outline: none;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--gold); }
    textarea { resize: vertical; min-height: 100px; }

    /* UPLOAD ZONE */
    .upload-zone {
      border: 2px dashed #2a2a4a;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .upload-zone:hover { border-color: var(--gold); background: rgba(201,168,76,0.04); }
    .upload-zone input[type=file] { display: none; }
    .upload-zone .icon { font-size: 2.5rem; margin-bottom: 8px; }
    .upload-zone p { color: var(--muted); font-size: 0.9rem; }
    .upload-zone strong { color: var(--gold); }
    #file-list { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
    .file-tag {
      background: rgba(201,168,76,0.12);
      border: 1px solid var(--gold);
      color: var(--gold);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.8rem;
    }

    /* THEME SELECTOR */
    .themes { display: flex; gap: 12px; }
    .theme-btn {
      flex: 1;
      padding: 12px;
      border: 2px solid #2a2a4a;
      border-radius: 10px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .theme-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
    .theme-btn .dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; margin-bottom: 6px; }

    /* SUBMIT */
    .btn-generate {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #c9a84c, #a07830);
      color: #0f0f1a;
      font-size: 1.1rem;
      font-weight: 800;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .btn-generate:hover { opacity: 0.92; }
    .btn-generate:active { transform: scale(0.99); }
    .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

    /* PROGRESS */
    #status-box { display: none; }
    .progress-bar {
      height: 6px;
      background: #2a2a4a;
      border-radius: 3px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold), #e8c87a);
      border-radius: 3px;
      width: 0%;
      transition: width 0.4s ease;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; }
    }
    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      color: var(--muted);
      font-size: 0.9rem;
      transition: color 0.3s;
    }
    .step.active { color: var(--gold); }
    .step.done { color: var(--green); }
    .step-icon { font-size: 1.1rem; width: 24px; text-align: center; }

    /* RESULT */
    #result-box { display: none; }
    .video-card {
      background: #0d0d1f;
      border: 1px solid var(--green);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .video-card h3 { color: var(--green); margin-bottom: 16px; font-size: 1.2rem; }
    video { width: 100%; border-radius: 8px; max-height: 400px; background: #000; }
    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 28px;
      background: var(--green);
      color: #fff;
      font-weight: 700;
      border-radius: 8px;
      text-decoration: none;
      font-size: 1rem;
      transition: opacity 0.2s;
    }
    .btn-download:hover { opacity: 0.88; }

    /* SCRIPT */
    .script-box {
      background: #0d0d1f;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
    }
    .script-box h4 { color: var(--gold); margin-bottom: 12px; }
    .script-scene {
      border-left: 3px solid var(--gold);
      padding: 8px 12px;
      margin-bottom: 8px;
      background: rgba(201,168,76,0.04);
      border-radius: 0 6px 6px 0;
    }
    .script-scene .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 700; }
    .script-scene .text { color: var(--text); font-size: 0.9rem; margin-top: 2px; font-style: italic; }

    /* ERROR */
    #error-box {
      display: none;
      background: rgba(239,68,68,0.1);
      border: 1px solid var(--red);
      border-radius: 10px;
      padding: 16px;
      color: var(--red);
      margin-top: 16px;
    }

    /* FOOTER */
    footer {
      text-align: center;
      color: var(--muted);
      font-size: 0.82rem;
      padding: 40px 20px;
    }
    footer a { color: var(--gold); text-decoration: none; }
  </style>
</head>
<body>

<header>
  <div class="logo">🏠</div>
  <div>
    <h1>AI Property Video Generator</h1>
    <p>Turn property details into a professional promotional MP4 video — instantly</p>
  </div>
</header>

<main>
  <form id="videoForm" enctype="multipart/form-data">

    <!-- PROPERTY DETAILS -->
    <div class="card">
      <h2>📋 Property Details</h2>
      <div class="grid">
        <div class="full">
          <label>Property Name *</label>
          <input type="text" name="name" placeholder="e.g. Skyline Heights Residency" required value="Skyline Heights Residency"/>
        </div>
        <div>
          <label>Location</label>
          <input type="text" name="location" placeholder="e.g. Bandra West, Mumbai" value="Bandra West, Mumbai"/>
        </div>
        <div>
          <label>Price (₹)</label>
          <input type="text" name="price" placeholder="e.g. 3.5 Cr or 35000000" value="35000000"/>
        </div>
        <div>
          <label>Property Type</label>
          <input type="text" name="type" placeholder="e.g. 3 BHK Luxury Apartment" value="3 BHK Luxury Apartment"/>
        </div>
        <div>
          <label>Bedrooms</label>
          <input type="number" name="bedrooms" placeholder="3" value="3" min="0" max="20"/>
        </div>
        <div>
          <label>Bathrooms</label>
          <input type="number" name="bathrooms" placeholder="3" value="3" min="0" max="20"/>
        </div>
        <div>
          <label>Area</label>
          <input type="text" name="area" placeholder="e.g. 1,850 sq ft" value="1,850 sq ft"/>
        </div>
        <div>
          <label>Contact Number</label>
          <input type="text" name="contact" placeholder="+91 98765 43210" value="+91 98765 43210"/>
        </div>
        <div class="full">
          <label>Key Features (one per line)</label>
          <textarea name="features" placeholder="Sea-facing balcony with panoramic views&#10;Modular kitchen with premium appliances&#10;Master suite with walk-in wardrobe">Sea-facing balcony with panoramic ocean views
Modular kitchen with premium appliances
Master suite with walk-in wardrobe
Dedicated covered parking (2 slots)
24x7 security with CCTV surveillance</textarea>
        </div>
        <div class="full">
          <label>Call to Action</label>
          <input type="text" name="cta" placeholder="Book a Free Site Visit Today!" value="Book a Free Site Visit Today!"/>
        </div>
      </div>
    </div>

    <!-- IMAGES -->
    <div class="card">
      <h2>📸 Property Images (optional, up to 8)</h2>
      <div class="upload-zone" onclick="document.getElementById('imageUpload').click()">
        <input type="file" id="imageUpload" name="images" multiple accept=".jpg,.jpeg,.png,.webp" onchange="showFiles(this)"/>
        <div class="icon">📷</div>
        <p><strong>Click to upload</strong> or drag & drop</p>
        <p>JPG, PNG, WEBP · Max 10 MB each · Up to 8 images</p>
        <div id="file-list"></div>
      </div>
      <p style="color:var(--muted);font-size:0.82rem;margin-top:10px">
        💡 No images? No problem — we'll generate styled backgrounds automatically.
      </p>
    </div>

    <!-- THEME -->
    <div class="card">
      <h2>🎨 Visual Theme</h2>
      <div class="themes">
        <button type="button" class="theme-btn active" onclick="setTheme('luxury', this)">
          <div><div class="dot" style="background:#c9a84c;margin:0 auto 6px"></div></div>
          <strong>Luxury</strong><br/><small style="color:var(--muted)">Navy + Gold</small>
        </button>
        <button type="button" class="theme-btn" onclick="setTheme('modern', this)">
          <div><div class="dot" style="background:#00bcd4;margin:0 auto 6px"></div></div>
          <strong>Modern</strong><br/><small style="color:var(--muted)">Dark + Cyan</small>
        </button>
        <button type="button" class="theme-btn" onclick="setTheme('classic', this)">
          <div><div class="dot" style="background:#d4a853;margin:0 auto 6px"></div></div>
          <strong>Classic</strong><br/><small style="color:var(--muted)">Brown + Amber</small>
        </button>
      </div>
      <input type="hidden" name="theme" id="themeInput" value="luxury"/>
    </div>

    <!-- GENERATE BUTTON -->
    <button type="submit" class="btn-generate" id="generateBtn">
      <span>🎬</span> Generate Property Video
    </button>

    <!-- STATUS -->
    <div class="card" id="status-box" style="margin-top:24px">
      <h2>⚙️ Generating your video...</h2>
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <div class="step" id="step1"><span class="step-icon">📝</span> Generating AI voiceover script...</div>
      <div class="step" id="step2"><span class="step-icon">🎨</span> Rendering scene frames...</div>
      <div class="step" id="step3"><span class="step-icon">🎬</span> Encoding MP4 with FFmpeg...</div>
      <div class="step" id="step4"><span class="step-icon">✅</span> Finalizing video...</div>
    </div>

    <!-- ERROR -->
    <div id="error-box"></div>
  </form>

  <!-- RESULT -->
  <div class="card" id="result-box">
    <div class="video-card">
      <h3>🎉 Video Ready!</h3>
      <video id="videoPlayer" controls playsinline></video>
      <br/>
      <a id="downloadBtn" href="#" download class="btn-download">⬇️ Download MP4</a>
    </div>
    <div class="script-box">
      <h4>📋 Generated Voiceover Script</h4>
      <div id="scriptContent"></div>
    </div>
    <div style="margin-top:16px;text-align:center">
      <button onclick="resetForm()" style="background:transparent;border:1px solid var(--gold);color:var(--gold);padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.95rem">
        🔄 Generate Another Video
      </button>
    </div>
  </div>

</main>

<footer>
  <p>🏠 AI Property Video Generator · Built with Node.js, Canvas & FFmpeg</p>
  <p style="margin-top:6px"><a href="https://github.com/Ashutoshchaubey553/property-video-generator" target="_blank">📂 View on GitHub</a></p>
</footer>

<script>
  let selectedTheme = 'luxury';

  function setTheme(theme, btn) {
    selectedTheme = theme;
    document.getElementById('themeInput').value = theme;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function showFiles(input) {
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    Array.from(input.files).forEach(f => {
      const tag = document.createElement('div');
      tag.className = 'file-tag';
      tag.textContent = '📸 ' + f.name;
      list.appendChild(tag);
    });
  }

  // Progress animation
  let progressTimer = null;
  function startProgress() {
    const fill = document.getElementById('progressFill');
    const steps = ['step1','step2','step3','step4'];
    let pct = 0, stepIdx = 0;
    fill.style.width = '0%';
    steps.forEach(s => { document.getElementById(s).className = 'step'; });

    progressTimer = setInterval(() => {
      if (pct < 92) {
        pct += Math.random() * 2.5;
        fill.style.width = Math.min(pct, 92) + '%';
        const si = Math.floor((pct / 92) * steps.length);
        if (si < steps.length && si !== stepIdx) {
          if (stepIdx > 0) document.getElementById(steps[stepIdx-1]).className = 'step done';
          document.getElementById(steps[si]).className = 'step active';
          stepIdx = si;
        }
      }
    }, 400);
  }

  function stopProgress() {
    clearInterval(progressTimer);
    document.getElementById('progressFill').style.width = '100%';
    ['step1','step2','step3','step4'].forEach(s => {
      document.getElementById(s).className = 'step done';
    });
  }

  // Form submit
  document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('generateBtn');
    const statusBox = document.getElementById('status-box');
    const resultBox = document.getElementById('result-box');
    const errorBox = document.getElementById('error-box');

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Generating...';
    statusBox.style.display = 'block';
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    startProgress();

    const formData = new FormData(e.target);

    try {
      const resp = await fetch('/generate', { method: 'POST', body: formData });
      const data = await resp.json();
      stopProgress();

      if (data.success) {
        // Show video
        const player = document.getElementById('videoPlayer');
        player.src = data.videoUrl;
        document.getElementById('downloadBtn').href = data.videoUrl;
        document.getElementById('downloadBtn').download = data.videoFile;

        // Show script
        const scriptDiv = document.getElementById('scriptContent');
        scriptDiv.innerHTML = data.script.map(s => \`
          <div class="script-scene">
            <div class="label">\${s.scene.replace(/_/g,' ')}</div>
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
      btn.innerHTML = '<span>🎬</span> Generate Property Video';
    }
  });

  function resetForm() {
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('videoForm').reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>
</body>
</html>`;
}

module.exports = app;

