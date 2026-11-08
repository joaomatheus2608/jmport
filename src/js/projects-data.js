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
    slug: 'monster-energy',
    name: 'Monster Energy',
    category: 'LANDING PAGE · CONCEITO 3D',
    description: 'Landing page conceitual da Monster Energy: "Libere a fera", com visual ousado e interações imersivas.',
    tags: ['Web Design', '3D Concept', 'Branding', 'Interatividade'],
    url: 'https://www.instagram.com/reel/DfdkX5axS4n/?utm_source=ig_web_copy_link&vrfl=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==',
    image: '/assets/projetos/monster-energy.jpg',
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

/**
 * Cardápios Digitais / Delivery
 */
export const cardapios = [
  {
    slug: 'pizza-frita-ch',
    name: 'Pizza Frita do CH',
    category: 'CARDÁPIO DIGITAL · DELIVERY',
    description: 'Cardápio digital para delivery e pedidos online da Pizza Frita do CH.',
    tags: ['Delivery', 'Cardápio Digital', 'Fast Food'],
    url: 'https://pizzafritadoch.delivery',
    image: '/assets/projetos/pizza-frita-ch.jpg',
  },
  {
    slug: 'mago-sushi',
    name: 'Mago Sushi',
    category: 'CARDÁPIO DIGITAL · DELIVERY',
    description: 'Cardápio digital para delivery e retirada da Mago Sushi Artesanal.',
    tags: ['Delivery', 'Cardápio Digital', 'Sushi Japonês'],
    url: 'https://magosushi.delivery',
    image: '/assets/projetos/mago-sushi.jpg',
  },
  {
    slug: 'boy-degusta',
    name: 'Hamburgueria Boy Degusta',
    category: 'CARDÁPIO DIGITAL · DELIVERY',
    description: 'Cardápio digital para delivery da Hamburgueria Boy Degusta.',
    tags: ['Delivery', 'Cardápio Digital', 'Hamburgueria'],
    url: 'https://boydegusta.delivery',
    image: '/assets/projetos/boy-degusta.jpg',
  },
];
