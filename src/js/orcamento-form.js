/**
 * orcamento-form.js
 * Formulário em etapas para captação via tráfego pago.
 * – 5 perguntas (nome, whatsapp, tipo, ramo, investimento)
 * – Validação obrigatória com feedback claro
 * – Máscara de telefone BR com validação de DDD + 8/9 dígitos
 * – Resumo e link formatado para WhatsApp com encodeURIComponent
 * – Armazenamento local de backup (localStorage) para nunca perder leads
 * – Disparo de eventos de conversão (Meta Pixel, Google Tag/GA4, GTM)
 * – Ribbon Glow no fundo do card
 */

import { initRibbonGlow } from './ribbon-glow.js';

// ─── CONFIGURAÇÃO ────────────────────────────────────────
// Número de atendimento do Matheus (profissional com DDI e DDD)
const WPP_NUMBER = '5581987279848';
const TOTAL_STEPS = 5;
const STORAGE_KEY = 'jm_leads_orcamento';

// ─── STATE ───────────────────────────────────────────────
const answers = {
  nome: '',
  whatsapp: '',
  tipo: '',
  ramo: '',
  investimento: '',
  timestamp: null,
};
let currentStep = 1;

// ─── ELEMENTOS ───────────────────────────────────────────
const steps = document.querySelectorAll('.orc-step');
const progressBar = document.getElementById('orc-progress-bar');
const progressLbl = document.getElementById('orc-progress-label');

// ─── BARRA DE PROGRESSO ──────────────────────────────────
function updateProgress() {
  if (!progressBar || !progressLbl) return;

  if (currentStep === 'summary' || currentStep > TOTAL_STEPS) {
    progressBar.style.width = '100%';
    progressLbl.textContent = `${TOTAL_STEPS} / ${TOTAL_STEPS}`;
  } else {
    const pct = Math.max(10, Math.round(((currentStep - 1) / TOTAL_STEPS) * 100));
    progressBar.style.width = `${pct}%`;
    progressLbl.textContent = `${currentStep} / ${TOTAL_STEPS}`;
  }
}

// ─── EXIBE A ETAPA ───────────────────────────────────────
function showStep(n) {
  steps.forEach((s) => s.classList.remove('active'));
  const target = document.querySelector(`.orc-step[data-step="${n}"]`);
  if (target) {
    target.classList.add('active');
    // Foca suavemente no input da etapa
    const input = target.querySelector('input');
    if (input) {
      setTimeout(() => input.focus(), 80);
    }
  }
  updateProgress();
  savePartialLead();
}

// ─── AVANÇAR / VOLTAR ────────────────────────────────────
function goNext() {
  if (typeof currentStep === 'number' && !validateStep(currentStep)) {
    return;
  }

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    showStep(currentStep);
  } else {
    // Última etapa concluída -> exibe resumo para confirmação
    currentStep = 'summary';
    buildSummary();
    showStep('summary');
  }
}

function goBack() {
  if (currentStep === 'summary') {
    currentStep = TOTAL_STEPS;
  } else if (typeof currentStep === 'number' && currentStep > 1) {
    currentStep--;
  }
  showStep(currentStep);
}

// ─── VALIDAÇÃO ───────────────────────────────────────────
function showError(stepN, msg) {
  const errorEl = document.getElementById(`orc-error-${stepN}`);
  const inputEl = document.getElementById(`orc-input-${stepN}`);
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }
  if (inputEl) {
    inputEl.classList.add('has-error');
    inputEl.focus();
  }
}

function clearError(stepN) {
  const errorEl = document.getElementById(`orc-error-${stepN}`);
  const inputEl = document.getElementById(`orc-input-${stepN}`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  if (inputEl) {
    inputEl.classList.remove('has-error');
  }
}

function validateStep(n) {
  clearError(n);

  if (n === 1) {
    const val = answers.nome.trim();
    if (!val || val.length < 2) {
      showError(1, 'Por favor, digite seu nome para continuarmos.');
      return false;
    }
  }

  if (n === 2) {
    const digits = answers.whatsapp.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      showError(2, 'Informe seu WhatsApp com DDD (ex.: 81 99999-9999).');
      return false;
    }
  }

  if (n === 3 && !answers.tipo) {
    showError(3, 'Por favor, selecione uma das opções acima.');
    return false;
  }

  if (n === 4) {
    const val = answers.ramo.trim();
    if (!val || val.length < 2) {
      showError(4, 'Informe qual é o seu ramo ou tipo de negócio.');
      return false;
    }
  }

  if (n === 5 && !answers.investimento) {
    showError(5, 'Selecione uma faixa estimada de investimento.');
    return false;
  }

  return true;
}

// ─── MÁSCARA TELEFONE (PADRÃO BRASIL) ────────────────────
function maskPhone(value) {
  let d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

// ─── SALVAMENTO DE SEGURANÇA DO LEAD ─────────────────────
function savePartialLead() {
  try {
    answers.timestamp = new Date().toISOString();
    localStorage.setItem('jm_current_lead', JSON.stringify(answers));

    // Salva na lista acumulada de leads
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const existingIdx = history.findIndex(
      (h) => h.whatsapp === answers.whatsapp && answers.whatsapp.length > 8
    );
    if (existingIdx >= 0) {
      history[existingIdx] = { ...history[existingIdx], ...answers };
    } else if (answers.nome || answers.whatsapp) {
      history.push({ ...answers });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Não foi possível gravar backup local:', err);
  }
}

// ─── RESUMO ──────────────────────────────────────────────
function buildSummary() {
  const sumNome = document.getElementById('sum-nome');
  const sumWpp = document.getElementById('sum-whatsapp');
  const sumTipo = document.getElementById('sum-tipo');
  const sumRamo = document.getElementById('sum-ramo');
  const sumInv = document.getElementById('sum-investimento');

  if (sumNome) sumNome.textContent = answers.nome || '-';
  if (sumWpp) sumWpp.textContent = answers.whatsapp || '-';
  if (sumTipo) sumTipo.textContent = answers.tipo || '-';
  if (sumRamo) sumRamo.textContent = answers.ramo || '-';
  if (sumInv) sumInv.textContent = answers.investimento || '-';

  // Atualiza link direto de clique do botão
  const btnConfirm = document.getElementById('orc-btn-confirm');
  if (btnConfirm) {
    btnConfirm.href = buildWppLink();
  }
}

// ─── MENSAGEM DO WHATSAPP ────────────────────────────────
function buildWppLink() {
  const text = `Olá! Preenchi o formulário e quero terminar meu atendimento.\n\nNome: ${answers.nome}\nTipo de site: ${answers.tipo}\nRamo: ${answers.ramo}\nInvestimento: ${answers.investimento}`;
  return `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// ─── DISPARO DE CONVERSÃO ────────────────────────────────
function fireConversionEvent() {
  // Salva confirmação de lead finalizado
  savePartialLead();

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: 'Formulário Orçamento Rápido',
      currency: 'BRL',
    });
  }

  // Google Tag / GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', {
      event_category: 'orcamento',
      event_label: answers.tipo || 'whatsapp',
      value: 1,
    });
  }

  // Google Tag Manager dataLayer
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'lead_form_submitted',
      formName: 'orcamento_rapido',
      leadTipo: answers.tipo,
      leadInvestimento: answers.investimento,
    });
  }
}

// ─── BIND DE EVENTOS ─────────────────────────────────────
function bindEvents() {
  // 1. Campo Nome
  const inputNome = document.getElementById('orc-input-1');
  if (inputNome) {
    inputNome.addEventListener('input', (e) => {
      answers.nome = e.target.value;
      clearError(1);
    });
    inputNome.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    });
  }

  // 2. Campo WhatsApp com máscara
  const inputWpp = document.getElementById('orc-input-2');
  if (inputWpp) {
    inputWpp.addEventListener('input', (e) => {
      const masked = maskPhone(e.target.value);
      e.target.value = masked;
      answers.whatsapp = masked;
      clearError(2);
    });
    inputWpp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    });
  }

  // 3. Escolha do tipo de site (avança suavemente ao clicar)
  document.querySelectorAll('[data-choice="tipo"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-choice="tipo"]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers.tipo = btn.dataset.value;
      clearError(3);
      // Avança automaticamente após breve feedback visual
      setTimeout(() => {
        if (currentStep === 3) goNext();
      }, 200);
    });
  });

  // 4. Campo Ramo/Negócio
  const inputRamo = document.getElementById('orc-input-4');
  if (inputRamo) {
    inputRamo.addEventListener('input', (e) => {
      answers.ramo = e.target.value;
      clearError(4);
    });
    inputRamo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    });
  }

  // 5. Escolha de Investimento (avança suavemente ao clicar)
  document.querySelectorAll('[data-choice="investimento"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-choice="investimento"]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers.investimento = btn.dataset.value;
      clearError(5);
      // Avança automaticamente após breve feedback visual
      setTimeout(() => {
        if (currentStep === 5) goNext();
      }, 200);
    });
  });

  // Botões "Continuar" em cada tela
  document.querySelectorAll('.orc-btn-next').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goNext();
    });
  });

  // Botões "Voltar"
  document.querySelectorAll('.orc-btn-back').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goBack();
    });
  });

  // Botão final "Confirmar formulário"
  const confirmBtn = document.getElementById('orc-btn-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      fireConversionEvent();
      // O link href já está preenchido pelo buildSummary/buildWppLink
    });
  }
}

// ─── RIBBON GLOW EFFECT ──────────────────────────────────
function initGlow() {
  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;

  // Ribbon Glow no card do formulário
  const cardCanvas = document.getElementById('orc-card-canvas');
  const cardEl = document.getElementById('orc-card');
  if (cardCanvas && cardEl) {
    initRibbonGlow(cardCanvas, cardEl, {
      background: '#050505',
      color1: '#FFFFFF',
      color2: '#909090',
      speed: isMobile ? 30 : 45,
      size: 100,
      angle: -180,
      hover: 90,
      reach: 240,
    });
  }

  // Fundo sutil apenas no desktop para manter leveza no mobile
  const bgCanvas = document.getElementById('orc-canvas');
  if (bgCanvas && !isMobile) {
    initRibbonGlow(bgCanvas, document.body, {
      background: '#050505',
      color1: '#262626',
      color2: '#121212',
      speed: 25,
      size: 140,
      angle: -150,
      hover: 40,
      reach: 300,
    });
  } else if (bgCanvas) {
    bgCanvas.style.display = 'none';
  }
}

// ─── INICIALIZAÇÃO ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showStep(1);
  bindEvents();
  initGlow();
});
