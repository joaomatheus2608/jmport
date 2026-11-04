/**
 * splash.js
 * Splash Screen / Preloader cinematográfico
 * - Efeito de preenchimento progressivo da Logo (como um download)
 * - Barra de progresso linear e contador de porcentagem digital
 * - Saída fluida com subida da cortina escura
 */

import gsap from 'gsap';

export function initSplash(onFinish) {
  const splashEl    = document.getElementById('splash-screen');
  if (!splashEl) {
    if (onFinish) onFinish();
    return;
  }

  const fillLogo    = document.getElementById('splash-logo-fill');
  const progressBar = document.getElementById('splash-progress-bar');
  const percentEl   = document.getElementById('splash-percent');
  const statusEl    = document.getElementById('splash-status');
  const logoWrap    = splashEl.querySelector('.splash-logo-wrap');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0.4 : 1.6;

  const state = { progress: 0 };

  gsap.to(state, {
    progress: 100,
    duration: duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = Math.floor(state.progress);
      if (fillLogo) {
        fillLogo.style.clipPath = `inset(${100 - p}% 0 0 0)`;
      }
      if (progressBar) {
        progressBar.style.width = `${p}%`;
      }
      if (percentEl) {
        percentEl.textContent = `${p}%`;
      }
    },
    onComplete: () => {
      if (statusEl) statusEl.textContent = 'PRONTO';
      if (percentEl) percentEl.textContent = '100%';
      if (fillLogo) fillLogo.style.clipPath = 'inset(0% 0 0 0)';

      // Micro pulso de conclusão na logo
      if (logoWrap && !reducedMotion) {
        gsap.to(logoWrap, {
          scale: 1.08,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          onComplete: exitSplash,
        });
      } else {
        exitSplash();
      }
    },
  });

  function exitSplash() {
    gsap.to(splashEl, {
      yPercent: -100,
      duration: reducedMotion ? 0.3 : 0.85,
      ease: 'power4.inOut',
      onComplete: () => {
        splashEl.style.display = 'none';
        if (onFinish) onFinish();
      },
    });
  }
}

