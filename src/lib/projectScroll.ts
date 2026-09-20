import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initProjectScroll() {
  if (typeof window === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // Skip all complex animations if reduced motion is preferred

  // 1. Hero Entrance Stagger
  const heroElements = document.querySelectorAll('.gs-hero-stagger');
  if (heroElements.length > 0) {
    gsap.fromTo(heroElements, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.1 }
    );
  }

  // 2. Video/Media Scroll Expansion
  const mediaContainer = document.getElementById('hero-media-container');
  if (mediaContainer) {
    gsap.to(mediaContainer, {
      scrollTrigger: {
        trigger: mediaContainer,
        start: "top 80%",
        end: "bottom 40%",
        scrub: 0.5,
      },
      width: "100%",
      ease: 'none'
    });
  }

  // 3. Context Reveals
  const contextElements = document.querySelectorAll('.gs-reveal-context');
  contextElements.forEach((el) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
        },
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out'
      }
    );
  });

  // 4. Role & Tech Staggers
  const techElements = document.querySelectorAll('.gs-reveal-tech');
  techElements.forEach((el) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );
  });

  const techItems = document.querySelectorAll('.gs-tech-item');
  if (techItems.length > 0) {
    gsap.fromTo(techItems, 
      { opacity: 0, x: -20 },
      {
        scrollTrigger: {
          trigger: '.tech-list-container',
          start: "top 80%",
        },
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out'
      }
    );
  }

  // 5. Takeaway Reveals
  const takeawayElements = document.querySelectorAll('.gs-reveal-takeaway');
  takeawayElements.forEach((el) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      }
    );
  });

  // 6. Next Project Reveal
  const nextElements = document.querySelectorAll('.gs-reveal-next');
  nextElements.forEach((el) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out'
      }
    );
  });

  // Handle Video Autoplay logic (only play when in viewport to save resources)
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    ScrollTrigger.create({
      trigger: video,
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => video.play().catch(() => {}), // Ignore play errors (e.g. strict policies)
      onEnterBack: () => video.play().catch(() => {}),
      onLeave: () => video.pause(),
      onLeaveBack: () => video.pause()
    });
  });
}
