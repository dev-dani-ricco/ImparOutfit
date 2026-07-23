export const demoImages = {
  bomber: require('../../assets/demo/bomber-lilas.png'),
  dress: require('../../assets/demo/vestido-esmeralda.png'),
  sneakers: require('../../assets/demo/tenis-lavanda.png'),
  bag: require('../../assets/demo/bolsa-caramelo.png'),
  collection: require('../../assets/demo/colecao-essencial.png'),
};

export const wardrobeCategories = [
  { id: 'tops', label: 'Parte de cima', examples: 'Blusas, camisas e jaquetas' },
  { id: 'bottoms', label: 'Parte de baixo', examples: 'Calças, saias e shorts' },
  { id: 'dresses', label: 'Peça única', examples: 'Vestidos e macacões' },
  { id: 'shoes', label: 'Calçados', examples: 'Tênis, botas e sandálias' },
  { id: 'accessories', label: 'Acessórios', examples: 'Bolsas, cintos e joias' },
];

export const initialWardrobe = [
  {
    id: 'wardrobe-bomber',
    name: 'Bomber Nuvem Lilás',
    categoryId: 'tops',
    category: 'Parte de cima',
    subcategory: 'Jaqueta',
    color: 'Lilás',
    size: 'M',
    source: 'Ateliê Aurora',
    image: demoImages.bomber,
    model3d: { id: '3d-bomber', status: 'ready', angles: 24 },
  },
  {
    id: 'wardrobe-dress',
    name: 'Vestido Esmeralda',
    categoryId: 'dresses',
    category: 'Peça única',
    subcategory: 'Vestido',
    color: 'Verde',
    size: 'M',
    source: 'Meu armário',
    image: demoImages.dress,
    model3d: { id: '3d-dress', status: 'ready', angles: 28 },
  },
  {
    id: 'wardrobe-sneakers',
    name: 'Tênis Horizonte',
    categoryId: 'shoes',
    category: 'Calçados',
    subcategory: 'Tênis',
    color: 'Creme e lavanda',
    size: '38',
    source: 'Studio Ímpar',
    image: demoImages.sneakers,
    model3d: { id: '3d-sneakers', status: 'ready', angles: 32 },
  },
  {
    id: 'wardrobe-bag',
    name: 'Bolsa Traço',
    categoryId: 'accessories',
    category: 'Acessórios',
    subcategory: 'Bolsa',
    color: 'Caramelo',
    size: 'Único',
    source: 'Casa Lume',
    image: demoImages.bag,
    model3d: { id: '3d-bag', status: 'ready', angles: 24 },
  },
];

export const demoFeed = [
  {
    id: 'feed-look',
    type: 'LOOK',
    label: 'Look do dia',
    title: 'Cores que conversam',
    author: 'Marina Alves',
    description: 'Lavanda, verde profundo e neutros para uma semana versátil.',
    image: demoImages.collection,
    likes: 1284,
    favorites: 319,
  },
  {
    id: 'feed-bomber',
    type: 'PEÇA',
    label: 'Lançamento',
    title: 'Bomber Nuvem Lilás',
    author: 'Ateliê Aurora',
    description: 'Volume confortável e acabamento acetinado para meia-estação.',
    image: demoImages.bomber,
    likes: 742,
    favorites: 168,
  },
  {
    id: 'feed-dress',
    type: 'DESTAQUE',
    label: 'Coleção patrocinada',
    title: 'Noite Esmeralda',
    author: 'Casa Lume',
    description: 'Uma seleção elegante para eventos e encontros especiais.',
    image: demoImages.dress,
    likes: 956,
    favorites: 241,
  },
];

export const demoStores = [
  {
    id: 'store-aurora',
    store_name: 'Ateliê Aurora',
    initials: 'AA',
    tagline: 'Forma, cor e movimento',
    category: 'Moda contemporânea',
    location: 'São Paulo, SP',
    followers: 18400,
    brandColor: '#6E3155',
    cover: demoImages.collection,
    items: [
      { id: 'aurora-1', name: 'Bomber Nuvem Lilás', category: 'Jaquetas', price: 'R$ 489', image: demoImages.bomber },
      { id: 'aurora-2', name: 'Vestido Horizonte', category: 'Vestidos', price: 'R$ 629', image: demoImages.dress },
      { id: 'aurora-3', name: 'Bolsa Traço', category: 'Acessórios', price: 'R$ 349', image: demoImages.bag },
    ],
  },
  {
    id: 'store-lume',
    store_name: 'Casa Lume',
    initials: 'CL',
    tagline: 'Elegância para ocasiões especiais',
    category: 'Festa e acessórios',
    location: 'Belo Horizonte, MG',
    followers: 12300,
    brandColor: '#174D3B',
    cover: demoImages.dress,
    items: [
      { id: 'lume-1', name: 'Vestido Esmeralda', category: 'Vestidos', price: 'R$ 749', image: demoImages.dress },
      { id: 'lume-2', name: 'Bolsa Traço', category: 'Acessórios', price: 'R$ 329', image: demoImages.bag },
    ],
  },
  {
    id: 'store-impar',
    store_name: 'Studio Ímpar',
    initials: 'SÍ',
    tagline: 'O essencial fora do óbvio',
    category: 'Casual urbano',
    location: 'Curitiba, PR',
    followers: 9700,
    brandColor: '#765D9D',
    cover: demoImages.sneakers,
    items: [
      { id: 'impar-1', name: 'Tênis Horizonte', category: 'Calçados', price: 'R$ 419', image: demoImages.sneakers },
      { id: 'impar-2', name: 'Bomber Nuvem Lilás', category: 'Jaquetas', price: 'R$ 459', image: demoImages.bomber },
    ],
  },
];

export const sponsoredCollections = [
  {
    id: 'showcase-essential',
    title: 'Essenciais em Cores',
    store_name: 'Ateliê Aurora',
    campaign: 'Lançamento de inverno',
    description: 'Cinco combinações para multiplicar as possibilidades do armário.',
    pieces: 12,
    rating: 4.9,
    image: demoImages.collection,
  },
  {
    id: 'showcase-night',
    title: 'Noite Esmeralda',
    store_name: 'Casa Lume',
    campaign: 'Seleção patrocinada',
    description: 'Vestidos e acessórios em tons profundos para ocasiões especiais.',
    pieces: 8,
    rating: 4.8,
    image: demoImages.dress,
  },
  {
    id: 'showcase-weekend',
    title: 'Fim de Semana Leve',
    store_name: 'Studio Ímpar',
    campaign: 'Novidades da marca',
    description: 'Conforto, cor e movimento em uma seleção casual.',
    pieces: 10,
    rating: 4.7,
    image: demoImages.sneakers,
  },
];

// Compatibilidade com a tela antiga durante a migração.
export const initialShowcases = sponsoredCollections;

export const initialPersonalCollections = [
  {
    id: 'personal-work',
    title: 'Semana de trabalho',
    occasion: 'Profissional',
    itemIds: ['wardrobe-bomber', 'wardrobe-dress', 'wardrobe-bag'],
    image: demoImages.collection,
  },
  {
    id: 'personal-weekend',
    title: 'Fim de semana confortável',
    occasion: 'Casual',
    itemIds: ['wardrobe-sneakers', 'wardrobe-bomber'],
    image: demoImages.sneakers,
  },
];

export const initialProfile = {
  name: 'Marina Alves',
  age: '34',
  profession: 'Consultora de negócios',
  bodyShape: 'Ampulheta',
  mannequinTop: 'M / 40',
  mannequinBottom: '42',
  bust: '94',
  waist: '76',
  hips: '104',
  height: '168',
};
