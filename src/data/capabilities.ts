export interface Capability {
  id: string;
  number: string;
  title: string;
  skills: string[];
  isPrimary?: boolean;
}

export const capabilities: Capability[] = [
  {
    id: 'xr',
    number: '01',
    title: 'XR',
    isPrimary: true,
    skills: [
      'UNITY',
      '3D INTERACTION',
      'VR / AR',
      'SIMULATION',
      'SPATIAL INTERFACES'
    ]
  },
  {
    id: 'software',
    number: '02',
    title: 'SOFTWARE',
    skills: [
      'C#',
      'PYTHON',
      'REST APIs',
      'SYSTEM DESIGN',
      'FRONTEND'
    ]
  },
  {
    id: 'ai',
    number: '03',
    title: 'AI',
    skills: [
      'LLM INTEGRATION',
      'AI-ASSISTED WORKFLOWS',
      'DATA',
      'AUTOMATION',
      'AI PRODUCT CONCEPTS'
    ]
  },
  {
    id: 'product',
    number: '04',
    title: 'PRODUCT',
    skills: [
      'PRODUCT THINKING',
      'UX',
      'PROTOTYPING',
      'SYSTEM DESIGN',
      '0 → 1 BUILDING'
    ]
  }
];
