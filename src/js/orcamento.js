/**
 * orcamento.js
 * Animação e orquestração da seção final: "VAMOS CRIAR ALGO ÚNICO?"
 * - Fundo da seção: Predictive Arc (malha interativa WebGL)
 * - Fundo do Card: Ribbon Glow (WebGL2 com fitas orgânicas fluidas)
 * - Efeito magnético nos botões CTA
 * - Animação de entrada cinematográfica com GSAP e ScrollTrigger
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initPredictiveArc } from './predictive-arc.js';
import { initRibbonGlow } from './ribbon-glow.js';

export function initOrcamento() {
  const section = document.getElementById('orcamento');
  if (!section) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  const bgCanvas   = section.querySelector('#orcamento-bg-canvas');
  const cardCanvas = section.querySelector('#orcamento-card-canvas');
  const card       = section.querySelector('.orcamento-card');

  const tag     = section.querySelector('.orcamento-tag');
  const title   = section.querySelector('.orcamento-title');
  const desc    = section.querySelector('.orcamento-desc');
  const actions = section.querySelector('.orcamento-actions');
  const btns    = section.querySelectorAll('.btn-orcamento-primary, .btn-orcamento-secondary');
  const line    = section.querySelector('.orcamento-bottom-line');
  const meta    = section.querySelector('.orcamento-meta');

  // ── 1. INICIALIZA O PREDICTIVE ARC NO FUNDO DA SEÇÃO ──
  if (bgCanvas) {
    initPredictiveArc(bgCanvas, section, {
      background: '#050505',
      baseColor: '#FFFFFF',
      accentColor: '#FFFFFF',
      highlight: '#FFFFFF',
      density: 174,
      dotSize: 154,
      speed: 77,
      arch: {
        peak: 100,
        archHeight: 0,
        thickness: 297,
        falloff: 600,
      },
      pointer: {
        radius: 236,
        enabled: true,
        strength: 34,
      },
    });
  }

  // ── 2. INICIALIZA O RIBBON GLOW NO FUNDO DO CARD ──
  if (cardCanvas && card) {
    initRibbonGlow(cardCanvas, card, {
      background: '#050505',
      color1: '#FFFFFF', // Branco puro
      color2: '#B0B0B0', // Cinza claro
      speed: 48,
      size: 100,
      angle: -180,
      hover: 100,
      reach: 260,
    });
  }

  // ── 3. EFEITO MAGNÉTICO NOS BOTÕES DE AÇÃO (Desktop) ──
  if (isFinePointer && !reducedMotion) {
    btns.forEach((btn) => {
      const RADIUS = 65;
      const MAX_SHIFT = 8;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
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
          duration: 0.7,
          ease: 'elastic.out(1, 0.5)',
          overwrite: 'auto',
        });
      });
    });
  }

  // ── 4. PREPARAÇÃO DA TIPOGRAFIA FLUIDA (Word Reveal) ──
  let titleWords = [];
  if (title) {
    const rawText = title.textContent.trim().replace(/\s+/g, ' ');
    const words = rawText.split(' ');
    title.innerHTML = words
      .map(
        (w) =>
          `<span style="display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.08em;"><span class="orc-word" style="display:inline-block;">${w}</span></span>`
      )
      .join(' ');
    titleWords = title.querySelectorAll('.orc-word');
  }

  // ── 5. ANIMAÇÃO DE ENTRADA CINEMATOGRÁFICA COM SCROLLTRIGGER ──
  if (reducedMotion) {
    if (titleWords.length) gsap.set(titleWords, { opacity: 1, y: '0%' });
    if (desc)  gsap.set(desc,  { opacity: 1, y: 0 });
    if (actions) gsap.set(actions, { opacity: 1, y: 0 });
    return;
  }

  // Estado inicial
  if (titleWords.length) {
    gsap.set(titleWords, { y: '115%', opacity: 0 });
  }
  if (desc) gsap.set(desc, { opacity: 0, y: 28 });
  if (actions) gsap.set(actions, { opacity: 0, y: 24 });

  const tl = gsap.timeline({ paused: true });

  if (titleWords.length) {
    tl.to(titleWords, {
      y: '0%',
      opacity: 1,
      duration: 0.95,
      stagger: 0.06,
      ease: 'power4.out',
    }, 0.1);
  }

  if (desc) {
    tl.to(desc, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power3.out',
    }, 0.28);
  }

  if (actions) {
    tl.to(actions, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power3.out',
    }, 0.45);
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter: () => tl.play(),
  });
}

