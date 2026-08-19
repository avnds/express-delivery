import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rotix',
    short_name: 'Rotix',
    description: 'Sistema de gestão de entregas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/ico azul android.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}