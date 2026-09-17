import { gsap } from 'gsap';
// Note: In a client-side environment, you would register ScrollTrigger here.
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

export const animateFadeIn = (element: Element | string, delay: number = 0) => {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return;
  }
  
  gsap.fromTo(element, 
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 1, delay, ease: 'power3.out' }
  );
};

export const animateStaggerText = (elements: Element[] | string, delay: number = 0) => {
  if (prefersReducedMotion()) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(elements,
    { opacity: 0, y: 50 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.1, delay, ease: 'power4.out' }
  );
};
