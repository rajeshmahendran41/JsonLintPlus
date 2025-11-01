# Favicon Files Required

This directory should contain the following favicon files for JSONLintPlus:

## Required Files

### Favicon Files
- `favicon-16x16.png` - 16x16px favicon
- `favicon-32x32.png` - 32x32px favicon
- `apple-touch-icon.png` - 180x180px Apple touch icon
- `icon-192x192.png` - 192x192px PWA icon
- `icon-512x512.png` - 512x512px PWA icon
- `safari-pinned-tab.svg` - Safari pinned tab icon (monochrome SVG)

### Social Media Images
- `og-image.png` - 1200x630px Open Graph image
- `twitter-card.png` - 1200x600px Twitter Card image
- `logo.png` - 40x40px logo for header

## Design Specifications

### Icon Design
- **Background**: Blue (#0066CC)
- **Foreground**: White
- **Symbol**: JSON brackets `{}` in clean, modern font
- **Style**: Circular icon with subtle shadow

### Logo Design
- **Text**: "JSONLintPlus" in modern sans-serif font
- **Color**: White text on blue background (#0066CC)
- **Size**: 40x40px for header, scalable for other uses

## Generation Tools

Use one of these tools to generate the favicon files:

1. **RealFaviconGenerator** (recommended)
   - Upload a high-resolution source image
   - Generate all required sizes automatically
   - Provides HTML code for implementation

2. **Favicon.io**
   - Create favicon from text/symbol
   - Generate multiple sizes
   - Free online tool

3. **Canva or Figma**
   - Design custom icon
   - Export in required sizes
   - Professional design control

## Implementation

Once generated, ensure these files are placed in the `/images/` directory and referenced correctly in the HTML head section.

## File Structure
```
images/
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── icon-192x192.png
├── icon-512x512.png
├── safari-pinned-tab.svg
├── og-image.png
├── twitter-card.png
└── logo.png