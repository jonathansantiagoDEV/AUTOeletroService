export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    name: 'Autoserviços',
    short_name: 'Autoserviços',
    description: 'Gerencie registros de serviços automotivos.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#e8ecf0',
    theme_color: '#8b1a1a',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
