/**
 * projects-data.js
 * Dados dos projetos em exibição no portfólio.
 * Única fonte de verdade: 4 projetos em rotação.
 */

export const projects = [
  {
    slug: 'scale-company',
    name: 'Scale Company',
    category: 'SITE INSTITUCIONAL · AGÊNCIA',
    description: 'Portfólio oficial da Scale: agência de design e desenvolvimento focada em sites interativos e de alta performance.',
    tags: ['Web Design', 'UI/UX', 'GSAP', 'Performance'],
    url: 'https://agenciascale.netlify.app',
    image: '/assets/projetos/scale-company.jpg',
  },
  {
    slug: 'banco-itau-teste',
    name: 'Banco Itaú — Concept',
    category: 'LANDING PAGE · CONCEITO',
    description: 'Landing page conceitual desenvolvida para o Banco Itaú, com estética arrojada e foco em criação de conteúdo.',
    tags: ['Fintech', 'Landing Page', 'Animação', 'Conversão'],
    url: 'https://testeitau.netlify.app',
    image: '/assets/projetos/banco-itau.jpg',
  },
  {
    slug: 'michael-jackson',
    name: 'Michael Jackson Tribute',
    category: 'SITE TRIBUTO · MÚSICA',
    description: 'Uma carreira em cinco atos: homenagem interativa aos momentos mais icônicos do Rei do Pop.',
    tags: ['Storytelling', 'Cards 3D', 'Interatividade', 'Editorial'],
    url: 'https://michaeljacksonscale.netlify.app',
    image: '/assets/projetos/michael-jackson.jpg',
  },
  {
    slug: 'seu-projeto',
    name: 'O Seu Projeto',
    category: 'SEU SITE · SOB MEDIDA',
    description: 'O próximo projeto no ar pode ser o seu. Vamos construir uma página rápida, sob medida e pronta para vender.',
    tags: ['Feito Sob Medida', 'Alta Conversão', 'SEO', 'Ultra Rápido'],
    url: '#orcamento',
    image: '/assets/projetos/seu-projeto.svg',
  },
];
