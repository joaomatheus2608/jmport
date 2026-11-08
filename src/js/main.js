/**
 * main.js
 * Ponto de entrada: importa módulos, registra plugins e inicializa seções.
 * Splash removido – animação de entrada direta no Hero.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSmoothScroll } from './smooth-scroll.js';
import { initCursor }       from './cursor.js';
import { initAsciiField }   from './ascii-field.js';
import { initHero }         from './hero.js';
import { initConceito }     from './conceito.js';
import { initProjetos }     from './projetos.js';
import { initEcossistema }  from './ecossistema.js';
import { initSobre }        from './sobre.js';
import { initOrcamento }    from './orcamento.js';

// Registra o ScrollTrigger uma única vez globalmente
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // Rolagem com inércia suave em todo o site
  initSmoothScroll();

  // Cursor customizado (apenas pointer:fine)
  initCursor();

  // Canvas de fundo com campo de caracteres (Hero)
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) initAsciiField(canvas);

  // Seção 1: Hero (com animação de entrada própria)
  initHero();

  // Seção 2: Manifesto / Conceito
  initConceito();

  // Seção 3: Projetos
  initProjetos();

  // Seção 4: Ecossistema
  initEcossistema();

  // Seção 5: Sobre Mim
  initSobre();

  // Seção Final: Orçamento / Vamos Conversar
  initOrcamento();
});
