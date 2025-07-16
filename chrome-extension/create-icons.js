// Simple script to create basic icon files for the Chrome extension
// This creates placeholder icons - replace with actual icon files

const fs = require('fs');

// Create simple colored squares as placeholders
const createIcon = (size, color) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
    <text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" font-family="Arial" font-size="${size/3}" fill="${color}">J</text>
  </svg>`;
};

// Create icon files (these are SVG placeholders)
fs.writeFileSync('icon16.svg', createIcon(16, '#667eea'));
fs.writeFileSync('icon48.svg', createIcon(48, '#667eea'));
fs.writeFileSync('icon128.svg', createIcon(128, '#667eea'));

console.log('Icon files created. Please convert SVG files to PNG format for production use.');
console.log('You can use an online converter or tools like ImageMagick to convert SVG to PNG.'); 