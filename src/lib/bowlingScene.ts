import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type BowlingIntroState = 'IDLE' | 'STRIKE' | 'COMPLETED';

export class BowlingScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rafId: number | null = null;
  
  private ballGroup: THREE.Group;
  private ballRadius = 1;

  private pinsGroup: THREE.Group;
  private pins: THREE.Group[] = [];
  
  private isDestroyed = false;
  private isPaused = false;
  private prefersReducedMotion = false;
  
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private isMobile = false;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0.5, -5);
  
  private introState: BowlingIntroState = 'IDLE';
  private scrollTriggerInstance: ScrollTrigger | null = null;
  private strikeTl: gsap.core.Timeline | null = null;
  private pinInitialTransforms: { position: THREE.Vector3; rotation: THREE.Euler }[] = [];
  
  private laneLength = 20;

  constructor(containerId: string, ballUrl: string, pinUrl: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;

    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.isMobile = window.innerWidth <= 768;
    }

    // SCENE
    this.scene = new THREE.Scene();
    
    // CAMERA
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.isMobile ? 55 : 45, aspect, 0.1, 100);
    this.camera.position.set(0, 1.5, 6);

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // LIGHTING
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    directionalLight.position.set(5, 6, 3);
    this.scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0xc7ff4a, 0.65);
    rimLight.position.set(-6, 3, -6);
    this.scene.add(rimLight);

    // GROUPS
    this.ballGroup = new THREE.Group();
    this.scene.add(this.ballGroup);

    this.pinsGroup = new THREE.Group();
    this.pinsGroup.position.set(0, -1, -this.laneLength);
    this.scene.add(this.pinsGroup);

    // CREATE LANE & STUDIO LIGHTING
    this.createLane();
    this.createStudioEnvironment();

    // BIND WINDOW EVENTS
    this.bindWindowEvents();

    // SETUP SKIP CONTROLS
    this.setupUIControls();

    // LOAD MODELS
    this.loadModels(ballUrl, pinUrl);

    // START RAF LOOP
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  private createStudioEnvironment() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0a0a0a);
      const boxGeometry = new THREE.PlaneGeometry(25, 25);
      const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      
      const light1 = new THREE.Mesh(boxGeometry, boxMaterial);
      light1.position.set(0, 12, 0);
      light1.rotation.x = Math.PI / 2;
      envScene.add(light1);
      
      const light2 = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0xc7ff4a }));
      light2.position.set(-15, 6, -5);
      light2.rotation.y = Math.PI / 2;
      envScene.add(light2);

      const light3 = new THREE.Mesh(boxGeometry, boxMaterial);
      light3.position.set(15, 6, -5);
      light3.rotation.y = -Math.PI / 2;
      envScene.add(light3);
      
      const envMap = pmremGenerator.fromScene(envScene).texture;
      this.scene.environment = envMap;
      pmremGenerator.dispose();
    } catch {
      // Fallback silently if PMREM not supported
    }
  }

  private createLane() {
    const laneGeom = new THREE.PlaneGeometry(12, 100);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0x070707,
      roughness: 0.15,
      metalness: 0.85
    });
    const lane = new THREE.Mesh(laneGeom, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.z = -40;
    lane.position.y = -1;
    this.scene.add(lane);

    const borderGeom = new THREE.BoxGeometry(0.25, 0.4, 100);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.6,
      metalness: 0.2
    });
    const leftBorder = new THREE.Mesh(borderGeom, borderMat);
    leftBorder.position.set(-3.0, -0.8, -40);
    this.scene.add(leftBorder);
    
    const rightBorder = new THREE.Mesh(borderGeom, borderMat);
    rightBorder.position.set(3.0, -0.8, -40);
    this.scene.add(rightBorder);
  }

  private loadModels(ballUrl: string, pinUrl: string) {
    const loader = new GLTFLoader();

    Promise.all([
      loader.loadAsync(ballUrl).catch(() => null),
      loader.loadAsync(pinUrl).catch(() => null)
    ]).then(([ballGltf, pinGltf]) => {
      if (this.isDestroyed) return;

      // Ball processing
      if (ballGltf) {
        const ballModel = ballGltf.scene;
        const ballBox = new THREE.Box3().setFromObject(ballModel);
        const ballSize = ballBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(ballSize.x, ballSize.y, ballSize.z);
        const scale = 2 / maxDim;
        ballModel.scale.set(scale, scale, scale);
        
        const center = ballBox.getCenter(new THREE.Vector3());
        ballModel.position.sub(center.multiplyScalar(scale));
        
        ballModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const oldMat = child.material as THREE.MeshStandardMaterial;
            child.material = new THREE.MeshPhysicalMaterial({
              color: oldMat?.color || 0x111111,
              roughness: 0.08,
              metalness: 0.35,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1
            });
            if (oldMat?.map) child.material.map = oldMat.map;
            if (oldMat?.normalMap) child.material.normalMap = oldMat.normalMap;
          }
        });

        this.ballGroup.add(ballModel);
      } else {
        const fallback = new THREE.Mesh(
          new THREE.SphereGeometry(1, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.5 })
        );
        this.ballGroup.add(fallback);
      }
      this.ballGroup.position.set(0, 0, 0);

      // Pin processing
      if (pinGltf) {
        const pinModel = pinGltf.scene;
        const pinBox = new THREE.Box3().setFromObject(pinModel);
        const pinSize = pinBox.getSize(new THREE.Vector3());
        const height = pinSize.y || 1;
        const pinScale = 1.8 / height;
        pinModel.scale.set(pinScale, pinScale, pinScale);
        
        const pCenter = pinBox.getCenter(new THREE.Vector3());
        const pBottom = pinBox.min.y;
        pinModel.position.set(-pCenter.x * pinScale, -pBottom * pinScale, -pCenter.z * pinScale);
        
        pinModel.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.depthWrite = true;
            child.material.depthTest = true;
          }
        });
        
        this.buildPinFormation(pinModel);
      } else {
        const fallback = new THREE.Group();
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.4, 1.8, 16),
          new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        mesh.position.y = 0.9;
        fallback.add(mesh);
        this.buildPinFormation(fallback);
      }

      this.hideLoading();
      this.initScrollControlledRoll();
    });
  }

  private buildPinFormation(baseModel: THREE.Object3D) {
    const spacingX = 1.0;
    const spacingZ = 1.0;
    
    const rows = [
      [0],                   // Row 1
      [-0.5, 0.5],           // Row 2
      [-1, 0, 1],            // Row 3
      [-1.5, -0.5, 0.5, 1.5] // Row 4
    ];

    rows.forEach((row, rowIndex) => {
      row.forEach((offsetX) => {
        const clone = baseModel.clone();
        const group = new THREE.Group();
        group.add(clone);
        
        group.position.set(offsetX * spacingX, 0, -rowIndex * spacingZ);
        group.scale.set(0.001, 0.001, 0.001);
        
        this.pinsGroup.add(group);
        this.pins.push(group);
        this.pinInitialTransforms.push({
          position: group.position.clone(),
          rotation: group.rotation.clone()
        });
      });
    });
  }

  private hideLoading() {
    const loaderEl = document.getElementById('bowling-loading');
    if (loaderEl) {
      gsap.to(loaderEl, { opacity: 0, duration: 0.4, onComplete: () => loaderEl.remove() });
    }
  }

  private setupUIControls() {
    const skipBtn = document.getElementById('skip-intro-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.skipIntro();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.skipIntro();
      }
    });
  }

  /**
   * Directly maps the user's mouse scroll wheel to the ball rolling down the lane.
   * Moving mouse scroll rolls the ball forward; stopping stops the ball.
   * Smooth 0.5s scrub provides physical inertia so it feels like a heavy polished bowling ball.
   */
  private initScrollControlledRoll() {
    const triggerSection = document.getElementById('bowling-section');
    if (!triggerSection) return;

    if (this.prefersReducedMotion) {
      this.pins.forEach(p => p.scale.set(1, 1, 1));
      this.introState = 'COMPLETED';
      return;
    }

    const IMPACT_Z = -this.laneLength; // -20
    const START_Z = 0;
    const totalRotation = (IMPACT_Z - START_Z) / this.ballRadius;

    this.cameraTarget.set(0, 0.5, -5);

    // Roll Timeline directly scrubbed by mouse scroll!
    const rollTimeline = gsap.timeline({ paused: true });

    // 1. Hero typography fades away as you scroll down
    rollTimeline.to('#hero-typography', {
      opacity: 0,
      y: -60,
      ease: 'none',
      duration: 0.25
    }, 0);

    rollTimeline.to('#hero-scroll-prompt', {
      opacity: 0,
      ease: 'none',
      duration: 0.15
    }, 0);

    // 2. Ball travels down the lane directly driven by scroll wheel
    rollTimeline.to(this.ballGroup.position, {
      z: IMPACT_Z + 0.5,
      ease: 'none',
      duration: 0.85
    }, 0);

    // 3. Ball rolls with exact physics rotation
    rollTimeline.to(this.ballGroup.rotation, {
      x: totalRotation,
      ease: 'none',
      duration: 0.85
    }, 0);

    // 4. Camera smoothly tracks behind and slightly above the ball
    rollTimeline.to(this.camera.position, {
      z: IMPACT_Z + 10.5,
      y: 1.9,
      ease: 'none',
      duration: 0.85
    }, 0);

    rollTimeline.to(this.cameraTarget, {
      z: IMPACT_Z,
      y: 0.5,
      ease: 'none',
      duration: 0.85
    }, 0);

    // 5. Pins scale up as the ball approaches
    this.pins.forEach((pin, i) => {
      rollTimeline.to(pin.scale, {
        x: 1, y: 1, z: 1,
        ease: 'power2.out',
        duration: 0.35
      }, 0.25 + (i * 0.025));
    });

    // Master ScrollTrigger tied directly to the mouse scroll!
    this.scrollTriggerInstance = ScrollTrigger.create({
      id: 'bowling-scroll-trigger',
      trigger: triggerSection,
      start: 'top top',
      end: '+=130%', // Punchy, responsive scroll distance
      pin: true,
      anticipatePin: 1,
      scrub: 0.5, // 0.5s smooth scrub inertia - feels weighted and tactile!
      animation: rollTimeline,
      onUpdate: (self) => {
        // When ball reaches pins, fire strike impact!
        if (self.progress >= 0.85 && this.introState === 'IDLE') {
          this.triggerStrike();
        } else if (self.progress < 0.75 && this.introState === 'STRIKE') {
          this.resetStrike();
        }

        // Fade canvas smoothly as user exits the hero pin
        if (self.progress > 0.95) {
          const fadeRatio = 1 - (self.progress - 0.95) / 0.05;
          gsap.set(this.container, { opacity: Math.max(0, fadeRatio) });
        } else if (self.progress <= 0.95 && this.introState !== 'COMPLETED') {
          gsap.set(this.container, { opacity: 1 });
        }
      },
      onLeave: () => {
        // When user scrolls down into Selected Work: pause RAF loop!
        this.isPaused = true;
        this.container.style.visibility = 'hidden';
      },
      onEnterBack: () => {
        // When user scrolls back up into Hero: resume RAF loop
        this.isPaused = false;
        this.container.style.visibility = 'visible';
        gsap.set(this.container, { opacity: 1 });
        if (this.rafId === null) {
          this.rafId = requestAnimationFrame(this.animate);
        }
      }
    });

    // Refresh geometry
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }

  private triggerStrike() {
    this.introState = 'STRIKE';

    const strikeText = document.getElementById('strike-text');
    const strikeH2 = strikeText?.querySelector('h2');
    if (strikeText) gsap.set(strikeText, { opacity: 1 });
    if (strikeH2) {
      gsap.fromTo(strikeH2,
        { scale: 2.5, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 0.2, ease: 'power4.out' }
      );
    }

    // Camera violent impact vibration
    gsap.to(this.camera.rotation, {
      z: 0.045,
      duration: 0.035,
      yoyo: true,
      repeat: 5,
      ease: 'sine.inOut'
    });

    // Bullet-time pin scatter
    const bulletDuration = 1.0;
    const bulletEase = 'expo.out';

    this.pins.forEach((pin, i) => {
      const angle = (i / 10) * Math.PI - (Math.PI / 2);
      const force = 3.5 + (i % 3) * 1.2;
      
      gsap.to(pin.position, {
        x: this.pinInitialTransforms[i].position.x + Math.sin(angle) * force,
        z: this.pinInitialTransforms[i].position.z - Math.cos(angle) * force - 5,
        y: 1.2 + (i % 2) * 0.8,
        duration: bulletDuration,
        ease: bulletEase
      });

      gsap.to(pin.rotation, {
        x: -(Math.PI / 2) - (i % 2),
        y: angle * 2.5,
        z: (i % 3) * 1.5,
        duration: bulletDuration,
        ease: bulletEase
      });
    });

    // Fade strike text after a brief moment
    if (strikeH2) {
      gsap.to(strikeH2, {
        opacity: 0,
        scale: 1.08,
        duration: 0.4,
        delay: 0.8,
        ease: 'power2.inOut'
      });
    }
  }

  private resetStrike() {
    this.introState = 'IDLE';
    const strikeText = document.getElementById('strike-text');
    if (strikeText) gsap.set(strikeText, { opacity: 0 });

    // Reset pins
    this.pins.forEach((pin, i) => {
      gsap.to(pin.position, {
        x: this.pinInitialTransforms[i].position.x,
        y: this.pinInitialTransforms[i].position.y,
        z: this.pinInitialTransforms[i].position.z,
        duration: 0.4,
        ease: 'power2.out'
      });
      gsap.to(pin.rotation, {
        x: this.pinInitialTransforms[i].rotation.x,
        y: this.pinInitialTransforms[i].rotation.y,
        z: this.pinInitialTransforms[i].rotation.z,
        duration: 0.4,
        ease: 'power2.out'
      });
    });
  }

  public skipIntro() {
    const workSection = document.getElementById('work-section') || document.getElementById('work');
    if (workSection) {
      workSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private bindWindowEvents() {
    window.addEventListener('resize', this.onResize);
    if (!this.isMobile && !this.prefersReducedMotion) {
      window.addEventListener('mousemove', this.onMouseMove);
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    this.isMobile = window.innerWidth <= 768;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.fov = this.isMobile ? 55 : 45;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate() {
    if (this.isDestroyed || this.isPaused) return;
    this.rafId = requestAnimationFrame(this.animate);

    if (!this.prefersReducedMotion) {
      if (this.introState === 'IDLE' && window.scrollY < 50) {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        if (this.ballGroup) {
          this.ballGroup.rotation.y += 0.003;
          this.ballGroup.position.x = this.mouse.x * 0.35;
          this.ballGroup.rotation.z = -this.mouse.x * 0.25;
        }

        this.camera.position.x = this.mouse.x * 0.35;
        this.camera.lookAt(
          this.cameraTarget.x,
          this.cameraTarget.y + this.mouse.y * 0.15,
          this.cameraTarget.z
        );
      } else {
        this.camera.lookAt(this.cameraTarget);
      }
    } else {
      this.camera.lookAt(this.cameraTarget);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.isDestroyed = true;
    this.isPaused = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = null;
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }
}
