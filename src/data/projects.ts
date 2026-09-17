export interface Project {
  id: string;
  title: string;
  type: string;
  status?: 'completed' | 'building';
  description: string;
  image?: string;
  video?: string;
}

export const projects: Project[] = [
  {
    id: 'adnoc-vr',
    title: 'ADNOC',
    type: 'VR Training Simulation',
    status: 'completed',
    description: 'Immersive VR training simulation developed for ADNOC.',
  },
  {
    id: 'bits-pilani',
    title: 'BITS Pilani',
    type: 'Training Simulation',
    status: 'completed',
    description: 'Interactive training simulation developed for BITS Pilani.',
  },
  {
    id: 'vr-molecular-lab',
    title: 'VR Molecular Lab',
    type: 'Virtual Reality',
    status: 'completed',
    description: 'A virtual reality molecular laboratory environment.',
    // video: '/videos/vr-molecular-lab.mp4' // Placeholder for future video
  },
  {
    id: 'aerix',
    title: 'AERIX',
    type: 'AI Fitness Product',
    status: 'building',
    description: 'Currently building an AI-powered fitness product.',
  }
];
