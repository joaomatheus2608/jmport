/**
 * predictive-arc.js
 * Predictive Arc (Originkit) – Otimizado para alta performance.
 * - MAX_DPR limitado a 1.0
 * - IntersectionObserver para pausar quando fora do viewport
 * - visibilitychange para pausar em abas em segundo plano
 */

const MAX_DPR = 1.0;

const VERT_SRC = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime, uDpr, uCell, uDot;
uniform float uPeak, uHeight, uThick, uFall;
uniform vec3  uBg, uBase, uAccent, uHigh;
uniform vec2  uMouse;
uniform float uMouseRadius, uMouseStrength;

void main(){
  float cs = max(uCell, 2.0);
  vec2 ci = floor(gl_FragCoord.xy / cs);
  vec2 cc = (ci + 0.5) * cs;

  float x = cc.x / uDpr;
  float y = (uRes.y - cc.y) / uDpr;
  float w = uRes.x / uDpr;
  float h = uRes.y / uDpr;

  float normX = (x - w * 0.5) / (w * 0.75);
  float curveY = h * uPeak + normX * normX * (h * uHeight);

  float mdx = x - uMouse.x;
  float influence = uMouseStrength * exp(-(mdx * mdx) / (2.0 * uMouseRadius * uMouseRadius + 1.0));
  curveY = mix(curveY, uMouse.y, influence);

  float dist = abs(y - curveY);
  float th = (140.0 + (1.0 - abs(normX)) * 80.0) * uThick;

  vec3 col = uBg;
  if (dist < th) {
    float i = 1.0 - dist / th;
    float waveX = sin(x * 0.015 + uTime);
    float waveY = cos(y * 0.02 + uTime);
    i = i * 0.7 + waveX * waveY * 0.3 * i;
    i *= max(0.0, 1.0 - pow(abs(normX), uFall));

    if (i > 0.02) {
      float side = uDot * i * uDpr;
      vec2 d = abs(gl_FragCoord.xy - cc);
      float cov = 1.0 - smoothstep(side * 0.5 - 1.0, side * 0.5 + 1.0, max(d.x, d.y));

      vec3 ink = mix(uBase, uAccent, clamp(pow(i, 1.1), 0.0, 1.0));
      ink = mix(ink, uHigh, smoothstep(0.72, 1.0, i));
      col = mix(uBg, ink, cov * clamp(i * 1.6, 0.0, 1.0));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function parseColor(input, fb = [1, 1, 1]) {
  if (!input) return fb;
  const str = String(input).trim();
  if (str.charAt(0) === "#") {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255];
    }
    return fb;
  }
  const m = str.match(/[\d.]+/g);
  if (m && m.length >= 3) {
    return [parseFloat(m[0]) / 255, parseFloat(m[1]) / 255, parseFloat(m[2]) / 255];
  }
  return fb;
}

export function initPredictiveArc(canvas, container, options = {}) {
  if (!canvas || !container) return null;

  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;

  const v = {
    bg: options.background || "#050505",
    base: options.baseColor || "#FFFFFF",
    accent: options.accentColor || "#FFFFFF",
    high: options.highlight || "#FFFFFF",
    density: options.density || 174,
    dotSize: (options.dotSize || 154) / 100,
    speed: (options.speed || 77) / 100,
    peak: ((options.arch && options.arch.peak) || 100) / 100,
    archHeight: ((options.arch && options.arch.archHeight) || 0) / 100,
    thickness: ((options.arch && options.arch.thickness) || 297) / 100,
    falloff: ((options.arch && options.arch.falloff) || 600) / 100,
    pointerRadius: (options.pointer && options.pointer.radius) || 236,
    pointerEnabled: options.pointer ? options.pointer.enabled !== false : true,
    pointerStrength: ((options.pointer && options.pointer.strength) || 34) / 100,
  };

  const ps = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: 0,
    targetActive: 0,
  };

  const handlePointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    ps.targetX = e.clientX - rect.left;
    ps.targetY = e.clientY - rect.top;
    ps.targetActive = 1;
  };

  const handlePointerLeave = () => {
    ps.targetActive = 0;
  };

  container.addEventListener("pointermove", handlePointerMove, { passive: true });
  container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });

  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const locs = {};
  const u = (name) => {
    if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name);
    return locs[name];
  };

  let raf = 0;
  let last = performance.now();
  let clock = 0;
  let isRunning = false;
  let isVisible = false;

  const cg = parseColor(v.bg, [0.02, 0.02, 0.02]);
  const cb = parseColor(v.base, [1, 1, 1]);
  const ca = parseColor(v.accent, [1, 1, 1]);
  const chh = parseColor(v.high, [1, 1, 1]);

  function render(now) {
    if (!isRunning || !isVisible) {
      raf = 0;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock = (clock + dt * 0.9 * v.speed) % 6283;

    const dpr = isMobile ? 0.75 : MAX_DPR;
    const cw = canvas.clientWidth || 800;
    const ch = canvas.clientHeight || 500;
    const bw = Math.max(1, Math.round(cw * dpr));
    const bh = Math.max(1, Math.round(ch * dpr));

    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    gl.viewport(0, 0, bw, bh);

    const pitchCss = Math.min(bw, bh) / dpr / v.density;

    const posLerp = Math.min(1, dt * 12);
    const activeLerp = Math.min(1, dt * 6);
    ps.x += (ps.targetX - ps.x) * posLerp;
    ps.y += (ps.targetY - ps.y) * posLerp;
    ps.active += (ps.targetActive - ps.active) * activeLerp;

    gl.uniform2f(u("uRes"), bw, bh);
    gl.uniform1f(u("uTime"), clock);
    gl.uniform1f(u("uDpr"), dpr);
    gl.uniform1f(u("uCell"), Math.max(2, pitchCss * dpr));
    gl.uniform1f(u("uDot"), pitchCss * 1.2 * v.dotSize);
    gl.uniform1f(u("uPeak"), v.peak);
    gl.uniform1f(u("uHeight"), v.archHeight);
    gl.uniform1f(u("uThick"), v.thickness);
    gl.uniform1f(u("uFall"), v.falloff);
    gl.uniform2f(u("uMouse"), ps.x, ps.y);
    gl.uniform1f(u("uMouseRadius"), v.pointerRadius);
    gl.uniform1f(
      u("uMouseStrength"),
      v.pointerEnabled ? v.pointerStrength * ps.active : 0
    );

    gl.uniform3f(u("uBg"), cg[0], cg[1], cg[2]);
    gl.uniform3f(u("uBase"), cb[0], cb[1], cb[2]);
    gl.uniform3f(u("uAccent"), ca[0], ca[1], ca[2]);
    gl.uniform3f(u("uHigh"), chh[0], chh[1], chh[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(render);
  }

  function start() {
    if (!isRunning && isVisible) {
      isRunning = true;
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(render);
    }
  }

  function pause() {
    isRunning = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  // ── IntersectionObserver: pausa quando fora da viewport ──
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          start();
        } else {
          pause();
        }
      });
    },
    { rootMargin: "100px" }
  );

  io.observe(container);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
    } else if (isVisible) {
      start();
    }
  });

  return {
    dispose() {
      pause();
      io.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
