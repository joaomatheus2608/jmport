/**
 * smooth-scroll.js
 * Scroll nativo do browser – sem interceptação de eventos.
 * Apenas gerencia navegação por âncoras com offset do header.
 * O scroll nativo é acelerado por hardware pelo SO/browser e nunca trava.
 */

export function initSmoothScroll() {
  // Scroll CSS nativo para âncoras
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const targetEl = document.querySelector(href);
      if (!targetEl) return;

      e.preventDefault();

      const headerOffset = 72;
      let targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;

      // Para a seção de projetos, pula direto ao marquee (depois da transição do conceito)
      if (href === '#projetos') {
        const stage = document.getElementById('conceito-projetos-stage');
        if (stage) {
          const isMobile = window.innerWidth <= 768;
          const endDistance = window.innerHeight * (isMobile ? 1.2 : 1.6);
          targetTop = stage.getBoundingClientRect().top + window.scrollY + (endDistance * 0.85);
        }
      }

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}
