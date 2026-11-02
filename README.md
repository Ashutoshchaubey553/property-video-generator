# 🏠 AI Property Video Generator

> **Track:** AI Content Creation / Multimedia  
> **Task:** Real Estate Promotional Video Generator

An AI-powered tool that automatically generates professional promotional MP4 videos for real estate properties from basic property details and optional images.

---

## 🎯 What It Does

Takes property data (name, location, price, features, images) and automatically:
1. **Generates a voiceover script** using template AI logic (facts-only, no hallucination)
2. **Renders styled scene frames** with text overlays, badges, and decorative UI
3. **Assembles an MP4 video** using FFmpeg with smooth scene transitions
4. **Exports a JSON script** with full voiceover for review

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- All dependencies are bundled (FFmpeg included via `@ffmpeg-installer/ffmpeg`)

### Install Dependencies
```bash
npm install
```

### Run Demo (Sample Property)
```bash
npm run demo
# OR
node generate.js --demo
```

### Generate Video from Your Property Data
```bash
node generate.js --input sample-data/property.json
```

### With Custom Images
```bash
node generate.js --input sample-data/property.json --images ./my-property-photos --theme luxury
```

---

## 📋 CLI Usage

```
node generate.js [options]

Options:
  --demo            Run with built-in sample property data
  --input <file>    Path to property JSON file
  --output <file>   Output MP4 path (default: output/<name>_video.mp4)
  --images <dir>    Directory with property images (.jpg/.png/.webp)
  --theme <name>    Visual theme: luxury | modern | classic
  --outdir <dir>    Output directory (default: ./output)
```

---

## 📁 Property JSON Format

Create a JSON file with your property details:

```json
{
  "name": "Skyline Heights Residency",
  "location": "Bandra West, Mumbai",
  "price": 35000000,
  "type": "3 BHK Luxury Apartment",
  "bedrooms": 3,
  "bathrooms": 3,
  "area": "1,850 sq ft",
  "features": [
    "Sea-facing balcony with panoramic ocean views",
    "Modular kitchen with premium appliances",
    "Master suite with walk-in wardrobe",
    "Dedicated covered parking (2 slots)",
    "24x7 security with CCTV surveillance"
  ],
  "contact": "+91 98765 43210",
  "cta": "Book a Free Site Visit Today!",
  "description": "Optional property description...",
  "theme": "luxury"
}
```

All fields except `name` are optional — missing fields are handled gracefully.

---

## 🎬 Video Structure

Each generated video contains these scenes:

| Scene | Content | Duration |
|-------|---------|---------|
| **Opening Title** | Property name, location, type badge | 4 seconds |
| **Price & Specs** | Price, bedrooms/bathrooms/area | 4 seconds |
| **Feature 1–5** | Each key feature with property image | 4 seconds each |
| **Call to Action** | CTA message + contact info | 5 seconds |

**Total: ~25–37 seconds** depending on feature count.

---

## 🎨 Visual Themes

| Theme | Colors | Best For |
|-------|--------|---------|
| `luxury` | Deep navy + gold accent | High-end residential |
| `modern` | Dark blue + cyan accent | Contemporary apartments |
| `classic` | Deep brown + amber accent | Heritage & traditional homes |

---

## 📖 Generated Script Example

```
[Scene 1] OPENING
"Welcome to Skyline Heights Residency, located in Bandra West, Mumbai."

[Scene 2] PRICE
"This 3 BHK Luxury Apartment is priced at ₹3.50 Cr, featuring 3 Bedrooms, 3 Bathrooms, 1,850 sq ft."

[Scene 3] FEATURE_1
"Enjoy the sea-facing balcony with panoramic ocean views."

[Scene 8] CTA
"Don't miss this opportunity! Book a Free Site Visit Today! Reach us at +91 98765 43210."
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `@ffmpeg-installer/ffmpeg` | Bundled FFmpeg binary (no system install needed) |
| `fluent-ffmpeg` | FFmpeg Node.js wrapper |
| `canvas` | Frame rendering with text/image overlays |
| `sharp` / `jimp` | Image processing utilities |

---

## 🗂️ Project Structure

```
AI developer task Realty Assistant/
├── generate.js              ← CLI entry point
├── src/
│   ├── videoEngine.js       ← Main orchestrator
│   ├── scriptGenerator.js   ← AI script generation
│   ├── frameGenerator.js    ← Canvas frame renderer
│   ├── videoAssembler.js    ← FFmpeg video assembly
│   └── sampleData.js        ← Sample property data
├── sample-data/
│   ├── property.json        ← Sample property input
│   └── images/              ← Put property images here
├── output/                  ← Generated videos & scripts
│   ├── sample_property_video.mp4
│   └── sample_property_video_script.json
└── README.md
```

---

## ⚠️ Error Handling

- **Missing images**: Falls back to styled synthetic backgrounds
- **Missing fields**: All optional fields have sensible defaults
- **Invalid JSON**: Clear error message with the problem identified
- **FFmpeg failure**: Detailed error output to help diagnose

---

## 🔒 Data Safety

- Uses synthetic/anonymized data only
- No passwords, API keys, or real customer PII included
- All data stays local — no external API calls required

---

## 🤖 AI Approach

The script generator uses **template-based AI logic** that:
- Only uses facts supplied in the property input (no hallucination)
- Structures content in a proven real estate marketing format
- Varies sentence openers for natural-sounding voiceover text
- Formats Indian prices (Lakhs/Crores) automatically

For enhanced voiceover, integrate an LLM API (GPT-4, Gemini) by replacing the `generateScript()` function in `src/scriptGenerator.js`.

---

## 📝 Known Limitations

- Frame transitions are slide-based (no crossfade between scenes with this FFmpeg approach)
- No actual audio/TTS — voiceover script is exported as text for manual recording
- Canvas text rendering uses system fonts only

---

*Built as part of AI Developer Task — Real Estate AI Assignments*

