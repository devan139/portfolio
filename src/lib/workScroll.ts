import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Make sure to register ScrollTrigger only once in the client-side execution
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function initWorkScroll() {
  if (typeof window === 'undefined') return;
  
  const mm = gsap.matchMedia();

  // Desktop horizontal scroll (only if no reduced motion preference)
  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
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

    // The horizontal movement tween
    const tween = gsap.to(track, {
      x: getScrollAmount,
      ease: "none" // Linear movement, scrubbing will provide the easing/smoothing
    });

    // Pin the section and link horizontal tween to vertical scroll
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${Math.abs(getScrollAmount())}`, 
      pin: true,
      animation: tween,
      scrub: 1, // Smooth 1-second delay for scrubbing
      invalidateOnRefresh: true
    });

    // Handle project active states for depth/scale effects using containerAnimation
    projects.forEach((project, i) => {
      ScrollTrigger.create({
        trigger: project,
        containerAnimation: tween,
        start: "left center+=15%", // Adjust triggers to center the active item nicely
        end: "right center-=15%",
        toggleClass: "is-active",
        onEnter: () => updateIndex(i + 1, project.dataset.category || ''),
        onEnterBack: () => updateIndex(i + 1, project.dataset.category || '')
      });
    });

    return () => {
      // Cleanup is handled by GSAP matchMedia automatically
    };
  });
  
  // Mobile / Reduced Motion fallback behavior
  mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
    const projects = gsap.utils.toArray('.work-project') as HTMLElement[];
    
    // For mobile, just do simple scroll triggers to update the index or fade in
    projects.forEach((project, i) => {
      ScrollTrigger.create({
        trigger: project,
        start: "top center",
        end: "bottom center",
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
