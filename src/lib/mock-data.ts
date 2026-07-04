export const MOCK_USER = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  full_name: 'Lucas Silva',
  instrument: 'Trompete',
  enrollment_id: 'BMB-2024-042',
  avatar_url: 'https://img.usecurling.com/ppl/medium?gender=male&seed=42',
  role: 'student',
}

export const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Desfile de Aniversário da Cidade',
    description: 'Apresentação cívica na avenida principal com todo o corpo musical.',
    date: '2026-08-14T09:00:00Z',
    location_name: 'Av. Dom Lúcio, Botucatu-SP',
    is_public: true,
  },
  {
    id: '2',
    title: 'Ensaio Geral Aberto',
    description: 'Ensaio de preparação para o campeonato estadual.',
    date: '2026-08-20T19:30:00Z',
    location_name: 'Sede da Banda BMB',
    is_public: true,
  },
  {
    id: '3',
    title: 'Campeonato Estadual de Bandas',
    description: 'Competição oficial da federação.',
    date: '2026-09-05T14:00:00Z',
    location_name: 'Ginásio do Ibirapuera, São Paulo-SP',
    is_public: true,
  },
]

export const MOCK_MATERIALS = [
  {
    id: '1',
    title: 'Hino de Botucatu (Grade)',
    category: 'Partituras',
    file_url: '#',
    created_at: '2026-07-01',
  },
  {
    id: '2',
    title: 'Método Essencial - Trompete Vol. 1',
    category: 'Métodos',
    file_url: '#',
    created_at: '2026-06-15',
  },
  {
    id: '3',
    title: 'Regulamento Interno 2026',
    category: 'Avisos',
    file_url: '#',
    created_at: '2026-01-10',
  },
  {
    id: '4',
    title: 'Marcha Radetzky (Trompete 1)',
    category: 'Partituras',
    file_url: '#',
    created_at: '2026-07-05',
  },
]

export const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Postura Básica de Marcha',
    description: 'Instruções iniciais para novos membros.',
    category: 'Marcha',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: '2',
    title: 'Coreografia - Peça de Confronto',
    description: 'Revisão dos movimentos do compasso 40 ao 80.',
    category: 'Coreografia',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: '3',
    title: 'Aquecimento Diário de Metais',
    description: 'Rotina de 15 minutos.',
    category: 'Instrumento',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
]
