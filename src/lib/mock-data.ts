import { Playlist } from '@/types';

export const INITIAL_MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'default',
    slug: 'all-of-the-moons',
    title: 'All Of The Moons',
    description: 'Selección semestral de curaduría generada en Tune Tracker (2da Mitad 2026: 1 Jun — 20 Nov). Metalcore contemporáneo, riffs técnicos y pasajes orquestales.',
    story: 'All Of The Moons representa la culminación sonora de la segunda mitad de 2026. Una travesía marcada por el impacto de producciones pesadas, guitarras viscerales y momentos de catarsis absoluta que dominaron mis escuchas cotidianas.',
    cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    dominant_color: '#3b1d28',
    release_date: '2026-11-12',
    release_type: 'Semestral',
    catalog_number: 'TT-2026-02',
    cycle_year: '2026',
    cycle_half: '2',
    period_str: '1 Jun — 20 Nov 2026',
    target_count: 20,
    tags: ['TUNE TRACKER', 'METAL', 'ROCK', '2026-H2'],
    creator_username: 'Vrak_23',
    creator_name: 'Vrak23',
    creator_avatar: '',
    created_at: '2026-11-12T06:19:19.021Z',
    updated_at: '2026-11-12T06:19:19.021Z',
    tracks: [
      { id: 't-1', playlist_id: 'default', position: 1, title: "Cap's Promise", artist: 'Henry Jackman', album: 'Captain America: Civil War', plays: 82, notes: 'Apertura orquestal solemne que establece la atmósfera del viaje.' },
      { id: 't-2', playlist_id: 'default', position: 2, title: 'IX', artist: 'Trivium', album: 'What The Dead Men Say', plays: 89, notes: 'La antesala técnica y vertiginosa perfecta.' },
      { id: 't-3', playlist_id: 'default', position: 3, title: 'What The Dead Men Say', artist: 'Trivium', album: 'What The Dead Men Say', plays: 102, notes: 'Riffs demoledores y un estribillo icónico.' },
      { id: 't-4', playlist_id: 'default', position: 4, title: 'Immovable Stone', artist: 'Sylosis', album: 'Immovable Stone', plays: 76, notes: 'Precisión técnica inglesa al más alto nivel.' },
      { id: 't-5', playlist_id: 'default', position: 5, title: 'Crown In The Grave', artist: 'Trivium', album: 'Crown In The Grave', plays: 66 },
      { id: 't-6', playlist_id: 'default', position: 6, title: 'Dead Inside Of Me', artist: 'Trivium', album: 'Dead Inside Of Me', plays: 125, notes: 'Uno de los temas con más repeticiones consecutivas.' },
      { id: 't-7', playlist_id: 'default', position: 7, title: 'Bending The Arc To Fear', artist: 'Trivium', album: 'What The Dead Men Say', plays: 74 },
      { id: 't-8', playlist_id: 'default', position: 8, title: 'Like A Sword Over Damocles', artist: 'Trivium', album: 'In The Court Of The Dragon', plays: 83 },
      { id: 't-9', playlist_id: 'default', position: 9, title: 'Joseph', artist: 'Falling In Reverse', album: 'Joseph', plays: 107 },
      { id: 't-10', playlist_id: 'default', position: 10, title: 'Dehumanized', artist: 'Bring Me The Horizon', album: 'Count Your Blessings | Repented', plays: 124 },
      { id: 't-11', playlist_id: 'default', position: 11, title: 'Arsenal', artist: 'Slipknot', album: 'Arsenal', plays: 144, notes: 'Pura energía y percusión desatada.' },
      { id: 't-12', playlist_id: 'default', position: 12, title: 'God Is A Weapon', artist: 'Falling In Reverse', album: 'God Is A Weapon', plays: 94 },
      { id: 't-13', playlist_id: 'default', position: 13, title: 'None of the Suns', artist: 'Marilyn Manson', album: 'One Assassination Under God - Chapter 2', plays: 110 },
      { id: 't-14', playlist_id: 'default', position: 14, title: "Lucifer's Teardrop", artist: 'Marilyn Manson', album: 'One Assassination Under God - Chapter 2', plays: 163, notes: 'Pico absoluto de reproducciones en el periodo.' },
      { id: 't-15', playlist_id: 'default', position: 15, title: 'Unalive', artist: 'Marilyn Manson', album: 'One Assassination Under God - Chapter 2', plays: 100 },
      { id: 't-16', playlist_id: 'default', position: 16, title: 'Seeds In The River', artist: 'Sylosis', album: 'The New Flesh', plays: 70, notes: 'Cierre monumental con tensión y poder instrumental.' }
    ]
  }
];
