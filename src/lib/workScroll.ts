import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Make sure to register ScrollTrigger only once in the client-side execution
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function initWorkScroll() {
  if (typeof window === 'undefined') return;
  
  const mm = gsap.matchMedia();

  // Unified logic for all screens (except reduced motion)
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const isMobile = window.innerWidth <= 768;
    const section = document.getElementById('work-section');
    const wrapper = document.getElementById('work-gallery-wrapper');
    const track = document.getElementById('work-gallery-track');
    const projects = gsap.utils.toArray('.work-project') as HTMLElement[];

    if (!section || !wrapper || !track || projects.length === 0) return;

    // Calculate total horizontal scroll distance
    const getScrollAmount = () => {
      const trackWidth = track.scrollWidth;
      return -(trackWidth - window.innerWidth);
    };

    const calculateSnapPoints = () => {
      const scrollAmount = Math.abs(getScrollAmount());
      if (scrollAmount === 0) return [0];

      return projects.map((project) => {
        const projectCenter = project.offsetLeft + (project.offsetWidth / 2);
        const viewportCenter = window.innerWidth / 2;
        let targetX = projectCenter - viewportCenter;
        
        if (targetX < 0) targetX = 0;
        if (targetX > scrollAmount) targetX = scrollAmount;

        return targetX / scrollAmount;
      });
    };

    // The master horizontal movement tween
    const tween = gsap.to(track, {
      x: getScrollAmount,
      ease: "none"
    });

    // Smooth entrance reveal for the first project when entering Selected Work
    if (projects.length > 0) {
      gsap.fromTo(projects[0],
        { opacity: 0.4, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );
    }

    // Pin the section and link horizontal tween to vertical scroll
    ScrollTrigger.create({
      id: "work-scroll-trigger",
      trigger: section,
      start: "top top",
      end: () => `+=${Math.abs(getScrollAmount())}`, 
      pin: true,
      animation: tween,
      scrub: 1, // Smooth 1-second delay for scrubbing
      invalidateOnRefresh: true,
      // Apply soft snapping to actual DOM project centers
      snap: {
        snapTo: (progress) => {
          const points = calculateSnapPoints();
          return gsap.utils.snap(points, progress);
        },
        delay: 0.1,
        duration: { min: 0.45, max: 0.65 },
        ease: "power3.out"
      }
    });

    // Handle project active states and spatial transforms using containerAnimation
    projects.forEach((project, i) => {
      ScrollTrigger.create({
        trigger: project,
        containerAnimation: tween,
        start: "left right", // Project's left edge hits viewport's right edge
        end: "right left",   // Project's right edge hits viewport's left edge
        onUpdate: (self) => {
          // progress goes from 0 (just entering) to 1 (just left)
          // Normalize so 0 is center, -1 is entering, 1 is leaving
          const normalized = (self.progress - 0.5) * 2; 
          const absNorm = Math.abs(normalized);
          
          // Spatial properties based on distance from center
          const scaleMultiplier = isMobile ? 0.04 : 0.15;
          const yMultiplier = isMobile ? 6 : 40;
          const rotMultiplier = isMobile ? 0 : 5;
          
          const scale = 1 - (absNorm * scaleMultiplier);
          const opacity = 1 - (absNorm * 0.5);
          const y = absNorm * yMultiplier;
          const rotate = normalized * rotMultiplier;

          // Apply transforms to the project card
          gsap.set(project, {
            scale: scale,
            opacity: opacity,
            y: y,
            rotationZ: rotate
          });

          // Subtle media parallax (move image opposite to scroll on desktop only)
          const media = project.querySelector('.project-media') || project.querySelector('img, video');
          if (media) {
            const parallaxDist = isMobile ? 0 : 35;
            gsap.set(media, { x: normalized * parallaxDist });
          }

          // Active state toggle
          if (absNorm < 0.25) {
            if (!project.classList.contains('is-active')) {
              project.classList.add('is-active');
              updateIndex(i + 1, project.dataset.category || '');
            }
          } else {
            project.classList.remove('is-active');
          }
        }
      });
    });
    window.addEventListener('bowling-intro-completed', () => {
      ScrollTrigger.refresh();
    });
  });
  
  // Reduced Motion fallback behavior (opacity fade only)
  mm.add("(prefers-reduced-motion: reduce)", () => {
    const section = document.getElementById('work-section');
    const track = document.getElementById('work-gallery-track');
    const projects = gsap.utils.toArray('.work-project') as HTMLElement[];
    
    if (!section || !track || projects.length === 0) return;

    const getScrollAmount = () => -(track.scrollWidth - window.innerWidth);

    const tween = gsap.to(track, {
      x: getScrollAmount,
      ease: "none"
    });

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${Math.abs(getScrollAmount())}`, 
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true
    });

    projects.forEach((project, i) => {
      ScrollTrigger.create({
        trigger: project,
        containerAnimation: tween,
        start: "left center+=15%",
        end: "right center-=15%",
        toggleClass: "is-active",
        onEnter: () => updateIndex(i + 1, project.dataset.category || ''),
        onEnterBack: () => updateIndex(i + 1, project.dataset.category || '')
      });
    });
  });
}

function updateIndex(index: number, category: string) {
  const indexEl = document.querySelector('.current-index');
  if (indexEl) {
    indexEl.textContent = String(index).padStart(2, '0');
  }
  
  const categoryEl = document.querySelector('.current-category');
  if (categoryEl && category) {
    categoryEl.textContent = category;
  }
}
