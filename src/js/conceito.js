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

    // 1. Revelação das palavras (ocupa 0% a 50% da timeline)
    const wordsDuration = 0.50;
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

    // 2. Sublinhados nas palavras de destaque (42% a 54% da timeline)
    tl.to(
      underlines,
      {
        scaleX: 1,
        duration: 0.12,
        stagger: 0.03,
        ease: 'power2.out',
      },
      0.42
    );

    // 3. Parallax suave no brilho de fundo
    if (glow) {
      tl.fromTo(
        glow,
        { yPercent: -6 },
        { yPercent: 6, ease: 'none', duration: 0.58 },
        0
      );
    }

    // 4. TRANSIÇÃO IMERSIVA: ENTRANDO NA TELA COM DISTORÇÃO (58% a 100%)
    // Dispersão leve, fluida e sem filtros pesados (60 FPS constantes)
    const midIndex = Math.floor(words.length / 2);

    words.forEach((word, index) => {
      const relPos = (index - midIndex) / midIndex; // -1 (esquerda) a +1 (direita)
      const isLeft = relPos < 0;
      const xDist = (isLeft ? -1 : 1) * (window.innerWidth * (0.42 + Math.abs(relPos) * 0.45));
      const yDist = (index % 2 === 0 ? -1 : 1) * (window.innerHeight * (0.30 + (index % 3) * 0.15));

      tl.to(
        word,
        {
          x: xDist,
          y: yDist,
          scale: 3.2,
          opacity: 0,
          duration: 0.38,
          ease: 'power2.in',
        },
        0.58 + Math.abs(relPos) * 0.03
      );
    });

    // Sublinhados desvanecem
    tl.to(
      underlines,
      {
        opacity: 0,
        scaleX: 2,
        duration: 0.25,
        ease: 'power2.in',
      },
      0.60
    );

    // Fade out do brilho de fundo
    if (glow) {
      tl.to(
        glow,
        {
          scale: 2.2,
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in',
        },
        0.62
      );
    }

    // Container de texto do conceito escala para frente e desvanece
    tl.to(
      '.conceito-body',
      {
        scale: 2.2,
        opacity: 0,
        duration: 0.38,
        ease: 'power2.in',
      },
      0.58
    );

    return tl;
  }

  // Desktop: end "+=120%" (leitura nítida + transição ágil e fluida)
  mm.add('(min-width: 769px)', () => {
    setupAnimation('+=120%');
  });

  // Mobile: end "+=90%"
  mm.add('(max-width: 768px)', () => {
    setupAnimation('+=90%');
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

