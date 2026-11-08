/**
 * smooth-scroll.js
 * Sistema de rolagem suave com inércia (Momentum / Inertia Smooth Scroll)
 * - Interpolação ponderada (Lerp 0.085) para sensação de peso e fluidez editorial
 * - Sincronização em tempo real com GSAP ScrollTrigger (ScrollTrigger.update())
 * - Suporte a âncoras internas com deslizamento suave
 * - Tratamento inteligente para teclado (setas, PageUp, PageDown, Home, End, Espaço)
 * - Preserva aceleração nativa de toque em smartphones/tablets
 * - Respeito automático a prefers-reduced-motion
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

class SmoothScrollEngine {
  constructor(options = {}) {
    this.ease = options.ease || 0.085;
    this.speed = options.speed || 1.0;
    this.current = window.scrollY;
    this.target = window.scrollY;
    this.max = this.getMaxScroll();
    this.isTicking = false;
    this.isPaused = false;
    this.isDestroyed = false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;

    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.update = this.update.bind(this);

    this.init();
  }

  getMaxScroll() {
    return Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }

  init() {
    if (this.reducedMotion || this.isTouch) {
      // Em touch ou reduced motion, deixa o scroll nativo com hardware acceleration
      this.initAnchorLinks(false);
      return;
    }

    // Configura html e body para rolagem suave controlada
    document.documentElement.style.scrollBehavior = 'auto';

    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize, { passive: true });

    // Mantém a posição sincronizada caso ocorra reload ou scroll externo
    this.current = window.scrollY;
    this.target = window.scrollY;
    this.max = this.getMaxScroll();

    this.initAnchorLinks(true);
    this.start();
  }

  start() {
    if (this.isTicking) return;
    this.isTicking = true;
    gsap.ticker.add(this.update);
  }

  stop() {
    if (!this.isTicking) return;
    this.isTicking = false;
    gsap.ticker.remove(this.update);
  }

  onResize() {
    this.max = this.getMaxScroll();
    this.target = Math.min(Math.max(0, this.target), this.max);
    ScrollTrigger.update();
  }

  onWheel(e) {
    if (this.isPaused) return;

    // Normaliza delta de scroll (Firefox line mode vs Chrome pixel mode)
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40; // linhas
    else if (e.deltaMode === 2) delta *= window.innerHeight; // páginas

    // Evita scroll jump do navegador
    e.preventDefault();

    this.max = this.getMaxScroll();
    this.target += delta * this.speed;
    this.target = Math.min(Math.max(0, this.target), this.max);

    if (!this.isTicking) {
      this.start();
    }
  }

  onKeyDown(e) {
    if (this.isPaused) return;

    const targetEl = e.target;
    if (
      targetEl.tagName === 'INPUT' ||
      targetEl.tagName === 'TEXTAREA' ||
      targetEl.isContentEditable
    ) {
      return;
    }

    let delta = 0;
    const step = 100;
    const pageStep = window.innerHeight * 0.85;

    switch (e.key) {
      case 'ArrowDown':
        delta = step;
        break;
      case 'ArrowUp':
        delta = -step;
        break;
      case 'PageDown':
      case ' ':
        if (!e.shiftKey) delta = pageStep;
        else delta = -pageStep;
        break;
      case 'PageUp':
        delta = -pageStep;
        break;
      case 'Home':
        this.target = 0;
        e.preventDefault();
        return;
      case 'End':
        this.target = this.max;
        e.preventDefault();
        return;
      default:
        return;
    }

    if (delta !== 0) {
      e.preventDefault();
      this.max = this.getMaxScroll();
      this.target += delta;
      this.target = Math.min(Math.max(0, this.target), this.max);
      this.start();
    }
  }

  update() {
    if (this.isDestroyed) return;

    // Interpolação suave (Lerp)
    const diff = this.target - this.current;
    this.current += diff * this.ease;

    // Conclusão do ciclo quando a diferença for desprezível
    if (Math.abs(diff) < 0.25) {
      this.current = this.target;
    }

    window.scrollTo(0, this.current);
    ScrollTrigger.update();

    if (this.current === this.target) {
      this.stop();
    }
  }

  scrollTo(targetPosition, duration = 1.0) {
    this.max = this.getMaxScroll();
    const clamped = Math.min(Math.max(0, targetPosition), this.max);

    if (this.reducedMotion || this.isTouch) {
      window.scrollTo({ top: clamped, behavior: 'smooth' });
      return;
    }

    gsap.to(this, {
      target: clamped,
      duration: duration,
      ease: 'power3.out',
      onStart: () => this.start(),
      onUpdate: () => {
        this.current += (this.target - this.current) * 0.15;
        window.scrollTo(0, this.current);
        ScrollTrigger.update();
      },
    });
  }

  initAnchorLinks(isSmoothEngine) {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const targetEl = document.querySelector(href);
        if (!targetEl) return;

        e.preventDefault();

        // Considera altura do header fixo (80px)
        const headerOffset = 72;
        const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;

        if (isSmoothEngine) {
          this.scrollTo(targetTop, 1.2);
        } else {
          window.scrollTo({
            top: targetTop,
            behavior: 'smooth',
          });
        }
      });
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.stop();
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
  }
}

let instance = null;

export function initSmoothScroll() {
  if (!instance) {
    instance = new SmoothScrollEngine({
      ease: 0.085, // Interpolação precisa e sedosa
      speed: 1.05,
    });
  }
  return instance;
}

