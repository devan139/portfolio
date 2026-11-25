import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { resolvePath } from '../utils/paths';

interface Card3DInstance {
  cardEl: HTMLElement;
  containerEl: HTMLElement;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  renderer?: THREE.WebGLRenderer;
  modelGroup?: THREE.Group;
  rafId?: number | null;
  isPaused: boolean;
  isVisible: boolean;
  autoRotateSpeed: number;
  mouse: { x: number; y: number; targetX: number; targetY: number };
  dispose: () => void;
}

const instances: Card3DInstance[] = [];
let observer: IntersectionObserver | null = null;

export function init3DProjectCards() {
  if (typeof window === 'undefined') return;

  // Cleanup any existing instances
  destroy3DProjectCards();

  const cards = document.querySelectorAll<HTMLElement>('.project-card-3d');
  if (cards.length === 0) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = window.innerWidth <= 768;

  // Setup IntersectionObserver for lazy loading and pausing offscreen renderers
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const cardEl = entry.target as HTMLElement;
      const instance = instances.find(inst => inst.cardEl === cardEl);
      if (!instance) return;

      if (entry.isIntersecting) {
        instance.isVisible = true;
        // Resume animation if model is loaded
        if (instance.isPaused && instance.renderer) {
          instance.isPaused = false;
          startCardAnimation(instance);
        }
      } else {
        instance.isVisible = false;
        // Pause animation when offscreen
        instance.isPaused = true;
        if (instance.rafId) {
          cancelAnimationFrame(instance.rafId);
          instance.rafId = null;
        }
      }
    });
  }, {
    rootMargin: '250px 0px 250px 0px',
    threshold: 0.05
  });

  cards.forEach((cardEl, index) => {
    const containerEl = cardEl.querySelector<HTMLElement>('.card-3d-canvas-container');
    if (!containerEl) return;

    const instance: Card3DInstance = {
      cardEl,
      containerEl,
      isPaused: true,
      isVisible: false,
      autoRotateSpeed: 0.003,
      mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
      dispose: () => {}
    };

    instances.push(instance);

    // 1. Setup 3D Perspective Pointer Tilt
    if (!prefersReducedMotion && !isTouchDevice && !isMobile) {
      setupCardPointerTilt(cardEl, instance);
    }

    // 2. Setup Video hover / play handling if present
    setupVideoControls(cardEl);

    // 3. Register with observer
    observer?.observe(cardEl);

    // Prioritize loading the first card immediately, lazy load the rest
    const modelDir = cardEl.dataset.modelDir;
    const modelPrimary = cardEl.dataset.modelPrimary;
    const fallbacksJson = cardEl.dataset.modelFallbacks;
    let fallbackFiles: string[] = [];
    try {
      if (fallbacksJson) fallbackFiles = JSON.parse(fallbacksJson);
    } catch {}

    if (modelDir && modelPrimary && !prefersReducedMotion) {
      if (index === 0) {
        // Immediate load for first visible card
        loadCardModel(instance, modelDir, modelPrimary, fallbackFiles);
      } else {
        // Delay or load on intersection
        const onFirstIntersect = (entries: IntersectionObserverEntry[], obs: IntersectionObserver) => {
          entries.forEach(entry => {
            if (entry.target === cardEl && entry.isIntersecting) {
              obs.unobserve(cardEl);
              loadCardModel(instance, modelDir, modelPrimary, fallbackFiles);
            }
          });
        };
        const loadObserver = new IntersectionObserver(onFirstIntersect, { rootMargin: '300px' });
        loadObserver.observe(cardEl);
      }
    } else {
      // No model configured or reduced motion: remove loading indicator
      const loader = cardEl.querySelector<HTMLElement>('.model-loading-indicator');
      if (loader) loader.style.display = 'none';
    }
  });
}

function setupCardPointerTilt(cardEl: HTMLElement, instance: Card3DInstance) {
  const inner = cardEl.querySelector<HTMLElement>('.card-3d-inner');
  const sheen = cardEl.querySelector<HTMLElement>('.card-sheen');
  if (!inner) return;

  const maxTilt = 7.5; // Subtle, elegant max tilt angle

  const onMouseMove = (e: MouseEvent) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1; // -1 to 1

    instance.mouse.targetX = normX;
    instance.mouse.targetY = normY;

    const tiltX = -normY * maxTilt;
    const tiltY = normX * maxTilt;

    gsap.to(inner, {
      rotateX: tiltX,
      rotateY: tiltY,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });

    if (sheen) {
      const sheenX = ((normX + 1) / 2) * 100;
      const sheenY = ((normY + 1) / 2) * 100;
      sheen.style.background = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.12) 0%, transparent 65%)`;
      sheen.style.opacity = '1';
    }
  };

  const onMouseLeave = () => {
    instance.mouse.targetX = 0;
    instance.mouse.targetY = 0;

    gsap.to(inner, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto'
    });

    if (sheen) {
      gsap.to(sheen, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    }
  };

  cardEl.addEventListener('mousemove', onMouseMove);
  cardEl.addEventListener('mouseleave', onMouseLeave);
}

function setupVideoControls(cardEl: HTMLElement) {
  const video = cardEl.querySelector<HTMLVideoElement>('video.project-video');
  if (!video) return;

  // Autoplay muted when active or hovering
  cardEl.addEventListener('mouseenter', () => {
    if (video.paused) {
      video.play().catch(() => {});
    }
  });

  cardEl.addEventListener('mouseleave', () => {
    if (!video.paused && !cardEl.classList.contains('is-active')) {
      video.pause();
    }
  });
}

/**
 * Loads a GLB 3D model for a card.
 * Gracefully falls back to static cover images when models are not yet supplied.
 */
function loadCardModel(
  instance: Card3DInstance,
  folder: string,
  primaryFile: string,
  fallbackFiles: string[]
) {
  const loaderEl = instance.cardEl.querySelector<HTMLElement>('.model-loading-indicator');
  const gltfLoader = new GLTFLoader();

  // Clean relative path resolution
  const cleanFolder = folder.endsWith('/') ? folder : `${folder}/`;
  const primaryUrl = resolvePath(`${cleanFolder}${primaryFile}`);
  const fallbackUrls = fallbackFiles.map(f => resolvePath(`${cleanFolder}${f}`));
  const candidateUrls = [primaryUrl, ...fallbackUrls];

  // Try loading candidates in order
  const tryLoadNext = (index: number) => {
    if (index >= candidateUrls.length) {
      // None of the 3D models were found / supplied.
      // Gracefully fade out loading spinner and keep the real screenshot/video visible!
      if (loaderEl) {
        gsap.to(loaderEl, { opacity: 0, duration: 0.3, onComplete: () => { loaderEl.style.display = 'none'; } });
      }
      return;
    }

    const currentUrl = candidateUrls[index];

    gltfLoader.load(
      currentUrl,
      (gltf) => {
        // Model loaded successfully!
        setupThreeScene(instance, gltf.scene);
        if (loaderEl) {
          gsap.to(loaderEl, { opacity: 0, duration: 0.3, onComplete: () => { loaderEl.style.display = 'none'; } });
        }
        // Update tag if present
        const tag = instance.cardEl.querySelector('.model-status-tag');
        if (tag) {
          tag.textContent = '3D MODEL READY · INTERACTIVE';
          tag.classList.add('is-model-loaded');
        }
      },
      undefined,
      () => {
        // Current candidate failed, try next fallback
        tryLoadNext(index + 1);
      }
    );
  };

  tryLoadNext(0);
}

/**
 * Sets up a dedicated, optimized Three.js WebGL scene for a project card.
 */
function setupThreeScene(instance: Card3DInstance, model: THREE.Group) {
  const container = instance.containerEl;
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 400;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.8, 3.2);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 5, 3);
  scene.add(keyLight);

  const accentHex = instance.cardEl.dataset.accent || '#c7ff4a';
  const rimLight = new THREE.DirectionalLight(new THREE.Color(accentHex), 0.8);
  rimLight.position.set(-4, -2, -3);
  scene.add(rimLight);

  // Model bounds and centering
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const targetScale = 2.0 / maxDim;
  model.scale.set(targetScale, targetScale, targetScale);

  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(targetScale));

  const modelGroup = new THREE.Group();
  modelGroup.add(model);
  scene.add(modelGroup);

  instance.scene = scene;
  instance.camera = camera;
  instance.renderer = renderer;
  instance.modelGroup = modelGroup;
  instance.isPaused = false;

  // Smoothly fade canvas in
  gsap.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });

  // Handle Resize
  const onResize = () => {
    if (!renderer || !camera || !container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Store disposal
  instance.dispose = () => {
    window.removeEventListener('resize', onResize);
    if (instance.rafId) cancelAnimationFrame(instance.rafId);
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      }
    });
  };

  // Start animation
  startCardAnimation(instance);
}

function startCardAnimation(instance: Card3DInstance) {
  if (instance.isPaused || !instance.renderer || !instance.scene || !instance.camera) return;

  const loop = () => {
    if (instance.isPaused || !instance.renderer || !instance.scene || !instance.camera) return;
    instance.rafId = requestAnimationFrame(loop);

    // Subtle smooth mouse tracking
    instance.mouse.x += (instance.mouse.targetX - instance.mouse.x) * 0.08;
    instance.mouse.y += (instance.mouse.targetY - instance.mouse.y) * 0.08;

    // Smooth auto-rotation on Y
    if (instance.modelGroup) {
      instance.modelGroup.rotation.y += instance.autoRotateSpeed;
      instance.modelGroup.rotation.x = instance.mouse.y * 0.2;
      instance.modelGroup.rotation.z = -instance.mouse.x * 0.15;
    }

    if (instance.camera) {
      instance.camera.position.x = instance.mouse.x * 0.3;
      instance.camera.position.y = 0.8 + instance.mouse.y * 0.2;
      instance.camera.lookAt(0, 0, 0);
    }

    instance.renderer.render(instance.scene, instance.camera);
  };

  instance.rafId = requestAnimationFrame(loop);
}

export function destroy3DProjectCards() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  instances.forEach((inst) => {
    inst.dispose();
  });
  instances.length = 0;
}
