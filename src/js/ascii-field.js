/**
 * ascii-field.js
 * Canvas com grade de caracteres animados no fundo do hero.
 * – 45 FPS máximo
 * – Pausa com IntersectionObserver e visibilitychange
 * – Degradê de máscara no canvas via globalAlpha por linha
 * – Reage ao mouse (raio 200px): caracteres "vivos" e mais opacos
 * – prefers-reduced-motion: quadro estático
 */

const CHARS = ['0', '1', '#', '@', '8', 'S', 'X', '+', '·', '=', '/'];
const CELL_W = 18;
const CELL_H = 22;
const BASE_OPACITY = 0.05;
const MOUSE_RADIUS = 200;
const MOUSE_OPACITY = 0.55;
const WAVE_PERIOD = 9000; // ms
const CHAR_SWAP_INTERVAL = 80; // ms
const TARGET_FPS = 45;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function initAsciiField(canvas) {
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cols = 0, rows = 0;
  // grade: { char, nextSwap } por célula
  let grid = [];
  let raf = null;
  let lastFrame = 0;
  let lastSwap = 0;
  let running = true;

  // posição do mouse em coordenadas do canvas (escala sem DPR)
  let mouseX = -9999, mouseY = -9999;

  // DPR com teto de 2 para performance
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ── Configuração do canvas ── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    cols = Math.ceil(rect.width  / CELL_W) + 1;
    rows = Math.ceil(rect.height / CELL_H) + 1;
    buildGrid();
  }

  function buildGrid() {
    grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        char: randomChar(),
        nextSwap: Date.now() + Math.random() * CHAR_SWAP_INTERVAL,
      }))
    );
  }

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  /* ── Render ── */
  function draw(now) {
    const canvasW = canvas.width  / dpr;
    const canvasH = canvas.height / dpr;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.font = `400 13px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'top';

    // onda lenta baseada no tempo
    const wavePhase = (now % WAVE_PERIOD) / WAVE_PERIOD; // 0..1

    for (let r = 0; r < rows; r++) {
      const y = r * CELL_H;
      // fração vertical 0 (topo) → 1 (base)
      const vFrac = y / canvasH;

      // máscara: some totalmente em 65% da altura (alpha 1 no topo → 0 em 65%)
      const maskAlpha = Math.max(0, 1 - (vFrac / 0.65));
      if (maskAlpha <= 0) continue;

      for (let c = 0; c < cols; c++) {
        const x = c * CELL_W;
        const cell = grid[r][c];

        // distância ao mouse
        const dx = x - mouseX;
        const dy = y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inRange = dist < MOUSE_RADIUS;

        // troca de char: perto do mouse troca mais rápido
        if (inRange && now >= cell.nextSwap) {
          cell.char = randomChar();
          cell.nextSwap = now + Math.random() * CHAR_SWAP_INTERVAL;
        } else if (!inRange && now >= cell.nextSwap + CHAR_SWAP_INTERVAL * 20) {
          // longe: troca bem raramente
          cell.char = randomChar();
          cell.nextSwap = now + Math.random() * CHAR_SWAP_INTERVAL * 30;
        }

        // opacidade: onda suave + influência do mouse
        const wave = 0.5 + 0.5 * Math.sin(
          (c / cols + r / rows + wavePhase) * Math.PI * 4
        );
        let opacity = BASE_OPACITY + wave * 0.04;

        if (inRange) {
          const t = 1 - dist / MOUSE_RADIUS;
          opacity = opacity + (MOUSE_OPACITY - opacity) * t * t;
        }

        ctx.globalAlpha = opacity * maskAlpha;
        // cor: gray-400 = #8a8a8a
        ctx.fillStyle = '#8a8a8a';
        ctx.fillText(cell.char, x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ── Loop de animação ── */
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);

    if (now - lastFrame < FRAME_INTERVAL) return;
    lastFrame = now;

    if (!reducedMotion) {
      draw(now);
    }
  }

  /* ── Quadro estático para reduced-motion ── */
  function staticFrame() {
    draw(0);
  }

  /* ── Rastreamento do mouse ── */
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  /* ── Pause / Resume ── */
  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function resume() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  /* ── IntersectionObserver: pausa quando fora da tela ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) resume();
      else pause();
    });
  }, { threshold: 0 });

  /* ── visibilitychange ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume();
  });

  /* ── Resize com debounce ── */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ctx.resetTransform();
      resize();
    }, 150);
  });

  /* ── Mouse ── */
  canvas.parentElement.addEventListener('mousemove', onMouseMove);
  canvas.parentElement.addEventListener('mouseleave', onMouseLeave);

  /* ── Inicialização ── */
  resize();
  io.observe(canvas.parentElement);

  if (reducedMotion) {
    staticFrame();
  } else {
    raf = requestAnimationFrame(loop);
  }
}

