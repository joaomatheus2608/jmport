/**
 * cursor.js
 * Cursor customizado de alta performance.
 * - Sem mix-blend-mode: difference (elimina recomposição forçada da página inteira)
 * - requestAnimationFrame condicional: para completamente quando o mouse está estático
 * - Ativo exclusivamente em dispositivos com mouse real (pointer: fine)
 */

export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'custom-cursor';
  dot.setAttribute('aria-hidden', 'true');

  const textEl = document.createElement('span');
  textEl.className = 'custom-cursor-text';
  dot.appendChild(textEl);

  document.body.appendChild(dot);

  const style = document.createElement('style');
  style.textContent = `
    .custom-cursor {
      position: fixed;
      top: 0;
      left: 0;
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      transform: translate3d(-100px, -100px, 0);
      transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border 0.2s ease;
      will-change: transform;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.45);
    }
    .custom-cursor.is-grown {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(2px);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
    }
    .custom-cursor.is-drag {
      width: 72px;
      height: 72px;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(4px);
    }
    .custom-cursor-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #FFFFFF;
      opacity: 0;
      transition: opacity 0.18s ease;
      pointer-events: none;
      user-select: none;
    }
    .custom-cursor.is-drag .custom-cursor-text {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  let targetX = -100;
  let targetY = -100;
  let currentX = -100;
  let currentY = -100;
  let isTicking = false;
  const LERP = 0.32;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function tick() {
    currentX = lerp(currentX, targetX, LERP);
    currentY = lerp(currentY, targetY, LERP);

    dot.style.transform = `translate3d(${currentX - dot.offsetWidth / 2}px, ${currentY - dot.offsetHeight / 2}px, 0)`;

    // Se estiver a menos de 0.2px do alvo, encerra o RAF para 0% de uso de CPU
    if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
      requestAnimationFrame(tick);
    } else {
      isTicking = false;
    }
  }

  function wake() {
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(tick);
    }
  }

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    wake();
  }, { passive: true });

  const GROW_SELECTOR = 'a, button, [data-cursor="grow"]';
  const DRAG_SELECTOR = '[data-cursor="drag"]';

  function updateCursorState(target) {
    if (!target || !(target instanceof Element)) {
      dot.classList.remove('is-grown', 'is-drag');
      textEl.textContent = '';
      return;
    }

    const isGrow = target.closest(GROW_SELECTOR);
    const isDrag = target.closest(DRAG_SELECTOR);

    if (isGrow) {
      dot.classList.add('is-grown');
      dot.classList.remove('is-drag');
      textEl.textContent = '';
    } else if (isDrag) {
      dot.classList.remove('is-grown');
      dot.classList.add('is-drag');
      textEl.textContent = 'ARRASTE';
    } else {
      dot.classList.remove('is-grown', 'is-drag');
      textEl.textContent = '';
    }
  }

  document.addEventListener('mouseover', (e) => updateCursorState(e.target), { passive: true });
  document.addEventListener('mouseout', (e) => updateCursorState(e.relatedTarget), { passive: true });
}
