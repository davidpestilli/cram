/**
 * Script para gerar screenshots básicos para PWA
 */

const fs = require('fs').promises;
const path = require('path');

function createScreenshotSVG(width, height, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    
    <!-- Header -->
    <rect x="0" y="0" width="${width}" height="80" fill="url(#headerGrad)"/>
    <text x="30" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">CRAM</text>
    <text x="${width - 150}" y="35" font-family="Arial, sans-serif" font-size="12" fill="white">Lv.5 ✨1250 🪙850</text>
    <text x="${width - 150}" y="55" font-family="Arial, sans-serif" font-size="12" fill="white">🔥 Streak: 7 dias</text>
    
    <!-- Content Cards -->
    <rect x="20" y="100" width="${width - 40}" height="120" rx="12" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    <text x="30" y="130" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Dashboard</text>
    <text x="30" y="155" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">Bem-vindo de volta! Pronto para estudar?</text>
    
    <!-- Stats Cards -->
    <rect x="30" y="180" width="${Math.floor((width - 80) / 3)}" height="60" rx="8" fill="#f3f4f6"/>
    <text x="40" y="205" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Level</text>
    <text x="40" y="225" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">5</text>
    
    <rect x="${40 + Math.floor((width - 80) / 3)}" y="180" width="${Math.floor((width - 80) / 3)}" height="60" rx="8" fill="#f3f4f6"/>
    <text x="${50 + Math.floor((width - 80) / 3)}" y="205" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">XP Total</text>
    <text x="${50 + Math.floor((width - 80) / 3)}" y="225" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">1250</text>
    
    <rect x="${50 + 2 * Math.floor((width - 80) / 3)}" y="180" width="${Math.floor((width - 80) / 3)}" height="60" rx="8" fill="#f3f4f6"/>
    <text x="${60 + 2 * Math.floor((width - 80) / 3)}" y="205" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Gold</text>
    <text x="${60 + 2 * Math.floor((width - 80) / 3)}" y="225" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">850</text>
    
    <!-- Action Buttons -->
    <rect x="20" y="260" width="${width - 40}" height="180" rx="12" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    <text x="30" y="290" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Ações Rápidas</text>
    
    <!-- Study Button -->
    <rect x="30" y="310" width="${Math.floor((width - 80) / 3)}" height="100" rx="8" fill="#ddd6fe" stroke="#a78bfa" stroke-width="2" stroke-dasharray="4,4"/>
    <rect x="${35 + Math.floor((width - 40) / 6)}" y="330" width="40" height="40" rx="8" fill="#3b82f6"/>
    <text x="${30 + Math.floor((width - 80) / 6)}" y="385" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#1f2937">Estudar</text>
    <text x="${30 + Math.floor((width - 80) / 6)}" y="400" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#6b7280">Escolha uma matéria</text>
    
    <!-- Title -->
    <text x="${width/2}" y="${height - 30}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#6b7280">${title}</text>
  </svg>`;
}

async function generateScreenshots() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  try {
    // Wide screenshot (desktop)
    const wideScreenshot = createScreenshotSVG(1280, 720, 'CRAM - Estudo Gamificado de Direito');
    await fs.writeFile(path.join(publicDir, 'screenshot-wide.svg'), wideScreenshot);
    console.log('Created screenshot-wide.svg');
    
    // Narrow screenshot (mobile)
    const narrowScreenshot = createScreenshotSVG(720, 1280, 'CRAM Mobile');
    await fs.writeFile(path.join(publicDir, 'screenshot-narrow.svg'), narrowScreenshot);
    console.log('Created screenshot-narrow.svg');
    
    console.log('\n✅ Screenshots generated successfully!');
    
  } catch (error) {
    console.error('Error generating screenshots:', error);
  }
}

generateScreenshots();