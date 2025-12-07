const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];
const inputPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    for (const size of sizes) {
      // Regular icon
      await sharp(inputPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(outputDir, `pageo-${size}.png`));

      // Maskable icon (with padding for safe zone)
      const innerSize = Math.floor(size * 0.6);
      const padding = Math.floor(size * 0.2);
      await sharp(inputPath)
        .resize(innerSize, innerSize, { fit: 'contain' })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png()
        .toFile(path.join(outputDir, `pageo-maskable-${size}.png`));

      console.log(`✓ Generated pageo-${size}.png and pageo-maskable-${size}.png`);
    }
    console.log('✓ All icons generated successfully');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
