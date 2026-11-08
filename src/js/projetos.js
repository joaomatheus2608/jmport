/**
 * projetos.js
 * Seção de Projetos – Marquee contínuo duplo e em direções opostas.
 * - Fileira 1: Projetos / Landing Pages (Direita -> Esquerda)
 * - Fileira 2: Cardápios Digitais / Delivery (Esquerda -> Direita)
 * - Foco total nas imagens dos projetos
 * - Desacelera suavemente no hover do mouse
 * - Clique direto redireciona para o projeto
 * - Loop infinito sincronizado via GSAP
 */

import gsap from 'gsap';
import { projects, cardapios } from './projects-data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cria os cards dinamicamente dentro de um track
 */
function createCards(track, items, repetitions = 4) {
  track.innerHTML = '';
  for (let r = 0; r < repetitions; r++) {
    items.forEach((proj) => {
      const isInternal = proj.url.startsWith('#');
      const badgeText = isInternal ? 'FAZER ORÇAMENTO' : proj.name;

      const card = document.createElement('a');
      card.className = 'projeto-marquee-card';
      card.href = proj.url;
      card.setAttribute('aria-label', `${proj.name} – Abrir projeto`);
      card.setAttribute('data-cursor', 'grow');

      if (isInternal) {
        card.setAttribute('data-internal', 'true');
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const targetEl = document.querySelector(proj.url);
          if (targetEl) {
            const headerOffset = 72;
            const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          }
        });
      } else {
        card.setAttribute('target', '_blank');
        card.setAttribute('rel', 'noopener noreferrer');
      }

      card.innerHTML = `
        <div class="projeto-card-img-wrap">
          <img
            src="${proj.image}"
            alt="${proj.name}"
            class="projeto-card-img"
            loading="lazy"
            decoding="async"
          />
          <div class="projeto-card-badge">
            <span>${badgeText}</span>
            <span class="projeto-card-arrow" aria-hidden="true">↗</span>
          </div>
        </div>
      `;
      track.appendChild(card);
    });
  }
}

/**
 * Configura o loop contínuo e a desaceleração no hover de um marquee
 */
function setupMarqueeAnimation(container, track, itemsCount, direction = 'normal') {
  let marqueeTween = null;
  const REPETITIONS = 4;

  function run() {
    if (reducedMotion) return;

    if (marqueeTween) {
      marqueeTween.kill();
      marqueeTween = null;
    }

    const firstCard = track.children[0];
    const setCard = track.children[itemsCount];
    let singleSetWidth = 0;

    if (firstCard && setCard) {
      singleSetWidth = setCard.offsetLeft - firstCard.offsetLeft;
    }
    if (!singleSetWidth || singleSetWidth <= 0) {
      singleSetWidth = track.scrollWidth / REPETITIONS;
    }
    if (singleSetWidth <= 0) return;

    const isMobile = window.innerWidth <= 768;
    // Duração proporcional à quantidade de itens para fluidez harmônica
    const duration = isMobile ? 22 : 30;

    if (direction === 'reverse') {
      // Direção contrária: da esquerda para a direita
      gsap.set(track, { x: -singleSetWidth });
      marqueeTween = gsap.to(track, {
        x: 0,
        duration: duration,
        ease: 'none',
        repeat: -1,
      });
    } else {
      // Direção padrão: da direita para a esquerda
      gsap.set(track, { x: 0 });
      marqueeTween = gsap.to(track, {
        x: -singleSetWidth,
        duration: duration,
        ease: 'none',
        repeat: -1,
      });
    }
  }

  // Inicializações e recálculos precisos
  run();
  requestAnimationFrame(run);

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(run, 150);
  });

  // Desaceleração suave no hover
  container.addEventListener('mouseenter', () => {
    if (marqueeTween && !reducedMotion) {
      gsap.to(marqueeTween, {
        timeScale: 0.2,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  });

  container.addEventListener('mouseleave', () => {
    if (marqueeTween && !reducedMotion) {
      gsap.to(marqueeTween, {
        timeScale: 1.0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  });

  return { run };
}

export function initProjetos() {
  const section = document.getElementById('projetos');
  if (!section) return;

  const track1 = section.querySelector('#projetos-track');
  const container1 = section.querySelector('.marquee-row-1') || section.querySelector('.projetos-marquee-container');

  const track2 = section.querySelector('#cardapios-track');
  const container2 = section.querySelector('.marquee-row-2') || section.querySelector('.cardapios-marquee-container');

  const title = section.querySelector('.projetos-title');

  // ── 1. FILEIRA 1: PROJETOS / WEBSITES (Direita para Esquerda) ──
  if (container1 && track1) {
    createCards(track1, projects, 4);
    setupMarqueeAnimation(container1, track1, projects.length, 'normal');
  }

  // ── 2. FILEIRA 2: CARDÁPIOS DIGITAIS (Esquerda para Direita) ──
  if (container2 && track2) {
    createCards(track2, cardapios, 4);
    setupMarqueeAnimation(container2, track2, cardapios.length, 'reverse');
  }

  // ── 3. ESTADO DO TÍTULO DA SEÇÃO ──
  if (title) {
    gsap.set(title, { opacity: 1, y: 0 });
  }
}
