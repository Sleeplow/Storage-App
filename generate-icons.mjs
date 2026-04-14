// Script one-shot pour générer les icônes PWA depuis un SVG source
// Usage : node generate-icons.mjs
import sharp from 'sharp'

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3b82f6"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" font-family="serif">📦</text>
</svg>
`)

await sharp(svg).resize(192, 192).png().toFile('public/pwa-192x192.png')
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512x512.png')
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('Icônes PWA générées ✓')
