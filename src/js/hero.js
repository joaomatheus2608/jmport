/**
 * hero.js
 * – Marquee contínuo com GSAP (0 a -50%, desaceleração a 30% no hover)
 * – Spotlight sobre container fixo com interpolação lerp (0.08)
 * – Animação de entrada GSAP timeline (~2s)
 * – Efeito magnético nos botões CTA
 * – Menu mobile e scroll listener do header
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ─────────────────────────────────────────────
   1. MARQUEE CONTÍNUO (GSAP + hover timeScale)
───────────────────────────────────────────── */
function initMarquee() {
  const wrapper = document.querySelector('.hero-marquee-wrapper');
  const tracks = document.querySelectorAll('.hero-marquee-track');
  if (!wrapper || !tracks.length) return;

  if (reducedMotion) return;

  const isMobile = window.innerWidth <= 768;
  // Desktop: ~50s (40-60s) | Mobile: ~35s (30-40s)
  const duration = isMobile ? 35 : 50;

  // Anima ambos os tracks (base e spotlight) de 0 a -50% perfeitamente sincronizados
  const marqueeTween = gsap.to(tracks, {
    xPercent: -50,
    ease: 'none',
    duration: duration,
    repeat: -1,
  });

  // Ao passar o mouse sobre o marquee, a velocidade reduz suavemente a 30%
  wrapper.addEventListener('mouseenter', () => {
    gsap.to(marqueeTween, { timeScale: 0.3, duration: 0.6, ease: 'power2.out' });
  });

  // Ao sair do hover, volta à velocidade normal
  wrapper.addEventListener('mouseleave', () => {
    gsap.to(marqueeTween, { timeScale: 1, duration: 0.6, ease: 'power2.out' });
  });
}

/* ─────────────────────────────────────────────
   2. SPOTLIGHT SOBRE O MARQUEE (máscara radial no container fixo)
───────────────────────────────────────────── */
function initMarqueeSpotlight() {
  const heroSection = document.getElementById('hero');
  const spotlightLayer = document.querySelector('.marquee-layer-spotlight');
  if (!heroSection || !spotlightLayer) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const LERP_FACTOR = 0.08;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function updateMask() {
    currentX = lerp(currentX, targetX, LERP_FACTOR);
    currentY = lerp(currentY, targetY, LERP_FACTOR);
    spotlightLayer.style.setProperty('--mx', `${currentX}px`);
    spotlightLayer.style.setProperty('--my', `${currentY}px`);
    requestAnimationFrame(updateMask);
  }

  // Inicializa centralizado
  const initialRect = spotlightLayer.getBoundingClientRect();
  targetX = currentX = initialRect.width / 2;
  targetY = currentY = initialRect.height / 2;
  spotlightLayer.style.setProperty('--mx', `${currentX}px`);
  spotlightLayer.style.setProperty('--my', `${currentY}px`);

  // Em dispositivos touch: auto-tour suave em formato 8
  if (isTouch) {
    gsap.to({}, {
      duration: 8,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: function () {
        const rect = spotlightLayer.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const t = this.progress() * Math.PI * 2;
        const a = rect.width * 0.35;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        targetX = cx + (a * Math.cos(t)) / denom;
        targetY = cy + (a * 0.35 * Math.sin(t) * Math.cos(t)) / denom;
      },
    });

    requestAnimationFrame(updateMask);
    return;
  }

  // Desktop: acompanha o mouse com inércia
  heroSection.addEventListener('mousemove', (e) => {
    const rect = spotlightLayer.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });

  // Ao sair do hero, retorna suavemente ao centro
  heroSection.addEventListener('mouseleave', () => {
    const rect = spotlightLayer.getBoundingClientRect();
    targetX = rect.width / 2;
    targetY = rect.height / 2;
  });

  requestAnimationFrame(updateMask);
}

/* ─────────────────────────────────────────────
   3. EFEITO MAGNÉTICO NOS CTAs
───────────────────────────────────────────── */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-cta-primary, .btn-cta-secondary');
  const RADIUS = 80;
  const MAX_SHIFT = 10;

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < RADIUS) {
        const strength = 1 - dist / RADIUS;
        gsap.to(btn, {
          x: dx * strength * (MAX_SHIFT / (dist || 1)),
          y: dy * strength * (MAX_SHIFT / (dist || 1)),
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
        overwrite: 'auto',
      });
    });
  });
}

/* ─────────────────────────────────────────────
   4. HEADER: SCROLL LISTENER
───────────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  const heroSection = document.getElementById('hero');
  if (!header) return;

  let ticking = false;

  function updateHeaderState() {
    const heroH = heroSection ? heroSection.offsetHeight : window.innerHeight;
    // Comprime exatamente ao sair da área do Hero
    const threshold = heroH - 120;
    if (window.scrollY > threshold) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateHeaderState, { passive: true });
  updateHeaderState();
}

/* ─────────────────────────────────────────────
   5. MENU MOBILE
───────────────────────────────────────────── */
function initMobileMenu() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const mobileMenu   = document.querySelector('.mobile-menu');
  const mobileLinks  = document.querySelectorAll('.mobile-nav-links a');

  if (!hamburgerBtn || !mobileMenu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    hamburgerBtn.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    document.body.classList.add('scroll-locked');

    gsap.fromTo(mobileLinks,
      { y: '40px', opacity: 0 },
      {
        y: '0px',
        opacity: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power4.out',
        delay: 0.05,
      }
    );
  }

  function closeMenu() {
    isOpen = false;
    hamburgerBtn.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('scroll-locked');

    gsap.to(mobileLinks, {
      opacity: 0,
      y: '20px',
      duration: 0.25,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        mobileMenu.classList.remove('is-open');
        hamburgerBtn.focus();
      },
    });
  }

  hamburgerBtn.addEventListener('click', () => {
    if (isOpen) closeMenu();
    else openMenu();
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}

/* ─────────────────────────────────────────────
   6. ANIMAÇÃO DE ENTRADA
───────────────────────────────────────────── */
function initEntranceAnimation() {
  const bg         = document.querySelector('.hero-grid');
  const headerEl   = document.querySelector('.site-header');
  const microBar   = document.querySelector('.micro-bar');
  const taglineWords = document.querySelectorAll('.tagline-word');
  const ctas       = document.querySelectorAll('.btn-cta-primary, .btn-cta-secondary');
  const scroll     = document.querySelector('.scroll-indicator');
  const marquee    = document.querySelector('.hero-marquee-wrapper');
  const photo      = document.querySelector('.hero-photo-center');

  const allEls = [bg, headerEl, microBar, marquee, photo, ...taglineWords, ...ctas, scroll].filter(Boolean);

  // Reduced-motion: mostra tudo imediatamente
  if (reducedMotion) {
    gsap.set(allEls, { opacity: 1, y: 0, x: 0 });
    return;
  }

  // Previne qualquer flash antes da renderização
  gsap.set(bg,       { opacity: 0 });
  gsap.set(headerEl, { opacity: 0, y: -24 });
  gsap.set(microBar, { opacity: 0, x: -12 });
  gsap.set(ctas,     { opacity: 0, y: 20 });
  gsap.set(taglineWords, { opacity: 0, y: '100%' });
  if (marquee) gsap.set(marquee, { opacity: 0, y: 24 });
  if (photo)   gsap.set(photo,   { opacity: 0, scale: 1.04 });
  if (scroll)  gsap.set(scroll,  { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // 0.0s: grid
  tl.to(bg, { opacity: 1, duration: 0.8 }, 0);
  // 0.2s: marquee surge com fade e sobe suavemente
  if (marquee) tl.to(marquee, { opacity: 1, y: 0, duration: 1.0 }, 0.2);
  // 0.4s: foto com escala sutil
  if (photo) tl.to(photo, { opacity: 1, scale: 1, duration: 1.2 }, 0.4);
  // 0.7s: header
  tl.to(headerEl, { opacity: 1, y: 0, duration: 0.6 }, 0.7);
  // 0.9s: microtextos
  tl.to(microBar, { opacity: 1, x: 0, duration: 0.5 }, 0.9);
  // 1.0s: tagline palavra por palavra
  tl.to(taglineWords, { opacity: 1, y: '0%', duration: 0.5, stagger: 0.06 }, 1.0);
  // 1.3s: CTAs
  tl.to(ctas, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 1.3);
  // 1.6s: indicador de scroll
  if (scroll) tl.to(scroll, { opacity: 1, duration: 0.4 }, 1.6);
}

/* ─────────────────────────────────────────────
   EXPORT PRINCIPAL
───────────────────────────────────────────── */
export function initHero() {
  initMarquee();
  initMarqueeSpotlight();
  initMagneticButtons();
  initHeaderScroll();
  initMobileMenu();
  initEntranceAnimation();
}
