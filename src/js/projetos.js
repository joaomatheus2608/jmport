/**
 * projetos.js
 * Seção de Projetos – Marquee contínuo, infinito e clicável.
 * - Foco total nas imagens dos projetos
 * - Desacelera suavemente no hover do mouse
 * - Clique direto redireciona para o projeto
 * - Loop infinito impecável sincronizado via GSAP
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projects } from './projects-data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initProjetos() {
  const section = document.getElementById('projetos');
  if (!section) return;

  const container = section.querySelector('.projetos-marquee-container');
  const track = section.querySelector('#projetos-track');
  const title = section.querySelector('.projetos-title');
  const tag = section.querySelector('.projetos-tag');

  if (!container || !track) return;

  // ── 1. GERAÇÃO DOS CARDS (3 repetições completas para loop infinito contínuo) ──
  track.innerHTML = '';
  const REPETITIONS = 3;

  for (let r = 0; r < REPETITIONS; r++) {
    projects.forEach((proj) => {
      const isInternal = proj.url.startsWith('#');
      const badgeText = isInternal ? 'FAZER ORÇAMENTO' : proj.name;

      const card = document.createElement('a');
      card.className = 'projeto-marquee-card';
      card.href = proj.url;
      card.setAttribute('aria-label', `${proj.name} – Abrir projeto`);
      card.setAttribute('data-cursor', 'grow');

      if (isInternal) {
        card.setAttribute('data-internal', 'true');
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

      // Intercepta clique caso seja âncora interna (#orcamento) para usar scroll suave
      if (isInternal) {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const targetEl = document.querySelector(proj.url);
          if (targetEl) {
            const headerOffset = 72;
            const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          }
        });
      }

      track.appendChild(card);
    });
  }

  // ── 2. ANIMAÇÃO DE LOOP INFINITO DO MARQUEE ──
  let marqueeTween = null;

  function setupMarquee() {
    if (marqueeTween) {
      marqueeTween.kill();
      marqueeTween = null;
    }

    if (reducedMotion) return;

    // Mede a largura exata de 1 ciclo completo de projetos
    const totalWidth = track.scrollWidth;
    const singleSetWidth = totalWidth / REPETITIONS;

    if (singleSetWidth <= 0) return;

    gsap.set(track, { x: 0 });

    // Duração proporcional à quantidade de conteúdo (velocidade editorial suave)
    const isMobile = window.innerWidth <= 768;
    const duration = isMobile ? 22 : 32;

    marqueeTween = gsap.to(track, {
      x: -singleSetWidth,
      duration: duration,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          return parseFloat(x) % singleSetWidth;
        }),
      },
    });
  }

  // Inicializa após carregamento e recalcula no resize
  setupMarquee();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupMarquee, 150);
  });

  // ── 3. DESACELERAÇÃO SUAVE AO PASSAR O MOUSE (Hover Slowdown) ──
  container.addEventListener('mouseenter', () => {
    if (marqueeTween && !reducedMotion) {
      gsap.to(marqueeTween, {
        timeScale: 0.2, // desacelera para 20% da velocidade original
        duration: 0.65,
        ease: 'power2.out',
      });
    }
  });

  container.addEventListener('mouseleave', () => {
    if (marqueeTween && !reducedMotion) {
      gsap.to(marqueeTween, {
        timeScale: 1.0, // retoma à velocidade padrão suavemente
        duration: 0.65,
        ease: 'power2.out',
      });
    }
  });

  // ── 4. ESTADO DO CABEÇALHO DA SEÇÃO ──
  if (title) {
    gsap.set(title, { opacity: 1, y: 0 });
  }
  if (tag) {
    gsap.set(tag, { opacity: 1, y: 0 });
  }
}
