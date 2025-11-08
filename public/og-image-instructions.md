# Open Graph (OG) Image Instructions

## Specifications

The Open Graph image should be created with the following specifications:

### Dimensions
- **Width:** 1200px
- **Height:** 630px
- **Aspect Ratio:** 1.91:1 (Facebook/LinkedIn recommended)
- **File Format:** JPG or PNG
- **File Size:** Less than 8MB (ideally under 300KB for faster loading)
- **File Name:** `og-image.jpg` or `og-image.png`
- **Location:** `/public/og-image.jpg`

### Design Guidelines

#### Brand Colors
- **Maria Faz Pink:** `#F472B6` (primary accent)
- **Maria Faz Blue:** `#3B82F6` (secondary accent)
- **Brand Black:** `#1F2937` (text/headings)
- **Background:** White or light gray gradient

#### Content Elements

1. **Logo/Brand**
   - Place "A Maria Faz" logo prominently
   - Use Playfair Display font for logo
   - Position: Top left or center

2. **Main Headline**
   - Text: "Alojamento Insight Analyzer"
   - Font: Montserrat Bold, 60-72px
   - Color: Brand Black (#1F2937)
   - Position: Center

3. **Subheadline**
   - Text (Portuguese): "Análise Inteligente para Alojamento Local"
   - Text (English): "AI-Powered Analysis for Short-Term Rentals"
   - Font: Inter Regular, 32-40px
   - Color: Gray (#6B7280)
   - Position: Below headline

4. **Visual Elements**
   - Include subtle icons: house/home, chart/analytics, location pin
   - Use gradient or geometric patterns as background
   - Keep design clean and professional

5. **Call-to-Action (Optional)**
   - Text: "Otimize o Seu Alojamento" or "Optimize Your Property"
   - Font: Inter Medium, 24-28px
   - Button or badge style

### Design Tools

You can create the OG image using:
- **Canva:** Use the "Facebook Post" template (1200x630)
- **Figma:** Create a 1200x630 frame
- **Adobe Photoshop/Illustrator**
- **Online tools:** Remove.bg, Unsplash for stock images

### Alternative Sizes (Optional)

Create additional sizes for different platforms:
- **Twitter Card:** 1200x600px → `twitter-card.jpg`
- **LinkedIn:** 1200x627px → `linkedin-share.jpg`
- **Square:** 1200x1200px → `og-square.jpg`

### Testing the OG Image

After creating and placing the image in `/public/og-image.jpg`:

1. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test URL: https://alojamento-insight-analyzer.mariafaz.com/

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Note: Requires Twitter developer account

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Test URL: https://alojamento-insight-analyzer.mariafaz.com/

4. **OpenGraph.xyz**
   - URL: https://www.opengraph.xyz/
   - Free tool, no login required

### Example Content Layout

```
┌────────────────────────────────────────────────┐
│                                                │
│  A Maria Faz                        [Icon]    │
│                                                │
│                                                │
│         Alojamento Insight Analyzer           │
│                                                │
│      Análise Inteligente para                 │
│          Alojamento Local                     │
│                                                │
│  [Analytics Icon] [House Icon] [Chart Icon]   │
│                                                │
│     [Otimize o Seu Alojamento Button]         │
│                                                │
└────────────────────────────────────────────────┘
```

### Notes

- Ensure text is readable at small sizes (mobile previews)
- Use high contrast between text and background
- Keep important elements within the "safe zone" (center 80%)
- Test how the image looks when cropped to square for some platforms
- Consider creating light and dark mode versions
