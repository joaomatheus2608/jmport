/**
 * projetos.js
 * Seção de Projetos – Carrossel de screenshots com moldura de browser minimalista.
 * Slide ativo: centralizado, full color. Vizinhos: laterais, escuros e desfocados.
 * Autoplay 7s, drag/swipe, teclado, IntersectionObserver, visibilitychange.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projects } from './projects-data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer  = window.matchMedia('(pointer: fine)').matches;

/* ─── SVG de fallback neutro ─── */
function createPlaceholderSVG(name = 'PROJETO', cat = 'DEV WEB') {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900"
  style="background:#0c0c0c;font-family:'Inter',system-ui,sans-serif;">
  <rect x="0" y="0" width="1440" height="64" fill="#141414"/>
  <rect x="40" y="22" width="28" height="20" rx="5" fill="#fafafa"/>
  <rect x="80" y="28" width="120" height="10" rx="3" fill="#555"/>
  <rect x="1100" y="22" width="100" height="20" rx="10" fill="#fafafa"/>
  <text x="720" y="430" fill="#fafafa" font-size="80" font-weight="800"
    letter-spacing="-3" text-anchor="middle">${name}</text>
  <text x="720" y="490" fill="#555" font-size="18" letter-spacing="2"
    text-anchor="middle">${cat}</text>
</svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ─── Init principal ─── */
export function initProjetos() {
  const section = document.getElementById('projetos');
  if (!section) return;

  const stage            = section.querySelector('.projetos-stage');
  const thumbsContainer  = section.querySelector('.projetos-thumbs');
  const stageWrapper     = section.querySelector('.projetos-stage-wrapper');

  const nameEl         = section.querySelector('.project-name');
  const categoryEl     = section.querySelector('.project-category');
  const descEl         = section.querySelector('.project-desc');
  const tagsEl         = section.querySelector('.project-tags');
  const counterEl      = section.querySelector('.projetos-counter');
  const viewProjectBtn = section.querySelector('.btn-view-project');
  const prevBtn        = section.querySelector('.btn-nav-prev');
  const nextBtn        = section.querySelector('.btn-nav-next');
  const playPauseBtn   = section.querySelector('.btn-autoplay-toggle');

  const total = projects.length;
  let activeIndex       = 0;
  let isAnimating       = false;
  let isPausedByUser    = false;
  let isHovered         = false;
  let isFocused         = false;
  let isVisibleOnScreen = true;
  let isPointerDown     = false;
  let activeScrollTween = null;
  let autoplayTween     = null;

  /* ── Monta slides e miniaturas ── */
  stage.innerHTML          = '';
  thumbsContainer.innerHTML = '';

  const slides = [];
  const thumbs  = [];

  projects.forEach((proj, idx) => {
    const slide = document.createElement('div');
    slide.className = `project-slide${idx === 0 ? ' is-active' : ''}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${idx + 1} de ${total}`);
    slide.dataset.index = idx;

    const fallback   = createPlaceholderSVG(proj.name, proj.category);
    const isInternal = proj.url.startsWith('#');
    const badgeAttr  = isInternal ? '' : 'target="_blank" rel="noopener noreferrer"';
    const badgeText  = isInternal ? 'DISPONÍVEL' : 'AO VIVO';
    /* URL curta para exibir na barra do browser */
    const displayUrl = proj.url.startsWith('#')
      ? 'matheus.dev/orcamento'
      : proj.url.replace(/^https?:\/\//, '');

    /* Estrutura: browser-frame > browser-bar + browser-screen */
    slide.innerHTML = `
      <div class="browser-frame">
        <!-- Barra superior do browser -->
        <div class="browser-bar" aria-hidden="true">
          <span class="browser-dot"></span>
          <span class="browser-dot"></span>
          <span class="browser-dot"></span>
          <div class="browser-url">
            <span class="browser-url-dot"></span>
            <span class="browser-url-text">${displayUrl}</span>
          </div>
        </div>

        <!-- Screenshot do projeto -->
        <div class="browser-screen">
          <a href="${proj.url}" ${badgeAttr}
             class="badge-live"
             aria-label="${isInternal ? 'Solicitar projeto' : 'Ver ' + proj.name + ' ao vivo'}">
            <span class="badge-dot" aria-hidden="true"></span>
            <span>${badgeText}</span>
          </a>
          <div class="screen-glare" aria-hidden="true"></div>
          <img
            src="${proj.image}"
            alt="Captura de tela: ${proj.name}"
            class="project-screen-img"
            loading="${idx <= 1 ? 'eager' : 'lazy'}"
            decoding="async"
            width="1440"
            height="900"
          />
        </div>
      </div>
    `;

    const imgEl = slide.querySelector('.project-screen-img');
    imgEl.addEventListener('error', () => { imgEl.src = fallback; });

    stage.appendChild(slide);
    slides.push(slide);

    /* Miniatura */
    const thumb = document.createElement('button');
    thumb.className = `project-thumb-btn${idx === 0 ? ' is-active' : ''}`;
    thumb.setAttribute('aria-label', `Ir para projeto ${idx + 1}: ${proj.name}`);
    thumb.setAttribute('data-cursor', 'grow');
    thumb.dataset.index = idx;
    thumb.innerHTML = `
      <img src="${proj.image}" alt="" aria-hidden="true" loading="lazy" decoding="async"/>
      <div class="thumb-progress" aria-hidden="true"></div>
    `;
    const tImg = thumb.querySelector('img');
    tImg.addEventListener('error', () => { tImg.src = fallback; });
    thumb.addEventListener('click', () => { if (idx !== activeIndex) goToSlide(idx); });

    thumbsContainer.appendChild(thumb);
    thumbs.push(thumb);
  });

  /* ── Distância circular ── */
  function getDistance(idx, active, count) {
    let d = idx - active;
    if (d >  count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  }

  /* ── Posicionamento dos slides ──────────────────────────────
     O slide tem width: clamp(480px, 54vw, 900px).
     O vizinho está deslocado de ±(100vw / 2 + slideWidth / 2 - overlap).
     Com x: ±55vw, o centro do vizinho fica em 55vw do centro da tela,
     então somente ~(55vw - 50vw + slideWidth/2) fica visível.
  ────────────────────────────────────────────────────────── */
  function updateSlidePositions(animate = true, direction = 1) {
    const mobile = window.innerWidth <= 768;

    slides.forEach((slide, idx) => {
      const d = getDistance(idx, activeIndex, total);

      let x       = d > 0 ? '90vw' : '-90vw';
      let scale   = 0.7;
      let opacity = 0;
      let zIndex  = 1;
      let filter  = 'grayscale(1) brightness(0.25)';
      let ptr     = 'none';

      if (d === 0) {
        x       = '0vw';
        scale   = 1;
        opacity = 1;
        zIndex  = 4;
        filter  = 'none';
        ptr     = 'auto';
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');

        /* Leve fade-in do lado certo ao ativar */
        if (animate && !reducedMotion) {
          const frame = slide.querySelector('.browser-frame');
          if (frame) {
            gsap.fromTo(frame,
              { rotateY: direction * 4, scale: 0.97 },
              { rotateY: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
            );
          }
        }
      } else if (Math.abs(d) === 1) {
        /* Vizinho: parcialmente visível na borda */
        x       = d > 0
          ? (mobile ? '55vw' : '57vw')
          : (mobile ? '-55vw' : '-57vw');
        scale   = 0.88;
        opacity = 0.5;
        zIndex  = 2;
        filter  = 'grayscale(0.8) brightness(0.4)';
        ptr     = 'auto';
        slide.classList.remove('is-active');
        slide.setAttribute('aria-hidden', 'true');
      } else {
        slide.classList.remove('is-active');
        slide.setAttribute('aria-hidden', 'true');
      }

      if (animate && !reducedMotion) {
        gsap.to(slide, {
          xPercent: -50, yPercent: -50,
          x, scale, opacity, zIndex, filter,
          duration: 0.85,
          ease: 'power3.inOut',
          onStart: () => { slide.style.pointerEvents = ptr; },
        });
      } else {
        gsap.set(slide, { xPercent: -50, yPercent: -50, x, scale, opacity, zIndex, filter });
        slide.style.pointerEvents = ptr;
      }
    });
  }

  /* ── Scroll vertical automático na screenshot ativa ── */
  function startActiveScreenScroll() {
    if (activeScrollTween) { activeScrollTween.kill(); activeScrollTween = null; }

    slides.forEach((slide, idx) => {
      const img = slide.querySelector('.project-screen-img');
      if (idx !== activeIndex && img) gsap.set(img, { y: 0 });
    });

    if (reducedMotion) return;

    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    const screen = activeSlide.querySelector('.browser-screen');
    const img    = activeSlide.querySelector('.project-screen-img');
    if (!screen || !img) return;

    requestAnimationFrame(() => {
      const screenH = screen.clientHeight;
      const imgH    = img.naturalHeight && img.naturalWidth
        ? (img.naturalHeight / img.naturalWidth) * screen.clientWidth
        : img.clientHeight;
      const dist = Math.max(0, imgH - screenH);

      if (dist > 15) {
        activeScrollTween = gsap.fromTo(img,
          { y: 0 },
          { y: -dist, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 }
        );
      } else {
        gsap.set(img, { y: 0 });
      }
    });
  }

  /* ── Textos e miniaturas ── */
  function updateProjectInfo(animate = true) {
    const proj = projects[activeIndex];
    if (!proj) return;

    thumbs.forEach((t, i) => {
      t.classList.toggle('is-active', i === activeIndex);
      const prog = t.querySelector('.thumb-progress');
      if (prog && i !== activeIndex) gsap.set(prog, { scaleX: 0 });
    });

    thumbs[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    if (counterEl) {
      counterEl.textContent =
        `${String(activeIndex + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    }

    if (viewProjectBtn) {
      viewProjectBtn.href = proj.url;
      const btnSpan = viewProjectBtn.querySelector('span:first-child');
      if (proj.url.startsWith('#')) {
        viewProjectBtn.removeAttribute('target');
        viewProjectBtn.removeAttribute('rel');
        if (btnSpan) btnSpan.textContent = 'Fazer meu orçamento';
      } else {
        viewProjectBtn.setAttribute('target', '_blank');
        viewProjectBtn.setAttribute('rel', 'noopener noreferrer');
        if (btnSpan) btnSpan.textContent = 'Ver projeto';
      }
    }

    const infoEls = [categoryEl, nameEl, descEl].filter(Boolean);

    function applyContent() {
      if (categoryEl) categoryEl.textContent = proj.category;
      if (nameEl)     nameEl.textContent     = proj.name;
      if (descEl)     descEl.textContent     = proj.description;
    }

    if (animate && !reducedMotion) {
      gsap.to(infoEls, {
        y: -12, opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: () => {
          applyContent();
          gsap.fromTo(infoEls,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
          );
        },
      });
    } else {
      applyContent();
      gsap.set(infoEls, { y: 0, opacity: 1 });
    }
  }

  /* ── Autoplay ── */
  function startAutoplay() {
    if (autoplayTween) { autoplayTween.kill(); autoplayTween = null; }
    if (reducedMotion || isPausedByUser) return;

    const progressBar = thumbs[activeIndex]?.querySelector('.thumb-progress');
    if (!progressBar) return;

    autoplayTween = gsap.fromTo(progressBar,
      { scaleX: 0 },
      { scaleX: 1, duration: 7, ease: 'none', onComplete: nextSlide }
    );

    if (isHovered || isFocused || !isVisibleOnScreen) autoplayTween.pause();
  }

  function pauseAutoplay()  { autoplayTween?.pause();   activeScrollTween?.pause();  }
  function resumeAutoplay() {
    if (isPausedByUser || reducedMotion) return;
    if (!isHovered && !isFocused && isVisibleOnScreen) {
      autoplayTween?.resume();
      activeScrollTween?.resume();
    }
  }

  /* ── Navegação ── */
  function goToSlide(newIndex, dir = 1) {
    if (isAnimating) return;
    isAnimating = true;
    activeIndex = (newIndex + total) % total;
    updateSlidePositions(true, dir);
    updateProjectInfo(true);
    startActiveScreenScroll();
    startAutoplay();
    setTimeout(() => { isAnimating = false; }, 900);
  }

  function nextSlide() { goToSlide(activeIndex + 1,  1); }
  function prevSlide() { goToSlide(activeIndex - 1, -1); }

  prevBtn?.addEventListener('click', prevSlide);
  nextBtn?.addEventListener('click', nextSlide);

  stage.addEventListener('click', (e) => {
    const slide = e.target.closest('.project-slide');
    if (!slide || e.target.closest('.badge-live')) return;
    const idx = parseInt(slide.dataset.index, 10);
    const d   = getDistance(idx, activeIndex, total);
    if (d ===  1) nextSlide();
    else if (d === -1) prevSlide();
  });

  playPauseBtn?.addEventListener('click', () => {
    isPausedByUser = !isPausedByUser;
    playPauseBtn.setAttribute('aria-pressed', String(isPausedByUser));
    playPauseBtn.setAttribute('aria-label',
      isPausedByUser ? 'Retomar rotação automática' : 'Pausar rotação automática');
    playPauseBtn.innerHTML = isPausedByUser
      ? `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
      : `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    isPausedByUser ? pauseAutoplay() : startAutoplay();
  });

  stageWrapper.addEventListener('mouseenter', () => { isHovered = true;  pauseAutoplay();  });
  stageWrapper.addEventListener('mouseleave', () => { isHovered = false; resumeAutoplay(); });
  section.addEventListener('focusin',  () => { isFocused = true;  pauseAutoplay();  });
  section.addEventListener('focusout', () => { isFocused = false; resumeAutoplay(); });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisibleOnScreen = entry.isIntersecting;
      isVisibleOnScreen ? resumeAutoplay() : pauseAutoplay();
    });
  }, { threshold: 0.15 });
  io.observe(section);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? pauseAutoplay() : resumeAutoplay();
  });

  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prevSlide(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
  });

  /* ── Swipe / Drag ── */
  let pStartX = 0, pStartY = 0;

  stageWrapper.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    pStartX = e.clientX; pStartY = e.clientY;
    isPointerDown = true;
  });

  stageWrapper.addEventListener('pointerup', (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const dx = e.clientX - pStartX;
    const dy = e.clientY - pStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? nextSlide() : prevSlide();
    }
  });

  stageWrapper.addEventListener('pointercancel', () => { isPointerDown = false; });

  /* ── Tilt suave (desktop fine pointer) ── */
  let tX = 0, tY = 0, cX = 0, cY = 0, tG = 0, cG = 0;

  function onTiltMove(e) {
    if (isPointerDown || isAnimating || reducedMotion || !isFinePointer) return;
    const rect = stageWrapper.getBoundingClientRect();
    const xRel = (e.clientX - rect.left)  / rect.width  - 0.5;
    const yRel = (e.clientY - rect.top)   / rect.height - 0.5;
    tY = xRel * 6;
    tX = -yRel * 3;
    tG = -xRel * 12;
  }

  function onTiltLeave() { tX = 0; tY = 0; tG = 0; }

  if (isFinePointer && !reducedMotion) {
    stageWrapper.addEventListener('mousemove', onTiltMove);
    stageWrapper.addEventListener('mouseleave', onTiltLeave);

    (function tickTilt() {
      if (!isAnimating && !isPointerDown) {
        cX += (tX - cX) * 0.07;
        cY += (tY - cY) * 0.07;
        cG += (tG - cG) * 0.07;

        const activeSlide = slides[activeIndex];
        if (activeSlide) {
          const frame = activeSlide.querySelector('.browser-frame');
          const glare = activeSlide.querySelector('.screen-glare');
          if (frame) {
            frame.style.transform = `perspective(1200px) rotateX(${cX.toFixed(2)}deg) rotateY(${cY.toFixed(2)}deg)`;
          }
          if (glare) {
            glare.style.transform = `translateX(${cG.toFixed(2)}%)`;
          }
        }
      }
      requestAnimationFrame(tickTilt);
    })();
  }

  /* ── Efeito magnético no CTA ── */
  if (viewProjectBtn) {
    const R = 80, M = 10;
    viewProjectBtn.addEventListener('mousemove', (e) => {
      const rect = viewProjectBtn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width  / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < R) {
        const s = 1 - dist / R;
        gsap.to(viewProjectBtn, {
          x: dx * s * (M / (dist || 1)),
          y: dy * s * (M / (dist || 1)),
          duration: 0.3, ease: 'power2.out', overwrite: 'auto',
        });
      }
    });
    viewProjectBtn.addEventListener('mouseleave', () => {
      gsap.to(viewProjectBtn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.5)', overwrite: 'auto' });
    });
  }

  /* ── Animação de entrada ── */
  function initEntrance() {
    const title        = section.querySelector('.projetos-title');
    const tag          = section.querySelector('.projetos-tag');
    const headerDesc   = section.querySelector('.projetos-header-desc');
    const infoSection  = section.querySelector('.projetos-info');
    const thumbsSection= section.querySelector('.projetos-thumbs-wrapper');
    const activeSlide  = slides[activeIndex];
    const neighbors    = slides.filter((_, i) => i !== activeIndex);

    if (reducedMotion) {
      updateSlidePositions(false);
      updateProjectInfo(false);
      startActiveScreenScroll();
      return;
    }

    gsap.set(title, { y: '100%' });
    if (tag) gsap.set(tag, { opacity: 0, y: 20 });
    gsap.set(activeSlide, {
      xPercent: -50, yPercent: -50,
      x: '0vw', y: 40, scale: 0.94, opacity: 0,
    });
    gsap.set(neighbors, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set([infoSection, thumbsSection], { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 72%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          onComplete: () => { startActiveScreenScroll(); startAutoplay(); },
        });

        tl.to(title, { y: '0%', duration: 1.0, ease: 'power4.out' }, 0);
        if (tag) {
          tl.to(tag, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
        }
        tl.to(activeSlide, {
          xPercent: -50, yPercent: -50,
          x: '0vw', y: 0, scale: 1, opacity: 1,
          duration: 1.1, ease: 'power3.out',
        }, 0.3);
        tl.add(() => { updateSlidePositions(true); }, 0.55);
        tl.to([infoSection, thumbsSection], {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out',
        }, 0.65);
      },
    });
  }

  /* ── Bootstrap ── */
  updateSlidePositions(false);
  updateProjectInfo(false);
  initEntrance();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateSlidePositions(false);
      startActiveScreenScroll();
    }, 150);
  });
}
