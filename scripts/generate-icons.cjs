/**
 * Script para gerar ícones PWA básicos usando Canvas
 * Execute: node scripts/generate-icons.js
 */

const fs = require('fs').promises;
const path = require('path');

// Função para criar um ícone SVG simples
function createIconSVG(size, text = 'C') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
  </svg>`;
}

// Função para converter SVG para PNG (básico - apenas cria arquivos SVG por enquanto)
async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const publicDir = path.join(__dirname, '..', 'public');
  
  try {
    // Verificar se o diretório public existe
    await fs.access(publicDir);
    
    for (const size of sizes) {
      const svgContent = createIconSVG(size, 'C');
      const filename = `icon-${size}x${size}.svg`;
      const filepath = path.join(publicDir, filename);
      
      await fs.writeFile(filepath, svgContent);
      console.log(`Created ${filename}`);
    }
    
    // Criar favicon.ico (como SVG por enquanto)
    const faviconSVG = createIconSVG(32, 'C');
    await fs.writeFile(path.join(publicDir, 'favicon.svg'), faviconSVG);
    console.log('Created favicon.svg');
    
    console.log('\n✅ Icons generated successfully!');
    console.log('Note: These are SVG icons. For better PWA support, consider using a tool like sharp to convert to PNG.');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, createIconSVG };