import { Playlist } from '@/types';

export const INITIAL_MOCK_PLAYLISTS: Playlist[] = [
  {
    id: '1a7a9221-50e5-4d76-8809-ff16543b5701',
    slug: 'nocturnas-de-otono',
    title: 'Nocturnas de Otoño',
    description: 'Composiciones cinemáticas, ambient y texturas analógicas para las horas de mayor quietud.',
    story: `Esta selección comenzó durante una serie de madrugadas de octubre. La intención era reunir piezas que no demandaran atención inmediata, sino que envolvieran el espacio con calidez orgánica, cinta magnética y silencios deliberados.

Cada tema actúa como un pasaje hacia el aislamiento introspectivo, donde los errores de grabación y los ruidos de fondo de sintetizadores modulares adquieren protagonismo.`,
    cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    dominant_color: '#3d2e24',
    spotify_url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    youtube_url: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn5kI81J11r1gvmRuo69eSlo',
    tags: ['Ambient', 'Modern Classical', 'Introspectivo', 'Nocturno'],
    release_date: '2026-03-12',
    release_type: 'LP',
    catalog_number: 'MLV-001',
    creator_username: 'V_rak',
    creator_name: 'V_rak',
    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
    created_at: '2026-03-12T04:00:00Z',
    updated_at: '2026-03-12T04:00:00Z',
    tracks: [
      {
        id: 't1',
        playlist_id: '1a7a9221-50e5-4d76-8809-ff16543b5701',
        position: 1,
        title: 'An Ending (Ascent)',
        artist: 'Brian Eno',
        duration_ms: 264000,
        notes: 'El inicio indispensable. La modulación de los acordes en el Yamaha CS-80 crea una sensación de ingravidez inmediata.',
        spotify_track_id: '1DoWT096Xk8h51h0v3cM7h'
      },
      {
        id: 't2',
        playlist_id: '1a7a9221-50e5-4d76-8809-ff16543b5701',
        position: 2,
        title: 'Avril 14th',
        artist: 'Aphex Twin',
        duration_ms: 125000,
        notes: 'Grabado con fieltros en los martillos del piano. Los chasquidos mecánicos del pedal son tan importantes como las notas.',
        spotify_track_id: '2MZSXhq4XDJWu64Yx29V09'
      },
      {
        id: 't3',
        playlist_id: '1a7a9221-50e5-4d76-8809-ff16543b5701',
        position: 3,
        title: 'Says',
        artist: 'Nils Frahm',
        duration_ms: 504000,
        notes: 'La progresión del sintetizador Juno-60 alcanzando el clímax analógico sin perder la delicadeza.',
        spotify_track_id: '5626RI0n1v4b24g10N186Z'
      },
      {
        id: 't4',
        playlist_id: '1a7a9221-50e5-4d76-8809-ff16543b5701',
        position: 4,
        title: 'A Model of the Universe',
        artist: 'Jóhann Jóhannsson',
        duration_ms: 172000,
        notes: 'Una sección de cuerdas que encapsula la melancolía y la curiosidad científica.',
        spotify_track_id: '4Qv6Dq5F8N9a0B2g1T8u9I'
      }
    ]
  },
  {
    id: '2b8b9332-61f6-5e87-9910-aa27654c6802',
    slug: 'vanguardia-y-cemento',
    title: 'Vanguardia & Cemento',
    description: 'Post-punk, coldwave y ritmos angulares inspirados en la arquitectura brutalista y los espacios industriales.',
    story: `Un compendio de bajos secos, cajas de ritmos Roland TR-808 reverberadas y guitarras con chorus metálico.

Pensada para caminatas por avenidas grises y paisajes urbanos desolados. La selección prioriza grabaciones entre 1978 y 1984 junto con exponentes contemporáneos del darkwave europeo.`,
    cover_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop',
    dominant_color: '#2b333a',
    spotify_url: 'https://open.spotify.com/playlist/37i9dQZF1DXdOEFt9ZX0dh',
    youtube_url: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn4hK1qM9yZ5k7h8j2L6uY1v',
    tags: ['Post-Punk', 'Coldwave', 'Brutalismo', 'Industrial'],
    release_date: '2026-03-08',
    release_type: 'EP',
    catalog_number: 'MLV-002',
    creator_username: 'V_rak',
    creator_name: 'V_rak',
    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
    created_at: '2026-03-08T18:30:00Z',
    updated_at: '2026-03-08T18:30:00Z',
    tracks: [
      {
        id: 't5',
        playlist_id: '2b8b9332-61f6-5e87-9910-aa27654c6802',
        position: 1,
        title: 'Disorder',
        artist: 'Joy Division',
        duration_ms: 212000,
        notes: 'La línea de bajo de Peter Hook define el estándar de toda la atmósfera del disco.',
        spotify_track_id: '58Bo3eFmC9B3Zk4sY5n8F6'
      },
      {
        id: 't6',
        playlist_id: '2b8b9332-61f6-5e87-9910-aa27654c6802',
        position: 2,
        title: 'A Forest',
        artist: 'The Cure',
        duration_ms: 355000,
        notes: 'El ritmo metronómico de la batería y la guitarra procesada con flanger construyen una tensión constante.',
        spotify_track_id: '34g7t5f9D8c4B2k8N1M0Z8'
      },
      {
        id: 't7',
        playlist_id: '2b8b9332-61f6-5e87-9910-aa27654c6802',
        position: 3,
        title: 'Nagoya',
        artist: 'Molchat Doma',
        duration_ms: 198000,
        notes: 'Voz cavernosa y ritmos sintéticos que rinden homenaje al synth-pop soviético.',
        spotify_track_id: '67n5Y8b3K0L1Z9v8M2q4F1'
      }
    ]
  },
  {
    id: '3c9c0443-72a7-6f98-0021-bb38765d7903',
    slug: 'analog-warmth-jazz',
    title: 'Analog Warmth & Modal Sessions',
    description: 'Sesiones de jazz modal en vinilo de 180g, trompetas con sordina y contrabajos resonantes.',
    story: `Grabaciones de finales de los cincuenta y mediados de los sesenta capturadas en los estudios Van Gelder.

La cercanía física de los micrófonos de cinta transmite el aire saliendo de las campanas de latón y el roce de los dedos contra el diapasón de madera.`,
    cover_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000&auto=format&fit=crop',
    dominant_color: '#423326',
    spotify_url: 'https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt',
    youtube_url: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn7l7h8j2L6uY1v0k8m9n7p6q',
    tags: ['Jazz', 'Modal', 'Vinyl', 'Acoustic'],
    release_date: '2026-02-20',
    release_type: 'LP',
    catalog_number: 'MLV-003',
    creator_username: 'V_rak',
    creator_name: 'V_rak',
    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
    created_at: '2026-02-20T21:15:00Z',
    updated_at: '2026-02-20T21:15:00Z',
    tracks: [
      {
        id: 't8',
        playlist_id: '3c9c0443-72a7-6f98-0021-bb38765d7903',
        position: 1,
        title: 'Blue in Green',
        artist: 'Miles Davis, Bill Evans',
        duration_ms: 337000,
        notes: 'El piano de Bill Evans sostiene la estructura circular sobre la que Miles improvisa con una fragilidad única.',
        spotify_track_id: '0fl0B8Q0M4v7C6b5N3x2Z1'
      },
      {
        id: 't9',
        playlist_id: '3c9c0443-72a7-6f98-0021-bb38765d7903',
        position: 2,
        title: 'In a Sentimental Mood',
        artist: 'Duke Ellington, John Coltrane',
        duration_ms: 254000,
        notes: 'El contraste entre el toque percusivo de Ellington y la calidez lírica del saxofón tenor de Coltrane.',
        spotify_track_id: '2b4c6e8g0i2k4m6o8q0s2u'
      }
    ]
  }
];
