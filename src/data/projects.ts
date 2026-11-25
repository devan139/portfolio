export interface CaseStudySection {
  title: string;
  subtitle?: string;
  content: string[];
  callout?: {
    type?: 'note' | 'architecture' | 'scenario' | 'spec';
    title: string;
    details: string[];
  };
  screenshot?: {
    filename: string;
    caption: string;
    alt: string;
  };
}

export interface CaseStudyData {
  overview: CaseStudySection;
  challenge: CaseStudySection;
  architecture: CaseStudySection;
  digitalTwin: CaseStudySection;
  monitoringAlerts: CaseStudySection;
  engineeringDecisions: CaseStudySection;
  limitationsNextSteps: CaseStudySection;
}

export interface ARProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  technologies: string[];
}

export interface ProjectModelConfig {
  folder: string;
  primaryFile: string;
  fallbackFiles?: string[];
  accentColor: string;
  cameraPosition?: [number, number, number];
  modelScale?: number;
  autoRotateSpeed?: number;
  telemetryBadge?: string;
}

export interface Project {
  id: string;
  slug: string;
  number?: string;
  title: string;
  headline?: string;
  organization?: string;
  category: string;
  type?: string; // Legacy field
  status?: 'completed' | 'building';
  featured?: boolean;
  isHero?: boolean;
  description: string;
  role?: string;
  technologies?: string[];
  mediaType: 'image' | 'video' | 'abstract';
  mediaSrc?: string;
  image?: string;
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
  caseStudy?: CaseStudyData;
  arCollection?: ARProjectItem[];
  modelConfig?: ProjectModelConfig;
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
    featured: true,
    isHero: true,
    description: 'A VR simulation created for industrial training, placing operators inside high-consequence spatial environments to rehearse standard operating procedures.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'VR', '3D interaction', 'Simulation'],
    mediaType: 'image',
    image: '/images/projects/adnoc-vr-cover.png',
    modelConfig: {
      folder: '/models/projects/adnoc-vr/',
      primaryFile: 'adnoc-equipment.glb',
      fallbackFiles: ['adnoc-environment.glb'],
      accentColor: '#c7ff4a',
      cameraPosition: [0, 1.0, 3.5],
      modelScale: 1.0,
      autoRotateSpeed: 0.003,
      telemetryBadge: 'SPATIAL SIMULATION'
    },
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.',
    heroSubtitle: 'INDUSTRIAL SIMULATION',
    contextHeadline: 'A TRAINING ENVIRONMENT DESIGNED TO BE EXPERIENCED, NOT JUST OBSERVED.',
    contextDescription: 'A VR simulation created for industrial training, placing users within critical scenarios that require spatial awareness, interaction, and precise decision-making.',
    takeaway: 'Building immersive industrial applications requires balancing high-fidelity interaction with strict performance constraints.',
    nextProject: 'solar-digital-twin'
  },
  {
    id: 'solar-digital-twin',
    slug: 'solar-digital-twin',
    number: '02',
    title: 'SOLAR PLANT DIGITAL TWIN',
    headline: 'A living digital twin of a solar plant.',
    organization: 'PROTOTYPE',
    category: 'INTERACTIVE DIGITAL TWIN',
    status: 'completed',
    featured: true,
    isHero: true,
    description: 'A browser-based digital twin prototype connecting simulated equipment telemetry to an interactive 3D solar plant, providing a unified view of asset status, performance, and operational alerts.',
    role: 'Frontend & Systems Engineer',
    technologies: ['Three.js', 'React', 'TypeScript', 'FastAPI', 'Python', 'WebSockets', 'Pandas'],
    mediaType: 'image',
    image: '/images/projects/solar-digital-twin-cover.png',
    modelConfig: {
      folder: '/models/projects/solar-digital-twin/',
      primaryFile: 'solar-plant.glb',
      fallbackFiles: ['solar-panel.glb'],
      accentColor: '#ffd700',
      cameraPosition: [0, 1.8, 4.2],
      modelScale: 1.0,
      autoRotateSpeed: 0.0025,
      telemetryBadge: 'ARRAY_04 · 3D READY'
    },
    heroSubtitle: '3D SPATIAL TELEMETRY SYSTEM',
    contextHeadline: 'CONNECTING SIMULATED TELEMETRY TO AN INTERACTIVE 3D SOLAR ASSET MODEL.',
    contextDescription: 'A browser-based digital twin prototype connecting simulated equipment telemetry to an interactive 3D solar plant, providing a unified view of asset status, performance, and operational alerts.',
    takeaway: 'Unifying spatial 3D visualization with live telemetry transforms abstract sensor tables into immediate spatial intelligence.',
    nextProject: 'molecular-lab',
    caseStudy: {
      overview: {
        title: 'Overview',
        subtitle: 'Browser-Based Digital Twin Prototype',
        content: [
          'The Solar Plant Digital Twin is an interactive browser prototype demonstrating how live simulated telemetry streams can dynamically control the visual and operational state of a 3D solar power facility in real time.',
          'Built with Three.js on the client and FastAPI on the backend, the prototype mirrors six distinct physical solar arrays modeled in a 3D GLB environment: ARRAY_01 (Carport / Rear Row), ARRAY_02 (Carport / Center Row), ARRAY_03 (Carport / Front Row), ARRAY_04 (Main Building Rooftop), ARRAY_05 (Annex / Front-Right), and ARRAY_06 (Upper Facility Rooftop).',
          'Operators interact with the spatial plant directly—orbiting, panning, and selecting individual arrays—while a telemetry simulator streams real-world 5-minute sampling intervals across a 24-hour cycle (1,728 total records) over bidirectional WebSockets.'
        ],
        callout: {
          type: 'spec',
          title: 'Prototype Scope & Verified Parameters',
          details: [
            'Physical Assets: 6 distinct solar arrays mapped 1-to-1 between GLB mesh nodes and telemetry asset IDs',
            'Telemetry Dataset: 1,728 records representing 24 continuous hours sampled at 5-minute intervals',
            'Full-Stack Loop: Python/Pandas telemetry loader -> FastAPI WebSocket server -> React & Three.js client',
            'Operational Features: 3D raycast selection, real-time thermal state coloring, debounced alert rules, AI operational explanation, and simulated plant surveillance camera'
          ]
        },
        screenshot: {
          filename: '/images/projects/solar-digital-twin-cover.png',
          caption: 'Interactive 3D Three.js solar plant overview with live array status rendering.',
          alt: 'Interactive 3D Three.js digital twin of the solar plant'
        }
      },
      challenge: {
        title: 'The Challenge',
        subtitle: 'Bridging Tabular Data and Physical Reality',
        content: [
          'In standard SCADA and solar monitoring setups, operators monitor plant health through dense tabular grids, disconnected time-series charts, and endless alert logs. When an alert fires—such as an inverter over-temperature or string degradation—the operator must mentally map a cryptic tag (e.g. `INV_04_STR_2`) to its physical location in a vast physical plant.',
          'This disconnection slows response times during acute operational anomalies. The core engineering challenge of this prototype was to evaluate how a browser-native 3D digital twin could synthesize raw sensor feeds into an intuitive spatial representation without introducing heavy client runtimes or proprietary software barriers.',
          'The system needed to preserve strict data integrity: keeping the source telemetry immutable, maintaining real-time frame rates during 3D camera navigation, and providing immediate visual cues when equipment deviates from nominal operating envelopes.'
        ]
      },
      architecture: {
        title: 'System Architecture',
        subtitle: 'End-to-End Reactive Telemetry Pipeline',
        content: [
          'The architecture decouples telemetry generation, state evaluation, and presentation into focused services connected via asynchronous protocols.',
          'The backend reads the 24-hour solar dataset via Pandas, treating the source workbook as immutable. A telemetry simulator advances through chronological intervals and feeds state evaluation services. Rather than delegating operational business logic to the client, the backend acts as the single source of operational truth.',
          'The backend evaluates equipment status thresholds, generates debounced operational alerts, synthesizes structured operational insight text, and broadcasts complete state snapshots over a persistent WebSocket endpoint (`/ws/telemetry`) alongside REST inspection endpoints.'
        ],
        callout: {
          type: 'architecture',
          title: 'Verified Telemetry Pipeline Flow',
          details: [
            '1. Immutable Telemetry Dataset (Excel/Pandas: 1,728 records, 6 assets, 24h cycle)',
            '2. Python Telemetry Simulator (Temporal progression and scenario parameter injection)',
            '3. State Evaluation Engine (Thermal threshold scoring & plant-level state derivation)',
            '4. Alert & Insight Service (State-transition debouncing + structured operational remediation text)',
            '5. FastAPI Server (REST endpoints: /assets, /telemetry, /alerts + WebSocket: /ws/telemetry)',
            '6. React + Three.js Client (Raycasting selection, visual state sync, KPI cards, and Recharts monitoring)'
          ]
        },
        screenshot: {
          filename: '/images/projects/solar-digital-twin-dashboard.png',
          caption: 'Executive dashboard view displaying real-time power KPIs, temperature history, and array status.',
          alt: 'Solar Plant Digital Twin Executive Dashboard'
        }
      },
      digitalTwin: {
        title: 'Interactive Digital Twin',
        subtitle: 'Spatial Selection and Visual Telemetry Synchronization',
        content: [
          'The interactive 3D digital twin is rendered in the browser using Three.js within a React container. The solar facility model is loaded from an optimized GLB asset containing named hierarchy objects (`array_01` through `array_06`).',
          'During scene initialization, each mesh node is mapped to its corresponding telemetry `assetId` and stored in `object.userData.assetId`. This establishes an immediate bidirectional bridge between 3D scene elements and the application state.',
          'Operators can freely orbit, zoom, and pan around the plant. Clicking on any solar array fires a GPU raycaster that selects the asset, highlights its geometry, and syncs the dashboard sidebar with its real-time telemetry metrics—including capacity, current power (kW), panel temperature (°C), ambient temperature (°C), voltage (V), current (A), and calculated efficiency.',
          'Each 3D asset dynamically reflects its thermal condition via custom shader materials: NORMAL operating conditions remain clean and subtle, WARNING states transition into an amber hue, and CRITICAL states trigger a high-visibility hazard warning, enabling instant physical localization of distressed hardware.'
        ]
      },
      monitoringAlerts: {
        title: 'Monitoring and Alerts',
        subtitle: 'Scenario Injection and Operational Anomaly Detection',
        content: [
          'Plant operational health is evaluated using deterministic thermal thresholds on panel temperature: temperatures under 70°C are NORMAL, 70°C to 75°C trigger a WARNING, and temperatures at or above 75°C escalate to CRITICAL. Plant-level status reflects the worst condition of any individual array.',
          'To demonstrate the operational detection loop end-to-end, a deterministic anomaly scenario is injected into ARRAY_04 (Main Building Rooftop). As the simulation advances, ARRAY_04 experiences thermal stress, transitioning from NORMAL to WARNING, and reaching 77.0°C in CRITICAL status.',
          'To prevent alert storms common in industrial monitoring, the alert service uses state-transition evaluation: alerts are published only when an asset crosses an operational boundary, bundling timestamp, severity, condition description, and recommended operator remediation.',
          'The dashboard couples these alerts with an AI Operational Insight explanation layer. Rather than guessing, the system clearly explains the root condition ("ARRAY_04 panel temperature is above warning threshold"), quantifies the operational impact ("Elevated panel temperature may reduce generation efficiency"), and suggests actionable remediation ("Inspect the affected array and check for abnormal thermal conditions"). A simulated plant CCTV camera feed (`CAM-01 SOLAR FIELD SIMULATED FEED`) provides visual verification.'
        ],
        callout: {
          type: 'scenario',
          title: 'ARRAY_04 Thermal Stress Scenario Lifecycle',
          details: [
            'Baseline: ARRAY_04 operating within nominal thermal envelope (<70°C, Status: NORMAL)',
            'Warning Phase: Solar irradiance and thermal anomaly elevate temperature between 70°C and 75°C -> 3D asset turns amber, warning banner emitted',
            'Critical Phase: Panel temperature breaches 75°C (peaking at 77.0°C) -> 3D asset turns high-alert red, critical alarm dispatched with remediation guidance',
            'Debounced Alert: State-transition filter ensures zero alert spamming during temperature boundary oscillations'
          ]
        },
        screenshot: {
          filename: '/images/projects/solar-digital-twin-alert.png',
          caption: 'Active alert drawer detailing the ARRAY_04 critical temperature incident and remediation steps.',
          alt: 'Critical alert notification for ARRAY_04 in the Solar Plant Digital Twin'
        }
      },
      engineeringDecisions: {
        title: 'Engineering Decisions',
        subtitle: 'State Authority, Decoupled Insights, and Protocol Selection',
        content: [
          'Backend as State Authority: Rather than performing threshold computations on the client, the backend owns all state logic. This guarantees that whether telemetry is viewed in 3D, rendered on KPI cards, or sent to an alert webhook, every consumer receives identical, authoritative evaluations.',
          'Decoupled Explanation Layer: The AI operational insight module is deliberately separated from anomaly detection. Deterministic rule engines catch the anomaly with 100% predictability, while the explanation layer formats clear, contextual operator guidance. This architecture allows future integration of fine-tuned language models without destabilizing safety-critical alert logic.',
          'WebSockets with REST Fallback: WebSocket streaming provides low-latency telemetry updates (5-minute simulation ticks delivered seamlessly), while standard FastAPI REST routes (`/assets`, `/telemetry/latest`, `/alerts`) provide robust initial page hydration and deep-linking support.',
          'Zero Heavy Client Runtimes: By choosing Three.js and standard WebGL over heavier game engine exports, the entire digital twin runs smoothly on standard modern desktop and mobile browsers without requiring plugins or dedicated hardware acceleration.'
        ],
        screenshot: {
          filename: '/images/projects/solar-digital-twin-insights.png',
          caption: 'AI operational explanation view with structured condition, impact, and action summaries.',
          alt: 'AI Operational Insight view in the Solar Plant Digital Twin'
        }
      },
      limitationsNextSteps: {
        title: 'Limitations and Next Steps',
        subtitle: 'Distinguishing Prototype Verification from Production Scale',
        content: [
          'This project is an engineering prototype designed to validate the spatial telemetry UX and reactive data architecture. It runs on a synthetic 24-hour telemetry dataset rather than physical solar plant sensors.',
          'The prototype does not claim production deployment, active SCADA hardware integration, or measured real-world megawatt efficiency improvements.',
          'Production Roadmap Possibilities: Future engineering extensions may include connecting live industrial Modbus TCP / MQTT telemetry brokers, ingesting automated thermal drone photogrammetry, integrating multi-variable inverter performance modeling, and scaling the 3D representation to multi-gigawatt utility-scale solar fields.'
        ]
      }
    }
  },
  {
    id: 'vr-molecular-lab',
    slug: 'molecular-lab',
    number: '03',
    title: 'VR MOLECULAR LAB',
    category: 'IMMERSIVE EDUCATION',
    status: 'completed',
    featured: true,
    description: 'An interactive virtual laboratory experience for exploring molecular concepts in VR, allowing users to physically manipulate atomic bonds and chemical structures in 3D.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'Meta Quest', 'VR Interaction', 'Physics Simulation'],
    mediaType: 'video',
    mediaSrc: '/videos/vr-molecular-lab.mp4',
    poster: '/images/vr-molecular-lab-poster.jpg',
    modelConfig: {
      folder: '/models/projects/molecular-lab/',
      primaryFile: 'molecular-structure.glb',
      fallbackFiles: [],
      accentColor: '#00e5ff',
      cameraPosition: [0, 0, 3.2],
      modelScale: 1.0,
      autoRotateSpeed: 0.004,
      telemetryBadge: 'PHYSICS SIMULATION'
    },
    link: 'https://github.com/devan139/VR-Molecular-Lab',
    heroSubtitle: 'IMMERSIVE SCIENTIFIC TRAINING',
    contextHeadline: 'MAKING THE INVISIBLE TANGIBLE.',
    contextDescription: 'An interactive virtual laboratory experience for exploring molecular concepts in VR. It allows users to physically interact with chemical structures, breaking down abstract scientific theory into a hands-on spatial experience.',
    takeaway: 'When users can grab, rotate, and scale atomic structures, the learning barrier disappears.',
    nextProject: 'ar-applications'
  },
  {
    id: 'ar-applications',
    slug: 'ar-applications',
    number: '04',
    title: 'AR APPLICATIONS',
    category: 'INDUSTRIAL AR & SPATIAL TRAINING',
    status: 'completed',
    featured: true,
    description: 'A curated collection of mobile augmented reality applications engineered in Unity for industrial equipment inspection, guided maintenance workflows, and interactive field assessments.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'AR Foundation', 'Mobile AR', 'XR Interaction Toolkit', 'LeanTouch'],
    mediaType: 'abstract',
    modelConfig: {
      folder: '/models/projects/ar-applications/',
      primaryFile: 'ar-device.glb',
      fallbackFiles: [],
      accentColor: '#ff4081',
      cameraPosition: [0, 0.4, 3.2],
      modelScale: 1.0,
      autoRotateSpeed: 0.003,
      telemetryBadge: 'SPATIAL ANCHOR 3D'
    },
    heroSubtitle: 'AUGMENTED REALITY EXPERIENCES',
    contextHeadline: 'BRINGING INTERACTIVE 3D INSTRUCTIONS DIRECTLY ONTO PHYSICAL EQUIPMENT.',
    contextDescription: 'A collection of mobile augmented reality applications engineered for real-world equipment training. By overlaying digital 3D models and procedural instructions directly onto physical machinery, these apps replace paper documentation with guided spatial learning and verifiable assessments.',
    takeaway: 'Overlaying spatial instructions onto physical machinery bridges the gap between digital training and physical execution.',
    nextProject: 'adnoc',
    arCollection: [
      {
        id: 'plc1-ar',
        title: 'PLC-1 Industrial AR Training & Assessment',
        category: 'INDUSTRIAL AUTOMATION / AR TRAINING',
        description: 'Interactive mobile augmented reality training module for industrial programmable logic controllers (PLCs). Enables operators to inspect physical component layouts, trigger interactive hardware breakdowns, and complete spatial step-by-step assessment testing.',
        features: [
          'Surface-plane AR camera placement and tracking',
          'Interactive component inspection and subsystem highlights',
          'Integrated knowledge quizzes and real-time operator assessments',
          'Single Sign-On (SSO) login flow for enterprise training records'
        ],
        technologies: ['Unity', 'C#', 'AR Foundation', 'XR Interaction Toolkit', 'LeanTouch', 'E2Chart']
      },
      {
        id: 'ptk-ar',
        title: 'PTK Machine AR Interactive Guide',
        category: 'EQUIPMENT INSPECTION & MAINTENANCE',
        description: 'Augmented reality procedural guide for industrial machinery. Provides gesture-driven multi-touch manipulation, interactive component callouts ("i" info triggers), exploded part views, and structured maintenance sequence verification.',
        features: [
          'Multi-touch gesture controls for scaling, rotating, and isolating components',
          'Exploded view inspection of complex internal machine assemblies',
          'Interactive info hotspots linking parts to operational tolerances',
          'Interactive procedure verification and operator quizzes'
        ],
        technologies: ['Unity', 'C#', 'Mobile AR', 'LeanTouch Gesture Framework', 'XR Interaction']
      },
      {
        id: 'bc2-ar',
        title: 'BC-2 Industrial Equipment Module',
        category: 'PROCEDURAL SPATIAL WORKFLOWS',
        description: 'Mobile AR application designed to guide technicians through assembly, inspection, and verification protocols with spatial 3D step cues directly in the field.',
        features: [
          'Real-time markerless plane detection and spatial alignment',
          'Guided step-by-step procedural workflow visualization',
          'Safety protocol checks and interactive verification checkpoints'
        ],
        technologies: ['Unity', 'C#', 'AR Foundation', 'Mobile AR']
      }
    ]
  },
  {
    id: 'bits-pilani',
    slug: 'bits-pilani',
    number: '05',
    title: 'TRAINING SIMULATION',
    organization: 'BITS PILANI',
    category: 'IMMERSIVE TRAINING',
    status: 'completed',
    featured: false,
    description: 'An interactive VR training/simulation experience designed to elevate educational immersion through 3D spatial interaction.',
    role: 'XR Engineer / Unity Developer',
    technologies: ['Unity', 'C#', 'VR', '3D interaction', 'Simulation'],
    mediaType: 'abstract',
    confidentiality: 'Selected project details are presented at a high level due to project confidentiality.',
    heroSubtitle: 'INTERACTIVE LEARNING',
    contextHeadline: 'TRANSLATING COMPLEX PROCESSES INTO SPATIAL SYSTEMS.',
    contextDescription: 'An interactive VR training and simulation experience designed to elevate educational immersion. By moving learning from 2D observation to 3D interaction, the project enhances retention and physical understanding.',
    takeaway: 'Spatial learning provides users with muscle memory and intuitive understanding that traditional media cannot match.',
    nextProject: 'kensei'
  },
  {
    id: 'kensei',
    slug: 'kensei',
    number: '06',
    title: 'KENSEI',
    organization: 'E-COMMERCE BRAND',
    category: 'SHOPIFY STORE & APPAREL DESIGN',
    status: 'completed',
    featured: false,
    description: 'An independent apparel and streetwear e-commerce brand built on Shopify, featuring custom product design, visual branding, and storefront management.',
    role: 'Founder & Storefront Builder',
    technologies: ['Shopify', 'Liquid', 'E-Commerce', 'Brand Identity', 'Product Design'],
    mediaType: 'abstract',
    heroSubtitle: 'APPAREL & STOREFRONT',
    contextHeadline: 'BUILDING A DIRECT-TO-CONSUMER BRAND IDENTITY AND STOREFRONT FROM ZERO.',
    contextDescription: 'Designed and launched an independent streetwear and apparel brand powered by Shopify, managing end-to-end product aesthetics, brand identity, and e-commerce experience.',
    takeaway: 'Owning both product aesthetics and storefront architecture ensures a cohesive customer journey.',
    nextProject: 'adnoc'
  },
  {
    id: 'car-craft-webgl',
    slug: 'car-craft-webgl',
    number: '07',
    title: 'CAR CRAFT WEBGL',
    category: '3D WEBGL SIMULATION',
    status: 'completed',
    featured: false,
    description: 'An interactive 3D WebGL automotive simulation allowing users to inspect, disassemble, and explore vehicle mechanics directly in the browser.',
    role: '3D & WebGL Developer',
    technologies: ['Unity', 'WebGL', '3D Interaction', 'C#'],
    mediaType: 'abstract',
    link: 'https://github.com/devan139/CarCraftWebgl',
    heroSubtitle: 'BROWSER-BASED 3D SIMULATION',
    contextHeadline: 'MAKING COMPLEX AUTOMOTIVE ENGINEERING INTERACTIVE IN THE BROWSER.',
    contextDescription: 'A working WebGL simulation for exploring and learning about automotive engineering and parts interactively right in the browser.',
    takeaway: 'Bringing high-fidelity 3D interaction to the web without plugins lowers the barrier for technical education.',
    nextProject: 'attendance-tracker'
  },
  {
    id: 'attendance-tracker',
    slug: 'attendance-tracker',
    number: '08',
    title: 'ATTENDANCE TRACKER',
    category: 'AUTOMATION TOOL',
    status: 'completed',
    featured: false,
    description: 'Python automation tool that parses attendance records from unstructured PDFs, computes metrics, and outputs clean structured spreadsheets.',
    role: 'Python Developer',
    technologies: ['Python', 'Pandas', 'pdfplumber', 'Automation'],
    mediaType: 'abstract',
    link: 'https://github.com/devan139/AttendanceTracker',
    heroSubtitle: 'DATA AUTOMATION PIPELINE',
    contextHeadline: 'TURNING A 30-MINUTE MANUAL CHORE INTO A 10-SECOND PIPELINE.',
    contextDescription: 'Automated data extraction tool that parses complex roster PDFs, tracks exact timings, computes metrics, and generates formatted Excel workbooks without external dependencies or data leaks.',
    takeaway: 'Targeted automation removes friction from repetitive operations while ensuring 100% data privacy.',
    nextProject: 'adnoc'
  },
  {
    id: 'aerix',
    slug: 'aerix',
    title: 'AERIX',
    category: 'AI Fitness Product',
    status: 'building',
    featured: false,
    description: 'AERIX is an AI-powered fitness product I\'m building to explore adaptive training, personalized workouts and better decision-making during training.',
    mediaType: 'image',
    link: 'https://github.com/devan139/Aerix'
  }
];

export const featuredProjects = projects.filter(p => p.featured === true);
export const moreProjects = projects.filter(p => p.status === 'completed' && !p.featured);
