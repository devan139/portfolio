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
  
  // Detail Page Fields
  heroSubtitle?: string;
  contextHeadline?: string;
  contextDescription?: string;
  takeaway?: string;
  nextProject?: string; // slug of the next project
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
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.',
    heroSubtitle: 'INDUSTRIAL SIMULATION',
    contextHeadline: 'A TRAINING ENVIRONMENT DESIGNED TO BE EXPERIENCED, NOT JUST OBSERVED.',
    contextDescription: 'A VR simulation created for industrial training, placing users within critical scenarios that require spatial awareness, interaction, and precise decision-making.',
    takeaway: 'Building immersive industrial applications requires balancing high-fidelity interaction with strict performance constraints.',
    nextProject: 'bits-pilani'
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
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.',
    heroSubtitle: 'INTERACTIVE LEARNING',
    contextHeadline: 'TRANSLATING COMPLEX PROCESSES INTO SPATIAL SYSTEMS.',
    contextDescription: 'An interactive VR training and simulation experience designed to elevate educational immersion. By moving learning from 2D observation to 3D interaction, the project enhances retention and physical understanding.',
    takeaway: 'Spatial learning provides users with muscle memory and intuitive understanding that traditional media cannot match.',
    nextProject: 'molecular-lab'
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
    link: 'https://github.com/devan139/VR-Molecular-Lab',
    heroSubtitle: 'IMMERSIVE SCIENTIFIC TRAINING',
    contextHeadline: 'MAKING THE INVISIBLE TANGIBLE.',
    contextDescription: 'An interactive virtual laboratory experience for exploring molecular concepts in VR. It allows users to physically interact with chemical structures, breaking down abstract scientific theory into a hands-on spatial experience.',
    takeaway: 'When users can grab, rotate, and scale atomic structures, the learning barrier disappears.',
    nextProject: 'adnoc'
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
