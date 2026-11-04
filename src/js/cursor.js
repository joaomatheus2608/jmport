/**
 * cursor.js
 * Cursor customizado com inércia e efeitos "grow" e "drag".
 * – Ativo apenas em pointer:fine (desktop)
 * – mix-blend-mode: difference para inversão de cor
 * – Cresce a 56px em links, botões e [data-cursor="grow"]
 * – Cresce a 84px com texto "ARRASTE" em [data-cursor="drag"]
 */

export function initCursor() {
  // Apenas em dispositivos com ponteiro fino (mouse)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'custom-cursor';
  dot.setAttribute('aria-hidden', 'true');

  const textEl = document.createElement('span');
  textEl.className = 'custom-cursor-text';
  dot.appendChild(textEl);

  document.body.appendChild(dot);

  // Injeta o CSS do cursor via JS para manter o CSS modular
  const style = document.createElement('style');
  style.textContent = `
    .custom-cursor {
      position: fixed;
      top: 0;
      left: 0;
      width: 12px;
      height: 12px;
      background: var(--white);
      border-radius: 50%;
      pointer-events: none;
      z-index: var(--z-cursor);
      mix-blend-mode: difference;
      transform: translate(-50%, -50%);
      transition: width 0.25s var(--ease-out), height 0.25s var(--ease-out);
      will-change: transform;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-cursor.is-grown {
      width: 56px;
      height: 56px;
    }
    .custom-cursor.is-drag {
      width: 84px;
      height: 84px;
    }
    .custom-cursor-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--bg);
      opacity: 0;
      transition: opacity 0.2s var(--ease-out);
      pointer-events: none;
      user-select: none;
    }
    .custom-cursor.is-drag .custom-cursor-text {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Posição alvo (posição real do mouse)
  let targetX = -100;
  let targetY = -100;
  // Posição atual (com inércia)
  let currentX = -100;
  let currentY = -100;
  const LERP = 0.28;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Loop de posicionamento com inércia
  function tick() {
    currentX = lerp(currentX, targetX, LERP);
    currentY = lerp(currentY, targetY, LERP);
    dot.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    requestAnimationFrame(tick);
  }

  // Atualiza o alvo a cada mousemove
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  // Interatividade e estados do cursor
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

  document.addEventListener('mouseover', (e) => {
    updateCursorState(e.target);
  });

  document.addEventListener('mouseout', (e) => {
    updateCursorState(e.relatedTarget);
  });

  requestAnimationFrame(tick);
}
