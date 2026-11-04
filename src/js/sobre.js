/**
 * sobre.js
 * Animações e interações da seção SOBRE MIM
 * - Animação de revelação cinematográfica via GSAP e ScrollTrigger
 * - Micro-parallax tridimensional com o mouse entre foto e tipografia
 * - Suporte a prefers-reduced-motion
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initSobre() {
  const section = document.getElementById('sobre');
  if (!section) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  const textBack     = section.querySelector('.sobre-text-back');
  const textFront    = section.querySelector('.sobre-text-front');
  const photoWrapper = section.querySelector('.sobre-photo-wrapper');
  const colLeft      = section.querySelector('.sobre-col-left');
  const colRight     = section.querySelector('.sobre-col-right');

  const leftParagraphs  = colLeft ? colLeft.querySelectorAll('.sobre-p') : [];
  const rightParagraphs = colRight ? colRight.querySelectorAll('.sobre-p') : [];

  // ── 1. ANIMAÇÃO DE ENTRADA VIA SCROLLTRIGGER ──
  if (reducedMotion) {
    if (textBack) gsap.set(textBack, { opacity: 1, scale: 1 });
    if (textFront) gsap.set(textFront, { opacity: 1, scale: 1 });
    if (photoWrapper) gsap.set(photoWrapper, { opacity: 1, y: 0 });
    if (leftParagraphs.length) gsap.set(leftParagraphs, { opacity: 1, y: 0 });
    if (rightParagraphs.length) gsap.set(rightParagraphs, { opacity: 1, y: 0 });
    return;
  }

  // Estado inicial
  if (textBack && textFront) {
    gsap.set([textBack, textFront], { opacity: 0, scale: 0.93, letterSpacing: '-0.06em' });
  }
  if (photoWrapper) gsap.set(photoWrapper, { opacity: 0, y: 45 });
  if (leftParagraphs.length) gsap.set(leftParagraphs, { opacity: 0, y: 24 });
  if (rightParagraphs.length) gsap.set(rightParagraphs, { opacity: 0, y: 24 });

  const tl = gsap.timeline({ paused: true });

  if (textBack && textFront) {
    tl.to([textBack, textFront], {
      opacity: 1,
      scale: 1,
      letterSpacing: '-0.04em',
      duration: 1.15,
      ease: 'power3.out',
    }, 0);
  }

  if (photoWrapper) {
    tl.to(photoWrapper, {
      opacity: 1,
      y: 0,
      duration: 1.05,
      ease: 'power3.out',
    }, 0.15);
  }

  if (leftParagraphs.length) {
    tl.to(leftParagraphs, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power3.out',
    }, 0.35);
  }

  if (rightParagraphs.length) {
    tl.to(rightParagraphs, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      stagger: 0.12,
      ease: 'power3.out',
    }, 0.45);
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter: () => tl.play(),
  });

  // ── 2. MICRO-PARALLAX TRIDIMENSIONAL COM O MOUSE (Desktop) ──
  if (isFinePointer && !reducedMotion && photoWrapper && textBack && textFront) {
    let mouseX = 0;
    let mouseY = 0;
    let curPhotoX = 0;
    let curPhotoY = 0;
    let curTextX = 0;
    let curTextY = 0;

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;

      // Foto move suavemente no sentido oposto ao texto
      mouseX = xNorm * 18;
      mouseY = yNorm * 12;
    });

    section.addEventListener('mouseleave', () => {
      mouseX = 0;
      mouseY = 0;
    });

    function updateParallax() {
      curPhotoX += (mouseX - curPhotoX) * 0.06;
      curPhotoY += (mouseY - curPhotoY) * 0.06;

      // Texto se move em contra-ponto sutil para ampliar a sensação de profundidade
      curTextX += (-mouseX * 0.4 - curTextX) * 0.06;
      curTextY += (-mouseY * 0.4 - curTextY) * 0.06;

      // Foto se move suavemente no eixo horizontal e o texto em contra-ponto
      photoWrapper.style.transform = `translate3d(${curPhotoX.toFixed(2)}px, 0, 0)`;
      textBack.style.transform = `translate(calc(-50% + ${curTextX.toFixed(2)}px), calc(-50% + ${curTextY.toFixed(2)}px))`;
      textFront.style.transform = `translate(calc(-50% + ${curTextX.toFixed(2)}px), calc(-50% + ${curTextY.toFixed(2)}px))`;

      requestAnimationFrame(updateParallax);
    }

    updateParallax();
  }
}

