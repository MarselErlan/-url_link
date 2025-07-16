const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng(svgFile, pngFile, size) {
  try {
    await sharp(svgFile)
      .resize(size, size)
      .png()
      .toFile(pngFile);
    console.log(`✓ Converted ${svgFile} to ${pngFile}`);
  } catch (error) {
    console.error(`✗ Error converting ${svgFile}:`, error.message);
  }
}

async function convertAll() {
  const conversions = [
    { svg: 'icon16.svg', png: 'icon16.png', size: 16 },
    { svg: 'icon48.svg', png: 'icon48.png', size: 48 },
    { svg: 'icon128.svg', png: 'icon128.png', size: 128 }
  ];

  for (const { svg, png, size } of conversions) {
    if (fs.existsSync(svg)) {
      await convertSvgToPng(svg, png, size);
    } else {
      console.log(`⚠ ${svg} not found, skipping...`);
    }
  }
  
  console.log('\nIcon conversion complete!');
}

convertAll().catch(console.error); 