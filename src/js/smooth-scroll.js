/**
 * smooth-scroll.js
 * Rolagem com inércia (Lerp 0.085) sincronizada com GSAP ScrollTrigger.
 * Otimizações de performance:
 *  - ScrollTrigger.update() chamado apenas uma vez por frame via gsap.ticker
 *  - RAF só roda enquanto há movimento (auto-stop ao convergir)
 *  - Touch/reduced-motion: scroll nativo acelerado por hardware
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

class SmoothScrollEngine {
  constructor(options = {}) {
    this.ease    = options.ease  || 0.085;
    this.speed   = options.speed || 1.0;
    this.current = window.scrollY;
    this.target  = window.scrollY;
    this.max     = this.getMaxScroll();
    this.isActive   = false;
    this.isPaused   = false;
    this.isDestroyed = false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouch       = window.matchMedia('(pointer: coarse)').matches;

    this.onWheel  = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize  = this.onResize.bind(this);
    this.tick      = this.tick.bind(this);

    this.init();
  }

  getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  init() {
    if (this.reducedMotion || this.isTouch) {
      this.initAnchorLinks(false);
      return;
    }

    document.documentElement.style.scrollBehavior = 'auto';

    window.addEventListener('wheel',   this.onWheel,  { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize',  this.onResize, { passive: true });

    this.current = window.scrollY;
    this.target  = window.scrollY;
    this.max     = this.getMaxScroll();

    this.initAnchorLinks(true);
    // Registra no ticker do GSAP – mais eficiente que RAF próprio
    gsap.ticker.add(this.tick);
    gsap.ticker.lagSmoothing(0); // evita "catch-up" após tab oculta
  }

  tick() {
    if (this.isDestroyed || this.isPaused) return;

    const diff = this.target - this.current;

    // Só move se houver diferença perceptível
    if (Math.abs(diff) < 0.1) {
      if (this.isActive) {
        this.current = this.target;
        window.scrollTo(0, this.current);
        ScrollTrigger.update();
        this.isActive = false;
      }
      return;
    }

    this.isActive = true;
    this.current += diff * this.ease;
    window.scrollTo(0, Math.round(this.current));
    ScrollTrigger.update();
  }

  onResize() {
    this.max    = this.getMaxScroll();
    this.target = Math.min(Math.max(0, this.target), this.max);
    ScrollTrigger.update();
  }

  onWheel(e) {
    if (this.isPaused) return;

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;
    else if (e.deltaMode === 2) delta *= window.innerHeight;

    e.preventDefault();

    this.max = this.getMaxScroll();
    this.target += delta * this.speed;
    this.target  = Math.min(Math.max(0, this.target), this.max);
  }

  onKeyDown(e) {
    if (this.isPaused) return;

    const targetEl = e.target;
    if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable) return;

    let delta = 0;
    const step     = 100;
    const pageStep = window.innerHeight * 0.85;

    switch (e.key) {
      case 'ArrowDown': delta = step;      break;
      case 'ArrowUp':   delta = -step;     break;
      case 'PageDown':
      case ' ':         delta = e.shiftKey ? -pageStep : pageStep; break;
      case 'PageUp':    delta = -pageStep;  break;
      case 'Home':      this.target = 0;   e.preventDefault(); return;
      case 'End':       this.target = this.max; e.preventDefault(); return;
      default:          return;
    }

    if (delta !== 0) {
      e.preventDefault();
      this.max    = this.getMaxScroll();
      this.target = Math.min(Math.max(0, this.target + delta), this.max);
    }
  }

  scrollTo(targetPosition, duration = 1.0) {
    this.max = this.getMaxScroll();
    const clamped = Math.min(Math.max(0, targetPosition), this.max);

    if (this.reducedMotion || this.isTouch) {
      window.scrollTo({ top: clamped, behavior: 'smooth' });
      return;
    }

    this.target = clamped;
  }

  initAnchorLinks(isSmoothEngine) {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const targetEl = document.querySelector(href);
        if (!targetEl) return;

        e.preventDefault();

        const headerOffset = 72;
        let targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;

        if (href === '#projetos') {
          const stage = document.getElementById('conceito-projetos-stage');
          if (stage) {
            const isMobile = window.innerWidth <= 768;
            const endDistance = window.innerHeight * (isMobile ? 1.2 : 1.6);
            targetTop = stage.getBoundingClientRect().top + window.scrollY + (endDistance * 0.85);
          }
        }

        if (isSmoothEngine) {
          this.scrollTo(targetTop, 1.2);
        } else {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      });
    });
  }

  destroy() {
    this.isDestroyed = true;
    gsap.ticker.remove(this.tick);
    window.removeEventListener('wheel',   this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize',  this.onResize);
  }
}

let instance = null;

export function initSmoothScroll() {
  if (!instance) {
    instance = new SmoothScrollEngine({ ease: 0.085, speed: 1.05 });
  }
  return instance;
}
