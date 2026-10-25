import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export class BowlingScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  private ballGroup: THREE.Group;
  private ballRadius = 1; // Normalized to 1

  private pinsGroup: THREE.Group;
  private pins: THREE.Group[] = [];
  
  private isDestroyed = false;
  private prefersReducedMotion = false;
  
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private isMobile = false;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0.5, -5);
  
  private strikeState: 'IDLE' | 'IMPACT' | 'STRIKE_HOLD' | 'RELEASED' = 'IDLE';
  private strikeTl: gsap.core.Timeline | null = null;
  private pinInitialTransforms: { position: THREE.Vector3, rotation: THREE.Euler }[] = [];
  
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
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 1.5, 6);

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // LIGHTING
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 2);
    this.scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0xc7ff4a, 0.5); // Subtle accent color rim
    rimLight.position.set(-5, 2, -5);
    this.scene.add(rimLight);

    // GROUPS
    this.ballGroup = new THREE.Group();
    this.scene.add(this.ballGroup);

    this.pinsGroup = new THREE.Group();
    this.pinsGroup.position.set(0, -1, -this.laneLength); // Same ground level as ball
    this.scene.add(this.pinsGroup);

    // CREATE LANE
    this.createLane();
    
    // PREMIUM STUDIO LIGHTING (Reflections)
    this.createStudioEnvironment();

    // BIND EVENTS
    this.bindEvents();

    // LOAD MODELS
    this.loadModels(ballUrl, pinUrl);

    // START LOOP
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private createStudioEnvironment() {
    // Procedural Studio Lighting for premium reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0a0a0a);
    const boxGeometry = new THREE.PlaneGeometry(20, 20);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Massive softbox on top
    const light1 = new THREE.Mesh(boxGeometry, boxMaterial);
    light1.position.set(0, 10, 0);
    light1.rotation.x = Math.PI / 2;
    envScene.add(light1);
    
    // Rim softbox on left
    const light2 = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0xc7ff4a }));
    light2.position.set(-15, 5, -5);
    light2.rotation.y = Math.PI / 2;
    envScene.add(light2);

    // Rim softbox on right
    const light3 = new THREE.Mesh(boxGeometry, boxMaterial);
    light3.position.set(15, 5, -5);
    light3.rotation.y = -Math.PI / 2;
    envScene.add(light3);
    
    const envMap = pmremGenerator.fromScene(envScene).texture;
    this.scene.environment = envMap;
  }

  private createLane() {
    // Procedural dark architectural lane
    const laneGeom = new THREE.PlaneGeometry(10, 100);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.2,
      metalness: 0.8
    });
    const lane = new THREE.Mesh(laneGeom, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.z = -40; // Extend deep into the scene
    lane.position.y = -1; // Ground level where ball rests (ball radius is 1)
    this.scene.add(lane);

    // Lane border accents
    const borderGeom = new THREE.BoxGeometry(0.2, 0.5, 100);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7,
      metalness: 0.1
    });
    const leftBorder = new THREE.Mesh(borderGeom, borderMat);
    leftBorder.position.set(-2.5, -0.75, -40);
    this.scene.add(leftBorder);
    
    const rightBorder = new THREE.Mesh(borderGeom, borderMat);
    rightBorder.position.set(2.5, -0.75, -40);
    this.scene.add(rightBorder);
  }

  private loadModels(ballUrl: string, pinUrl: string) {
    const loader = new GLTFLoader();

    Promise.all([
      loader.loadAsync(ballUrl).catch(() => null),
      loader.loadAsync(pinUrl).catch(() => null)
    ]).then(([ballGltf, pinGltf]) => {
      // Process Ball
      if (ballGltf) {
        const ballModel = ballGltf.scene;
        const ballBox = new THREE.Box3().setFromObject(ballModel);
        const ballSize = ballBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(ballSize.x, ballSize.y, ballSize.z);
        const scale = 2 / maxDim; // Target diameter = 2 (radius = 1)
        ballModel.scale.set(scale, scale, scale);
        
        const center = ballBox.getCenter(new THREE.Vector3());
        ballModel.position.sub(center.multiplyScalar(scale));
        
        // Premium Material Upgrade
        ballModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const oldMat = child.material as THREE.MeshStandardMaterial;
                child.material = new THREE.MeshPhysicalMaterial({
                   color: oldMat?.color || 0x111111,
                   roughness: 0.1, // Highly polished
                   metalness: 0.3,
                   clearcoat: 1.0, // Premium resin finish
                   clearcoatRoughness: 0.1
                });
                if (oldMat?.map) child.material.map = oldMat.map;
                if (oldMat?.normalMap) child.material.normalMap = oldMat.normalMap;
            }
        });

        this.ballGroup.add(ballModel);
      } else {
        // Fallback ball
        const fallback = new THREE.Mesh(
          new THREE.SphereGeometry(1, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        this.ballGroup.add(fallback);
      }
      this.ballGroup.position.set(0, 0, 0); // Resting on lane at y=-1 (radius is 1)

      // Process Pin
      if (pinGltf) {
        console.log('[DEBUG] Successfully loaded bowling-pin.glb from', pinUrl);
        const pinModel = pinGltf.scene;
        const pinBox = new THREE.Box3().setFromObject(pinModel);
        const pinSize = pinBox.getSize(new THREE.Vector3());
        console.log('[DEBUG] Bowling Pin Original Size:', pinSize);
        const height = pinSize.y;
        
        // Typical bowling pin height ratio vs ball is approx 1.7x ball radius
        const pinScale = 1.8 / height;
        pinModel.scale.set(pinScale, pinScale, pinScale);
        
        // Center pin origin at its base
        const pCenter = pinBox.getCenter(new THREE.Vector3());
        const pBottom = pinBox.min.y;
        pinModel.position.set(-pCenter.x * pinScale, -pBottom * pinScale, -pCenter.z * pinScale);
        
        // Ensure material is visible and depth is correct
        pinModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
              child.material.depthWrite = true;
              child.material.depthTest = true;
            }
          }
        });
        
        this.buildPinFormation(pinModel);
      } else {
        console.error('[DEBUG] Failed to load bowling-pin.glb from', pinUrl);
        // Fallback pin
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
      this.initScrollTrigger();
    });
  }

  private buildPinFormation(baseModel: THREE.Object3D) {
    const spacingX = 1.0;
    const spacingZ = 1.0;
    
    // Triangle formation rows
    const rows = [
      [0],                   // Row 1 (1 pin)
      [-0.5, 0.5],           // Row 2 (2 pins)
      [-1, 0, 1],            // Row 3 (3 pins)
      [-1.5, -0.5, 0.5, 1.5] // Row 4 (4 pins)
    ];

    rows.forEach((row, rowIndex) => {
      row.forEach((offsetX) => {
        const clone = baseModel.clone();
        const group = new THREE.Group();
        group.add(clone);
        
        group.position.set(offsetX * spacingX, 0, -rowIndex * spacingZ);
        
        // Start pins scaled down to 0.001 to prevent frustum culling bugs at scale=0
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
      gsap.to(loaderEl, { opacity: 0, duration: 0.5, onComplete: () => loaderEl.remove() });
    }
  }

  private initScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);
    
    const triggerSection = document.getElementById('bowling-section');
    if (!triggerSection) return;

    if (this.prefersReducedMotion) {
      // Reduced motion: Just fade out text, show pins statically
      gsap.to('#hero-typography', {
        scrollTrigger: {
          trigger: triggerSection,
          start: "top top",
          end: "+=100%",
          scrub: 1
        },
        opacity: 0,
        y: -50
      });
      this.pins.forEach(p => p.scale.set(1, 1, 1));
      return;
    }

    const IMPACT_Z = -this.laneLength;
    const START_Z = 0;
    const totalRotation = (IMPACT_Z - START_Z) / this.ballRadius;
    
    // Reset camera target
    this.cameraTarget.set(0, 0.5, -5);

    // Timeline for the approach (Scrubbed manually up to 0.90)
    const approachTl = gsap.timeline({ paused: true });

    // 0.00 -> 0.15: Typography visible, then fades and moves away
    approachTl.to('#hero-typography', { opacity: 0, y: -100, duration: 0.15 }, 0.05);
    
    // 0.15 -> 0.88: Ball travels down lane
    approachTl.to(this.ballGroup.position, {
      z: IMPACT_Z + 3,
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);
    
    approachTl.to(this.ballGroup.rotation, {
      x: totalRotation * (17 / 20),
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);

    // Camera follows the ball cinematically from 0.15 to 0.88
    approachTl.to(this.camera.position, {
      z: IMPACT_Z + 11,
      y: 1.8,
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);

    // Camera target transitions to look toward midpoint
    approachTl.to(this.cameraTarget, {
      z: IMPACT_Z + 1.5,
      y: 0.5,
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);

    // 0.60 -> 0.70: Pins scale up to build anticipation
    this.pins.forEach((pin, index) => {
      approachTl.to(pin.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.10,
        ease: 'back.out(1.5)'
      }, 0.60 + (index * 0.005));
    });

    // 0.88 -> 0.90: Impact Anticipation (end of scrubbed timeline)
    approachTl.to(this.ballGroup.position, {
      z: IMPACT_Z - 0.5,
      duration: 0.02,
      ease: 'none'
    }, 0.88);

    approachTl.to(this.ballGroup.rotation, {
      x: totalRotation * (20.5 / 20),
      duration: 0.02,
      ease: 'none'
    }, 0.88);

    // Camera tightens slightly
    approachTl.to(this.camera.position, {
      z: IMPACT_Z + 7.5,
      y: 1.6,
      duration: 0.02,
      ease: 'none'
    }, 0.88);

    // Camera target locks onto pin formation
    approachTl.to(this.cameraTarget, {
      z: IMPACT_Z,
      y: 0.5,
      duration: 0.02,
      ease: 'none'
    }, 0.88);

    // Create the master ScrollTrigger that manually scrubs approachTl
    ScrollTrigger.create({
      id: 'bowlingTrigger',
      trigger: triggerSection,
      start: "top top",
      end: "+=300%",
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (self.progress < 0.85) {
          if (this.strikeState !== 'IDLE') {
            this.resetStrikeHold();
          }
          // Smooth scrub effect by tweening the timeline's progress
          gsap.to(approachTl, {
            progress: self.progress / 0.90, // Still map to 0.90 for smooth approach
            duration: 0.5,
            ease: "power2.out",
            overwrite: true
          });
        } else if (self.progress >= 0.90 && this.strikeState === 'IDLE') {
          // Immediately stop any lingering approachTl scrub tweens to prevent fighting
          gsap.killTweensOf(approachTl);
          this.triggerStrikeHold();
        } else if (self.progress >= 0.85 && self.progress < 0.90 && this.strikeState === 'IDLE') {
           // We are between hysteresis bounds and haven't triggered strike yet. Keep scrubbing!
          gsap.to(approachTl, {
            progress: self.progress / 0.90,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true
          });
        }
      }
    });

    // Refresh GSAP so subsequent sections like Selected Work correctly calculate their start points
    setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 100);
  }

  private triggerStrikeHold() {
    this.strikeState = 'IMPACT';
    const canvas = document.getElementById('bowling-canvas-container');
    const text = document.getElementById('strike-text');
    const textH2 = text?.querySelector('h2');
    
    // Add is-holding class to secure them on screen visually
    if (canvas) canvas.classList.add('is-holding');
    if (text) text.classList.add('is-holding');

    const IMPACT_Z = -this.laneLength;
    const START_Z = 0;
    const totalRotation = (IMPACT_Z - START_Z) / this.ballRadius;

    this.strikeTl = gsap.timeline();

    // -- BULLET TIME EFFECT --
    const bulletDuration = 2.5;
    const bulletEase = 'expo.out';

    // 1. Camera Shake (fast & violent at t=0)
    this.strikeTl.to(this.camera.rotation, {
      z: 0.05,
      duration: 0.04,
      yoyo: true,
      repeat: 5,
      ease: 'sine.inOut'
    }, 0);

    // 2. Text Slam (fast & violent at t=0)
    if (text) gsap.set(text, { opacity: 1, scale: 1 }); // ensure outer container is visible
    if (textH2) {
      gsap.set(textH2, { scale: 3, opacity: 0 }); // start massive and invisible
      this.strikeTl.to(textH2, {
        scale: 1.0,
        opacity: 1,
        duration: 0.15,
        ease: 'power4.in' // slams hard
      }, 0);
    }

    // 3. Bullet-time explosion of the physical world
    this.strikeTl.to(this.ballGroup.position, {
      z: IMPACT_Z - 5,
      duration: bulletDuration,
      ease: bulletEase
    }, 0);
    
    this.strikeTl.to(this.ballGroup.rotation, {
      x: totalRotation * (25 / 20),
      duration: bulletDuration,
      ease: bulletEase
    }, 0);

    this.strikeTl.to(this.camera.position, {
      z: IMPACT_Z + 12,
      y: 2.0,
      duration: bulletDuration,
      ease: bulletEase
    }, 0);

    this.strikeTl.to(this.cameraTarget, {
      z: IMPACT_Z - 5,
      y: 0,
      duration: bulletDuration,
      ease: bulletEase
    }, 0);

    this.pins.forEach((pin, i) => {
      const angle = (i / 10) * Math.PI - (Math.PI / 2);
      const force = 3 + (i % 3);
      
      this.strikeTl!.to(pin.position, {
        x: this.pinInitialTransforms[i].position.x + Math.sin(angle) * force,
        z: this.pinInitialTransforms[i].position.z - Math.cos(angle) * force - 4,
        y: 1 + (i % 2),
        duration: bulletDuration,
        ease: bulletEase
      }, 0);

      this.strikeTl!.to(pin.rotation, {
        x: -(Math.PI / 2) - (i % 2),
        y: angle * 2,
        z: (i % 3),
        duration: bulletDuration,
        ease: bulletEase
      }, 0);
    });

    // 2. HOLD (1000ms real-time delay)
    this.strikeTl.to({}, { duration: 1.0, onStart: () => { this.strikeState = 'STRIKE_HOLD'; } });

    // 3. RELEASE
    this.strikeTl.to([canvas, text], {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        this.strikeState = 'RELEASED';
        if (canvas) canvas.classList.remove('is-holding');
        if (text) text.classList.remove('is-holding');
      }
    });
  }

  private resetStrikeHold() {
    this.strikeState = 'IDLE';
    if (this.strikeTl) {
      this.strikeTl.kill();
      this.strikeTl = null;
    }
    
    const canvas = document.getElementById('bowling-canvas-container');
    const text = document.getElementById('strike-text');
    if (canvas) {
      canvas.classList.remove('is-holding');
      gsap.set(canvas, { opacity: 1 });
    }
    if (text) {
      text.classList.remove('is-holding');
      gsap.set(text, { opacity: 0, scale: 1 });
    }

    // Reset pins
    this.pins.forEach((pin, i) => {
      gsap.set(pin.position, {
        x: this.pinInitialTransforms[i].position.x,
        y: this.pinInitialTransforms[i].position.y,
        z: this.pinInitialTransforms[i].position.z
      });
      gsap.set(pin.rotation, {
        x: this.pinInitialTransforms[i].rotation.x,
        y: this.pinInitialTransforms[i].rotation.y,
        z: this.pinInitialTransforms[i].rotation.z
      });
    });
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    if (!this.isMobile && !this.prefersReducedMotion) {
      window.addEventListener('mousemove', this.onMouseMove);
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private onResize = () => {
    if (!this.container) return;
    this.isMobile = window.innerWidth <= 768;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    
    // Adjust FOV based on mobile to keep ball prominent
    if (this.isMobile) {
      this.camera.fov = 60;
    } else {
      this.camera.fov = 45;
    }
    
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    if (!this.prefersReducedMotion) {
      if (this.ballGroup && !ScrollTrigger.isScrolling()) {
        if (window.scrollY < 100) {
           this.ballGroup.rotation.y += 0.001;
        }
      }

      if (!this.isMobile) {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        // Interactive Ball Physics
        if (this.strikeState === 'IDLE' && this.ballGroup) {
          // Subtle positional shift based on mouse
          this.ballGroup.position.x = this.mouse.x * 0.5;
          // Physical rolling/tilting effect
          this.ballGroup.rotation.y = this.mouse.x * 0.6;
          this.ballGroup.rotation.z = -this.mouse.x * 0.4;
        }

        // Base X/Y positions updated by GSAP timeline, we inject offset
        this.camera.position.x = this.mouse.x * 0.5;
        // The camera target is animated by GSAP. Apply parallax to lookAt slightly.
        this.camera.lookAt(
          this.cameraTarget.x,
          this.cameraTarget.y + this.mouse.y * 0.2, // Subtle vertical parallax
          this.cameraTarget.z
        );
      } else {
        // Mobile needs to explicitly look at the animated target
        this.camera.lookAt(this.cameraTarget);
      }
    } else {
      // Reduced motion fallback
      this.camera.lookAt(this.cameraTarget);
    }

    this.renderer.render(this.scene, this.camera);
    
    this.updateDebugOverlay();
  }

  private updateDebugOverlay() {
    // Expose to window for external tests
    (window as any).__BOWLING_DEBUG__ = {
      ballZ: this.ballGroup?.position.z,
      pinsZ: this.pinsGroup?.position.z,
      cameraZ: this.camera.position.z,
      scrollProgress: ScrollTrigger.getById('bowlingTrigger')?.progress || 0
    };

    let debugEl = document.getElementById('bowling-debug-overlay');
    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.id = 'bowling-debug-overlay';
      debugEl.style.position = 'fixed';
      debugEl.style.top = '10px';
      debugEl.style.right = '10px';
      debugEl.style.background = 'rgba(0,0,0,0.8)';
      debugEl.style.color = '#0f0';
      debugEl.style.padding = '10px';
      debugEl.style.fontFamily = 'monospace';
      debugEl.style.fontSize = '12px';
      debugEl.style.zIndex = '9999';
      debugEl.style.pointerEvents = 'none';
      document.body.appendChild(debugEl);
    }
    
    debugEl.innerHTML = `
      <div>BALL Z: ${this.ballGroup?.position.z.toFixed(2)}</div>
      <div>PINS Z: ${this.pinsGroup?.position.z.toFixed(2)}</div>
      <div>CAMERA Z: ${this.camera.position.z.toFixed(2)}</div>
      <div>PROGRESS: ${((window as any).__BOWLING_DEBUG__.scrollProgress).toFixed(3)}</div>
    `;
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
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
