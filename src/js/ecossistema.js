/**
 * ecossistema.js
 * Animação e comportamento da seção (03) ECOSSISTEMA.
 * - Fundo Ribbon Glow (WebGL2 Originkit) interativo com o ponteiro do mouse
 * - Animações elegantes de revelação sequencial via GSAP e ScrollTrigger
 * - Suporte completo a prefers-reduced-motion
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRibbonGlow } from './ribbon-glow.js';

export function initEcossistema() {
  const section = document.getElementById('ecossistema');
  if (!section) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const panel    = section.querySelector('.ecossistema-panel');
  const canvas   = section.querySelector('#ecossistema-canvas');
  const tag      = section.querySelector('.ecossistema-tag');
  const title    = section.querySelector('.ecossistema-title');
  const desc     = section.querySelector('.ecossistema-desc');
  const line     = section.querySelector('.ecossistema-divider-line');
  const dot      = section.querySelector('.ecossistema-divider-dot');
  const cards    = section.querySelectorAll('.ecossistema-card');

  // ── 1. INICIALIZA O EFEITO RIBBON GLOW (WebGL2) ──
  if (canvas && panel) {
    initRibbonGlow(canvas, panel, {
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

  // ── 2. PREPARAÇÃO DA TIPOGRAFIA FLUIDA (Word Reveal) ──
  let titleWords = [];
  if (title) {
    const rawText = title.textContent.trim().replace(/\s+/g, ' ');
    const words = rawText.split(' ');
    title.innerHTML = words
      .map(
        (w) =>
          `<span style="display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.08em;"><span class="eco-word" style="display:inline-block;">${w}</span></span>`
      )
      .join(' ');
    titleWords = title.querySelectorAll('.eco-word');
  }

  // ── 3. ANIMAÇÕES DE ENTRADA COM SCROLLTRIGGER ──
  if (reducedMotion) {
    if (tag)   gsap.set(tag,   { opacity: 1, y: 0 });
    if (titleWords.length) gsap.set(titleWords, { opacity: 1, y: '0%' });
    if (desc)  gsap.set(desc,  { opacity: 1, y: 0 });
    if (line)  gsap.set(line,  { scaleX: 1 });
    if (dot)   gsap.set(dot,   { scale: 1, opacity: 1 });
    if (cards && cards.length) {
      gsap.set(cards, { opacity: 1, y: 0 });
    }
    return;
  }

  // Estado inicial antes do scroll
  if (tag) gsap.set(tag, { opacity: 0, y: 20 });
  if (titleWords.length) {
    gsap.set(titleWords, { y: '115%', opacity: 0 });
  }
  if (desc)  gsap.set(desc,  { opacity: 0, y: 28 });
  if (line)  gsap.set(line,  { scaleX: 0, transformOrigin: 'center center' });
  if (dot)   gsap.set(dot,   { scale: 0, opacity: 0 });
  if (cards && cards.length) {
    gsap.set(cards, { opacity: 0, y: 35 });
  }

  const tl = gsap.timeline({ paused: true });

  if (tag) {
    tl.to(tag, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    }, 0);
  }

  if (titleWords.length) {
    tl.to(titleWords, {
      y: '0%',
      opacity: 1,
      duration: 0.95,
      stagger: 0.055,
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

  if (line) {
    tl.to(line, {
      scaleX: 1,
      duration: 0.85,
      ease: 'power2.inOut',
    }, 0.45);
  }

  if (dot) {
    tl.to(dot, {
      scale: 1,
      opacity: 1,
      duration: 0.45,
      ease: 'back.out(2)',
    }, 0.7);
  }

  if (cards && cards.length) {
    tl.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.09,
      ease: 'power3.out',
    }, 0.6);
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 78%',
    once: true,
    onEnter: () => tl.play(),
  });
}
