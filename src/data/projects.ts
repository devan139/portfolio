export interface Project {
  id: string;
  slug: string;
  number?: string;
  title: string;
  organization?: string;
  category: string;
  type?: string; // Legacy field
  status?: 'completed' | 'building';
  description: string;
  role?: string;
  technologies?: string[];
  mediaType: 'image' | 'video' | 'abstract';
  mediaSrc?: string;
  image?: string; // Legacy field
  video?: string; // Legacy field
  poster?: string;
  confidentiality?: string;
  link?: string;
}

export const projects: Project[] = [
  {
    id: 'adnoc-vr',
    slug: 'adnoc',
    number: '01',
    title: 'WE WALK THE LINE',
    organization: 'ADNOC',
    category: 'INDUSTRIAL VR TRAINING',
    status: 'completed',
    description: 'A VR simulation created for industrial training.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'VR', '3D interaction', 'Simulation'],
    mediaType: 'abstract',
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.'
  },
  {
    id: 'bits-pilani',
    slug: 'bits-pilani',
    number: '02',
    title: 'TRAINING SIMULATION',
    organization: 'BITS PILANI',
    category: 'IMMERSIVE TRAINING',
    status: 'completed',
    description: 'An interactive VR training/simulation experience.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'VR', '3D interaction', 'Simulation'],
    mediaType: 'abstract',
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.'
  },
  {
    id: 'vr-molecular-lab',
    slug: 'molecular-lab',
    number: '03',
    title: 'VR MOLECULAR LAB',
    category: 'IMMERSIVE EDUCATION',
    status: 'completed',
    description: 'An interactive virtual laboratory experience for exploring molecular concepts in VR.',
    mediaType: 'video',
    mediaSrc: '/videos/vr-molecular-lab.mp4',
    poster: '/images/vr-molecular-lab-poster.jpg',
    link: 'https://github.com/devan139/VR-Molecular-Lab'
  },
  {
    id: 'aerix',
    slug: 'aerix',
    title: 'AERIX',
    category: 'AI Fitness Product',
    status: 'building',
    description: 'AERIX is an AI-powered fitness product I\'m building to explore adaptive training, personalized workouts and better decision-making during training.',
    mediaType: 'image',
    link: 'https://github.com/devan139/Aerix'
  }
];
