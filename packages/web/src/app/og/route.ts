import { Resvg } from '@resvg/resvg-js'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

const LOGO_PATH =
  'M11.1914 0.634766C12.8613 1.20117 17.0703 2.76367 18.7402 3.42773C19.8535 3.88672 20.3711 4.31641 20.3711 5.63477L20.3711 15.1367C20.3711 19.502 18.1152 21.2402 11.0156 25.0879C10.7129 25.2441 10.4102 25.3418 10.1855 25.3418C9.96094 25.3418 9.64844 25.2539 9.35547 25.0879C2.37305 21.0449 0 19.502 0 15.1367L0 5.63477C0 4.31641 0.517578 3.86719 1.63086 3.42773C3.30078 2.77344 7.50977 1.20117 9.17969 0.634766C9.51172 0.537109 9.84375 0.449219 10.1855 0.449219C10.5273 0.449219 10.8594 0.527344 11.1914 0.634766ZM11.8945 3.80859L4.70703 12.8418C4.57031 13.0078 4.50195 13.1738 4.50195 13.3203C4.50195 13.623 4.73633 13.8379 5.03906 13.8379L9.50195 13.8379L7.10938 20.2539C6.81641 21.0254 7.63672 21.4355 8.13477 20.8203L15.332 11.7871C15.4688 11.6211 15.5371 11.4551 15.5371 11.3086C15.5371 11.0059 15.3027 10.791 14.9902 10.791L10.5371 10.791L12.9297 4.375C13.2227 3.61328 12.4023 3.19336 11.8945 3.80859Z'

function buildDotGrid(): string {
  const dots: string[] = []
  const spacing = 28
  const radius = 1.5
  for (let x = 580; x <= 1180; x += spacing) {
    for (let y = 14; y <= 616; y += spacing) {
      // Fade opacity based on distance from left edge of grid
      const t = Math.min((x - 580) / 480, 1)
      const opacity = (0.04 + t * 0.08).toFixed(3)
      dots.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="#ffffff" fill-opacity="${opacity}"/>`,
      )
    }
  }
  return dots.join('\n  ')
}

function buildSvg(): string {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="950" cy="200" r="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6155f5" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#6155f5" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0a0a0a"/>

  <!-- Dot grid (right side, fades in from left) -->
  ${buildDotGrid()}

  <!-- Radial glow (top-right) -->
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo -->
  <g transform="translate(80, 104) scale(3.5)">
    <path d="${LOGO_PATH}" fill="#6155f5"/>
  </g>

  <!-- Title -->
  <text
    x="80"
    y="296"
    font-family="GeistMono, monospace"
    font-size="72"
    font-weight="600"
    fill="#ffffff"
    letter-spacing="-2"
  >route-auditor</text>

  <!-- Subtitle line 1 -->
  <text
    x="80"
    y="356"
    font-family="Geist, sans-serif"
    font-size="24"
    font-weight="400"
    fill="#ffffff"
    fill-opacity="0.45"
  >Scans App Router, Pages Router, and API Routes —</text>
  <!-- Subtitle line 2 -->
  <text
    x="80"
    y="390"
    font-family="Geist, sans-serif"
    font-size="24"
    font-weight="400"
    fill="#ffffff"
    fill-opacity="0.45"
  >detecting missing auth, CSRF gaps, permissive CORS, hardcoded secrets, and more.</text>

  <!-- Tag pills (20px horizontal padding, ~10.8px per char at 18px GeistMono) -->
  <!-- "App Router" = 10 chars = 108px text → rect 148px -->
  <rect x="80" y="450" width="148" height="40" rx="8" fill="#6155f5" fill-opacity="0.15"/>
  <text x="100" y="475" font-family="GeistMono, monospace" font-size="18" fill="#6155f5">App Router</text>

  <!-- "Pages Router" = 12 chars = 130px text → rect 170px -->
  <rect x="244" y="450" width="170" height="40" rx="8" fill="#6155f5" fill-opacity="0.15"/>
  <text x="264" y="475" font-family="GeistMono, monospace" font-size="18" fill="#6155f5">Pages Router</text>

  <!-- "API Routes" = 10 chars = 108px text → rect 148px -->
  <rect x="430" y="450" width="148" height="40" rx="8" fill="#6155f5" fill-opacity="0.15"/>
  <text x="450" y="475" font-family="GeistMono, monospace" font-size="18" fill="#6155f5">API Routes</text>

  <!-- Bottom border -->
  <rect x="0" y="622" width="1200" height="8" fill="#6155f5" fill-opacity="0.6"/>
</svg>`
}

export async function GET() {
  const fontsDir = join(process.cwd(), 'node_modules/geist/dist/fonts')

  const resvg = new Resvg(buildSvg(), {
    font: {
      loadSystemFonts: false,
      fontFiles: [
        join(fontsDir, 'geist-mono/GeistMono-SemiBold.ttf'),
        join(fontsDir, 'geist-sans/Geist-Regular.ttf'),
      ],
      monospaceFamily: 'GeistMono',
      sansSerifFamily: 'Geist',
    },
  })

  const png = resvg.render().asPng()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
