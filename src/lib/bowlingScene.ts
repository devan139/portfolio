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

    // BIND EVENTS
    this.bindEvents();

    // LOAD MODELS
    this.loadModels(ballUrl, pinUrl);

    // START LOOP
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
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

    // Use a GSAP Timeline mapped to the scroll progress of the pinned section
    // Extended to 400% to provide plenty of scrub room for the strike transition
    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'bowlingTrigger', // Added ID for debug lookup
        trigger: triggerSection,
        start: "top top",
        end: "+=400%",
        pin: true,
        scrub: 1, // Smooth scrub
        anticipatePin: 1
      }
    });

    if (this.prefersReducedMotion) {
      // Reduced motion: Just fade out text, show pins statically
      tl.to('#hero-typography', { opacity: 0, y: -50, duration: 1 });
      this.pins.forEach(p => p.scale.set(1, 1, 1));
      return;
    }

    const IMPACT_Z = -this.laneLength;
    const START_Z = 0;
    const totalRotation = (IMPACT_Z - START_Z) / this.ballRadius;

    // 0.00 -> 0.15: Typography visible, then fades and moves away
    tl.to('#hero-typography', { opacity: 0, y: -100, duration: 0.15 }, 0.05);
    
    // 0.15 -> 0.88: Ball travels down lane
    // We use a single continuous tween for smooth momentum
    tl.to(this.ballGroup.position, {
      z: IMPACT_Z + 3, // Ball approaches to within 3 units of the pins
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);
    
    tl.to(this.ballGroup.rotation, {
      x: totalRotation * (17 / 20), // Proportion of total rotation
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);

    // Camera follows the ball cinematically from 0.15 to 0.88
    tl.to(this.camera.position, {
      z: IMPACT_Z + 11, // 8 units behind the ball at IMPACT_Z + 3
      y: 1.8,
      duration: 0.73,
      ease: 'power2.in'
    }, 0.15);

    // 0.60 -> 0.70: Pins scale up to build anticipation
    this.pins.forEach((pin, index) => {
      tl.to(pin.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.10,
        ease: 'back.out(1.5)'
      }, 0.60 + (index * 0.005)); // tiny stagger
    });

    // 0.88 -> 0.94: Impact Anticipation
    tl.to(this.ballGroup.position, {
      z: IMPACT_Z - 0.5,
      duration: 0.06,
      ease: 'none'
    }, 0.88);

    tl.to(this.ballGroup.rotation, {
      x: totalRotation * (20.5 / 20),
      duration: 0.06,
      ease: 'none'
    }, 0.88);

    // Camera tightens slightly but stays 8 units away
    tl.to(this.camera.position, {
      z: IMPACT_Z + 7.5, // 8 units behind the ball at IMPACT_Z - 0.5
      y: 1.6,
      duration: 0.06,
      ease: 'none'
    }, 0.88);

    // 0.94 -> 0.97: CONTACT AND STRIKE DETERMINISTIC ANIMATION
    // Ball continues through the pins
    tl.to(this.ballGroup.position, {
      z: IMPACT_Z - 5,
      duration: 0.03,
      ease: 'none'
    }, 0.94);
    
    tl.to(this.ballGroup.rotation, {
      x: totalRotation * (25 / 20),
      duration: 0.03,
      ease: 'none'
    }, 0.94);

    // Camera shakes and pushes through, but STOPS at z: -14 so pins are still visible
    tl.to(this.camera.position, {
      z: IMPACT_Z + 6, // 6 units away from origin, safe from clipping
      y: 1.5,
      duration: 0.03,
      ease: 'power1.out'
    }, 0.94);

    // Deterministic Pin Tumble
    this.pins.forEach((pin, i) => {
      const angle = (i / 10) * Math.PI - (Math.PI / 2); // Spread -90 to +90
      const force = 3 + (i % 3);
      
      tl.to(pin.position, {
        x: pin.position.x + Math.sin(angle) * force,
        z: pin.position.z - Math.cos(angle) * force - 4, // Fly backward
        y: 1 + (i % 2), // Slight bounce
        duration: 0.03,
        ease: 'power1.out'
      }, 0.94);

      tl.to(pin.rotation, {
        x: -(Math.PI / 2) - (i % 2),
        y: angle * 2,
        z: (i % 3),
        duration: 0.03,
        ease: 'power1.out'
      }, 0.94);
    });

    // 0.94 -> 0.97: STRIKE overlay appears
    tl.to('#strike-text', {
      opacity: 1,
      scale: 1.05,
      duration: 0.03,
      ease: 'power2.out'
    }, 0.94);

    // 0.97 -> 1.00: STRIKE holds its state exactly as is.
    // At EXACTLY 1.00, we fade out natively as we unpin into Selected Work
    tl.to('#strike-text', {
      opacity: 0,
      y: -50,
      duration: 0.01,
      ease: 'none'
    }, 0.99);

    tl.to(this.renderer.domElement, {
      opacity: 0,
      duration: 0.01,
      ease: 'none'
    }, 0.99);

    // Refresh GSAP so subsequent sections like Selected Work correctly calculate their start points
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
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

        // Base X/Y positions updated by GSAP timeline, we inject offset
        this.camera.position.x = this.mouse.x * 0.5;
        // Don't modify camera.position.y/z heavily as it conflicts with GSAP
        // Just lookAt
        this.camera.lookAt(
          this.ballGroup.position.x, 
          this.ballGroup.position.y, 
          this.ballGroup.position.z - 5
        );
      }
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
