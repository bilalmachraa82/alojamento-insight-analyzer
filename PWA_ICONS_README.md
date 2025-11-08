# PWA Icons Setup Guide

## Required Icons

The PWA implementation requires the following icon files to be placed in the `/public` directory:

### Standard Icons
- `icon-192x192.png` - 192x192 pixels, PNG format
- `icon-512x512.png` - 512x512 pixels, PNG format

### Maskable Icons (for better Android experience)
- `icon-192x192-maskable.png` - 192x192 pixels, PNG format, with safe zone
- `icon-512x512-maskable.png` - 512x512 pixels, PNG format, with safe zone

### Optional Screenshots (for better install experience)
- `screenshot-mobile.png` - 390x844 pixels (mobile screenshot)
- `screenshot-desktop.png` - 1920x1080 pixels (desktop screenshot)

## Icon Design Guidelines

### Standard Icons
- Use your app logo/branding
- Background: White or brand color (#ffffff or #2563eb)
- Icon should fill about 80% of the canvas
- Save as PNG with transparency if needed

### Maskable Icons
- Same design as standard icons
- Add 10% safe zone on all sides (content should be in center 80%)
- Background must be opaque (no transparency)
- This ensures the icon looks good when masked to different shapes (circle, square, etc.)

## Quick Icon Generation

### Option 1: Using Online Tools
1. Visit [Maskable.app](https://maskable.app/editor)
2. Upload your logo/icon
3. Adjust the safe zone
4. Download all required sizes

### Option 2: Using ImageMagick (CLI)
```bash
# From a single 1024x1024 source icon
convert source-icon.png -resize 192x192 public/icon-192x192.png
convert source-icon.png -resize 512x512 public/icon-512x512.png

# For maskable icons, ensure 10% padding
convert source-icon.png -resize 154x154 -gravity center -extent 192x192 -background "#2563eb" public/icon-192x192-maskable.png
convert source-icon.png -resize 410x410 -gravity center -extent 512x512 -background "#2563eb" public/icon-512x512-maskable.png
```

### Option 3: Using PWA Asset Generator
```bash
npx pwa-asset-generator public/logo.png public/ --icon-only --favicon
```

## Temporary Placeholder Icons

Until proper icons are created, you can use placeholder icons:

### Quick Placeholder Generation
```bash
# Create simple colored placeholders
convert -size 192x192 xc:#2563eb -gravity center -pointsize 72 -fill white -annotate +0+0 "AI" public/icon-192x192.png
convert -size 512x512 xc:#2563eb -gravity center -pointsize 192 -fill white -annotate +0+0 "AI" public/icon-512x512.png
convert -size 192x192 xc:#2563eb -gravity center -pointsize 72 -fill white -annotate +0+0 "AI" public/icon-192x192-maskable.png
convert -size 512x512 xc:#2563eb -gravity center -pointsize 192 -fill white -annotate +0+0 "AI" public/icon-512x512-maskable.png
```

## Testing Your Icons

1. **Local Testing:**
   - Place icons in `/public` directory
   - Run `npm run dev`
   - Open Chrome DevTools > Application > Manifest
   - Check if all icons are detected

2. **Install Testing:**
   - Deploy to HTTPS server or use localhost
   - Open in Chrome/Edge
   - Click install button when prompted
   - Verify icon appears correctly on home screen

3. **Maskable Icon Testing:**
   - Visit [Maskable.app](https://maskable.app/)
   - Upload your maskable icon
   - Toggle through different mask shapes
   - Ensure icon looks good in all shapes

## Current Status

⚠️ **Icons need to be created and placed in `/public` directory before deployment**

The PWA will work without icons, but:
- Install prompt may not work on some browsers
- App won't have a proper icon on home screen
- May fail PWA audit checks

## Brand Guidelines

For the Alojamento Insight Analyzer:
- **Primary Color:** #2563eb (blue-600)
- **Background:** #ffffff (white)
- **App Name:** "Alojamento Insight Analyzer"
- **Short Name:** "Alojamento Insights"
- **Theme:** Professional, clean, analytics-focused
