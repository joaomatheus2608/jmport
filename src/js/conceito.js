/**
 * conceito.js
 * Seção Manifesto / Conceito
 * – Divisão do texto em spans (.w) via JS nativo (sem plugins pagos)
 * – Scrub de revelação de palavras (0.14 -> 1) com ScrollTrigger pin
 * – Sublinhado animado nas palavras de destaque ("rápidas", "sob medida", "clientes")
 * – Entrada das 3 colunas informativas do rodapé
 * – Parallax sutil no brilho radial de fundo
 * – Suporte completo a prefers-reduced-motion e gsap.matchMedia
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Constrói o HTML das palavras dinamicamente preservando acessibilidade.
 * As palavras de destaque recebem um container com a linha decorativa (.u-line).
 */
function buildManifestoDOM(container) {
  if (!container) return;

  // Lista estruturada de palavras e grupos de destaque
  const tokens = [
    { type: 'word', text: 'Um' },
    { type: 'word', text: 'site' },
    { type: 'word', text: 'que' },
    { type: 'word', text: 'só' },
    { type: 'word', text: 'é' },
    { type: 'word', text: 'bonito' },
    { type: 'word', text: 'não' },
    { type: 'word', text: 'vende.' },
    { type: 'word', text: 'Eu' },
    { type: 'word', text: 'desenvolvo' },
    { type: 'word', text: 'páginas' },
    { type: 'highlight', text: 'rápidas,' },
    { type: 'word', text: 'otimizadas' },
    { type: 'word', text: 'e' },
    { type: 'word', text: 'feitas' },
    { type: 'highlight-group', words: ['sob', 'medida'] },
    { type: 'word', text: 'para' },
    { type: 'word', text: 'aparecer' },
    { type: 'word', text: 'no' },
    { type: 'word', text: 'Google' },
    { type: 'word', text: 'e' },
    { type: 'word', text: 'transformar' },
    { type: 'word', text: 'visitas' },
    { type: 'word', text: 'em' },
    { type: 'highlight', text: 'clientes.' },
  ];

  let html = '';

  tokens.forEach((token) => {
    if (token.type === 'word') {
      html += `<span class="w">${token.text}</span> `;
    } else if (token.type === 'highlight') {
      html += `<span class="highlight-wrap"><span class="w">${token.text}</span><span class="u-line"></span></span> `;
    } else if (token.type === 'highlight-group') {
      const wordsMarkup = token.words.map(w => `<span class="w">${w}</span>`).join(' ');
      html += `<span class="highlight-wrap">${wordsMarkup}<span class="u-line"></span></span> `;
    }
  });

  container.innerHTML = html.trim();
}

/**
 * Inicializa animações da seção Conceito
 */
export function initConceito() {
  const section = document.getElementById('conceito');
  const displayContainer = document.querySelector('.conceito-display');
  const glow = document.querySelector('.conceito-glow');

  if (!section || !displayContainer) return;

  // Monta as palavras
  buildManifestoDOM(displayContainer);

  const words = displayContainer.querySelectorAll('.w');
  const underlines = section.querySelectorAll('.u-line');

  // Se o usuário preferir movimento reduzido: exibe tudo imediatamente
  if (reducedMotion) {
    gsap.set(words, { opacity: 1 });
    gsap.set(underlines, { scaleX: 1 });
    return;
  }

  // Prepara estado inicial
  gsap.set(words, { opacity: 0.14 });
  gsap.set(underlines, { scaleX: 0, transformOrigin: 'left center' });

  // Responsividade e pin ajustado com gsap.matchMedia
  const mm = gsap.matchMedia();

  function setupAnimation(endDistance) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: endDistance,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // 1. Revelação das palavras (ocupa 0% a 78% da timeline)
    const wordsDuration = 0.78;
    const wordStep = wordsDuration / words.length;

    words.forEach((word, index) => {
      tl.to(
        word,
        {
          opacity: 1,
          duration: 0.08,
          ease: 'none',
        },
        index * wordStep
      );
    });

    // 2. Sublinhados nas palavras de destaque (78% a 95% da timeline)
    tl.to(
      underlines,
      {
        scaleX: 1,
        duration: 0.17,
        stagger: 0.06,
        ease: 'power2.out',
      },
      0.78
    );

    // 3. Parallax leve no brilho de fundo durante todo o percurso (de -10% a 10%)
    if (glow) {
      tl.fromTo(
        glow,
        { yPercent: -10 },
        { yPercent: 10, ease: 'none', duration: 1 },
        0
      );
    }

    return tl;
  }

  // Desktop (> 768px): end "+=160%"
  mm.add('(min-width: 769px)', () => {
    setupAnimation('+=160%');
  });

  // Mobile (<= 768px): end "+=130%"
  mm.add('(max-width: 768px)', () => {
    setupAnimation('+=130%');
  });

  // Recalcula o ScrollTrigger após o carregamento completo das fontes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }

  // Recalcula no resize com debounce de 150ms
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
  });
}

