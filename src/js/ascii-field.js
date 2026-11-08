/**
 * ascii-field.js
 * Canvas de fundo do hero com caracteres animados.
 * Performance: 24 FPS máx, desativado no mobile, pausa fora de tela.
 */

const CHARS = ['0', '1', '#', '@', 'S', '+', '·', '=', '/'];
const CELL_W = 22;
const CELL_H = 26;
const BASE_OPACITY   = 0.045;
const MOUSE_OPACITY  = 0.5;
const MOUSE_RADIUS   = 180;
const WAVE_PERIOD    = 10000;
const TARGET_FPS     = 24;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function initAsciiField(canvas) {
  // Desativa completamente no mobile para não desperdiçar GPU
  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
  if (isMobile) {
    canvas.style.display = 'none';
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  // DPR com teto de 1.5 para economizar memória GPU
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  let cols = 0, rows = 0, grid = [];
  let raf = null, lastFrame = 0, running = true;
  let mouseX = -9999, mouseY = -9999;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(rect.width  / CELL_W) + 1;
    rows = Math.ceil(rect.height / CELL_H) + 1;
    buildGrid();
  }

  function buildGrid() {
    const now = Date.now();
    grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        char: randomChar(),
        nextSwap: now + Math.random() * 3000,
      }))
    );
  }

  function randomChar() {
    return CHARS[(Math.random() * CHARS.length) | 0];
  }

  function draw(now) {
    const W = canvas.width  / dpr;
    const H = canvas.height / dpr;

    ctx.clearRect(0, 0, W, H);
    ctx.font = `400 12px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#8a8a8a';

    const wavePhase = (now % WAVE_PERIOD) / WAVE_PERIOD;

    for (let r = 0; r < rows; r++) {
      const y = r * CELL_H;
      const vFrac  = y / H;
      const maskAlpha = Math.max(0, 1 - vFrac / 0.6);
      if (maskAlpha <= 0) break; // linhas abaixo também serão 0

      for (let c = 0; c < cols; c++) {
        const x    = c * CELL_W;
        const cell = grid[r][c];

        // Troca de char baseada em tempo (simples, sem sqrt por célula fora do raio)
        if (now >= cell.nextSwap) {
          cell.char = randomChar();
          cell.nextSwap = now + 2000 + Math.random() * 4000;
        }

        // Distância ao mouse só perto do mouse
        let opacity = BASE_OPACITY + 0.02 * Math.sin((c / cols + r / rows + wavePhase) * Math.PI * 3);

        const dx = x - mouseX;
        const dy = y - mouseY;
        if (Math.abs(dx) < MOUSE_RADIUS && Math.abs(dy) < MOUSE_RADIUS) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const t = 1 - dist / MOUSE_RADIUS;
            opacity = opacity + (MOUSE_OPACITY - opacity) * t * t;

            // Troca rápida perto do mouse
            if (now >= cell.nextSwap - 3500) {
              cell.char = randomChar();
              cell.nextSwap = now + 60 + Math.random() * 80;
            }
          }
        }

        ctx.globalAlpha = opacity * maskAlpha;
        ctx.fillText(cell.char, x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_INTERVAL) return;
    lastFrame = now;
    draw(now);
  }

  function pause() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function resume() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => e.isIntersecting ? resume() : pause()),
    { threshold: 0 }
  );

  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { ctx.setTransform(1,0,0,1,0,0); resize(); }, 200);
  }, { passive: true });

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  }, { passive: true });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouseX = -9999; mouseY = -9999;
  }, { passive: true });

  resize();
  io.observe(canvas.parentElement);

  if (reducedMotion) {
    draw(0);
  } else {
    raf = requestAnimationFrame(loop);
  }
}
