/**
 * hero.js
 * – Marquee contínuo com GSAP (xPercent -50, repeat -1)
 * – Spotlight sobre container fixo com lerp throttled
 * – Animação de entrada GSAP (substitui splash)
 * – Efeito magnético nos botões CTA
 * – Menu mobile e scroll listener do header
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ─────────────────────────────────────────────
   1. MARQUEE CONTÍNUO
───────────────────────────────────────────── */
function initMarquee() {
  const wrapper = document.querySelector('.hero-marquee-wrapper');
  const tracks  = document.querySelectorAll('.hero-marquee-track');
  if (!wrapper || !tracks.length || reducedMotion) return;

  const isMobile = window.innerWidth <= 768;
  const duration = isMobile ? 35 : 50;

  const marqueeTween = gsap.to(tracks, {
    xPercent: -50,
    ease: 'none',
    duration,
    repeat: -1,
  });

  wrapper.addEventListener('mouseenter', () => {
    gsap.to(marqueeTween, { timeScale: 0.3, duration: 0.6, ease: 'power2.out' });
  });
  wrapper.addEventListener('mouseleave', () => {
    gsap.to(marqueeTween, { timeScale: 1, duration: 0.6, ease: 'power2.out' });
  });

  // Pausa quando o Hero sair da tela
  const heroEl = document.getElementById('hero');
  if (heroEl) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          marqueeTween.resume();
        } else {
          marqueeTween.pause();
        }
      });
    });
    io.observe(heroEl);
  }
}

/* ─────────────────────────────────────────────
   2. SPOTLIGHT COM LERP THROTTLED (1 RAF por frame, cancelável)
───────────────────────────────────────────── */
function initMarqueeSpotlight() {
  const heroSection    = document.getElementById('hero');
  const spotlightLayer = document.querySelector('.marquee-layer-spotlight');
  if (!heroSection || !spotlightLayer) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  const LERP = 0.09;
  let rafId = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    currentX = lerp(currentX, targetX, LERP);
    currentY = lerp(currentY, targetY, LERP);
    spotlightLayer.style.setProperty('--mx', `${currentX}px`);
    spotlightLayer.style.setProperty('--my', `${currentY}px`);

    // Para o RAF quando convergiu (economiza CPU)
    if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function requestTick() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // Centro inicial
  const rect = spotlightLayer.getBoundingClientRect();
  targetX = currentX = rect.width / 2;
  targetY = currentY = rect.height / 2;
  spotlightLayer.style.setProperty('--mx', `${currentX}px`);
  spotlightLayer.style.setProperty('--my', `${currentY}px`);

  if (isTouch) {
    // Auto-tour no mobile – loop lemniscata suave
    gsap.to({}, {
      duration: 8,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: function () {
        const r = spotlightLayer.getBoundingClientRect();
        const cx = r.width / 2;
        const cy = r.height / 2;
        const t  = this.progress() * Math.PI * 2;
        const a  = r.width * 0.35;
        const d  = 1 + Math.sin(t) * Math.sin(t);
        targetX = cx + (a * Math.cos(t)) / d;
        targetY = cy + (a * 0.35 * Math.sin(t) * Math.cos(t)) / d;
        requestTick();
      },
    });
    return;
  }

  heroSection.addEventListener('mousemove', (e) => {
    const r = spotlightLayer.getBoundingClientRect();
    targetX = e.clientX - r.left;
    targetY = e.clientY - r.top;
    requestTick();
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    const r = spotlightLayer.getBoundingClientRect();
    targetX = r.width / 2;
    targetY = r.height / 2;
    requestTick();
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   3. EFEITO MAGNÉTICO NOS CTAs
───────────────────────────────────────────── */
function initMagneticButtons() {
  if (isTouch) return; // sem efeito em touch
  const buttons = document.querySelectorAll('.btn-cta-primary, .btn-cta-secondary');
  const RADIUS = 80, MAX_SHIFT = 10;

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width  / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < RADIUS) {
        const s = 1 - dist / RADIUS;
        gsap.to(btn, {
          x: dx * s * (MAX_SHIFT / (dist || 1)),
          y: dy * s * (MAX_SHIFT / (dist || 1)),
          duration: 0.3, ease: 'power2.out', overwrite: 'auto',
        });
      }
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.5)', overwrite: 'auto' });
    });
  });
}

/* ─────────────────────────────────────────────
   4. HEADER: SCROLL LISTENER
───────────────────────────────────────────── */
function initHeaderScroll() {
  const header      = document.querySelector('.site-header');
  const heroSection = document.getElementById('hero');
  if (!header) return;

  let ticking = false;

  function updateHeaderState() {
    const heroH     = heroSection ? heroSection.offsetHeight : window.innerHeight;
    const threshold = heroH - 120;
    header.classList.toggle('is-scrolled', window.scrollY > threshold);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateHeaderState); ticking = true; }
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
      { y: '0px', opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power4.out', delay: 0.05 }
    );
  }

  function closeMenu() {
    isOpen = false;
    hamburgerBtn.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('scroll-locked');
    gsap.to(mobileLinks, {
      opacity: 0, y: '20px', duration: 0.25, stagger: 0.04, ease: 'power2.in',
      onComplete: () => { mobileMenu.classList.remove('is-open'); hamburgerBtn.focus(); },
    });
  }

  hamburgerBtn.addEventListener('click', () => isOpen ? closeMenu() : openMenu());
  mobileLinks.forEach(link => link.addEventListener('click', () => { if (isOpen) closeMenu(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
}

/* ─────────────────────────────────────────────
   6. ANIMAÇÃO DE ENTRADA (substitui splash)
   – Sequência orquestrada com cortina + fade-in dos elementos
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
  const heroSection = document.getElementById('hero');

  if (reducedMotion) {
    const all = [bg, headerEl, microBar, marquee, photo, ...taglineWords, ...ctas, scroll].filter(Boolean);
    gsap.set(all, { opacity: 1, y: 0, x: 0, scale: 1, clipPath: 'none' });
    return;
  }

  // Estado inicial: tudo invisível
  if (bg)       gsap.set(bg,       { opacity: 0 });
  if (headerEl) gsap.set(headerEl, { opacity: 0, y: -20 });
  if (microBar) gsap.set(microBar, { opacity: 0, x: -10 });
  if (ctas.length) gsap.set(ctas, { opacity: 0, y: 16 });
  if (taglineWords.length) gsap.set(taglineWords, { opacity: 0, y: '80%' });
  if (marquee)  gsap.set(marquee, { opacity: 0, y: 20 });
  if (photo)    gsap.set(photo,   { opacity: 0, scale: 1.03 });
  if (scroll)   gsap.set(scroll,  { opacity: 0 });

  // Cortina de entrada: o hero começa com um overlay escuro que sobe
  const curtain = document.createElement('div');
  curtain.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:#050505;
    transform-origin: top center;
    pointer-events:none;
  `;
  document.body.appendChild(curtain);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Cortina sobe e revela o hero (0s → 0.6s)
  tl.to(curtain, {
    yPercent: -100,
    duration: 0.65,
    ease: 'power4.inOut',
    onComplete: () => curtain.remove(),
  }, 0);

  // Grid de fundo surge primeiro
  if (bg) tl.to(bg, { opacity: 1, duration: 0.7 }, 0.1);

  // Marquee emerge com fade suave
  if (marquee) tl.to(marquee, { opacity: 1, y: 0, duration: 0.9 }, 0.2);

  // Foto com escala sutil
  if (photo) tl.to(photo, { opacity: 1, scale: 1, duration: 1.1 }, 0.3);

  // Header desce do topo
  if (headerEl) tl.to(headerEl, { opacity: 1, y: 0, duration: 0.55 }, 0.45);

  // Microtextos aparecem da esquerda
  if (microBar) tl.to(microBar, { opacity: 1, x: 0, duration: 0.5 }, 0.55);

  // Tagline palavra por palavra (clip ascendente)
  if (taglineWords.length) {
    tl.to(taglineWords, { opacity: 1, y: '0%', duration: 0.45, stagger: 0.055 }, 0.65);
  }

  // CTAs surgem levemente de baixo
  if (ctas.length) tl.to(ctas, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, 0.9);

  // Indicador de scroll por último
  if (scroll) tl.to(scroll, { opacity: 1, duration: 0.4 }, 1.2);
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
