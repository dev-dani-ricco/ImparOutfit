export const demoImages = {
  bomber: require('../../assets/demo/bomber-lilas.png'),
  dress: require('../../assets/demo/vestido-esmeralda.png'),
  sneakers: require('../../assets/demo/tenis-lavanda.png'),
  bag: require('../../assets/demo/bolsa-caramelo.png'),
  collection: require('../../assets/demo/colecao-essencial.png'),
};

export const initialWardrobe = [
  { id: 'wardrobe-bomber', name: 'Bomber Nuvem Lilás', category: 'Jaquetas', color: 'Lilás', size: 'M', source: 'Ateliê Aurora', image: demoImages.bomber },
  { id: 'wardrobe-dress', name: 'Vestido Esmeralda', category: 'Vestidos', color: 'Verde', size: 'M', source: 'Meu armário', image: demoImages.dress },
  { id: 'wardrobe-sneakers', name: 'Tênis Horizonte', category: 'Calçados', color: 'Creme e lavanda', size: '38', source: 'Studio Ímpar', image: demoImages.sneakers },
  { id: 'wardrobe-bag', name: 'Bolsa Traço', category: 'Acessórios', color: 'Caramelo', size: 'Único', source: 'Casa Lume', image: demoImages.bag },
];

export const demoFeed = [
  { id: 'feed-look', type: 'LOOK', label: 'Look do dia', title: 'Cores que conversam', author: 'Marina Alves', description: 'Lavanda, verde profundo e neutros para uma semana versátil.', image: demoImages.collection, likes: 1284, saves: 319 },
  { id: 'feed-bomber', type: 'PEÇA', label: 'Lançamento', title: 'Bomber Nuvem Lilás', author: 'Ateliê Aurora', description: 'Volume confortável e acabamento acetinado para meia-estação.', image: demoImages.bomber, likes: 742, saves: 168 },
  { id: 'feed-dress', type: 'VITRINE', label: 'Vitrine em destaque', title: 'Noite Esmeralda', author: 'Casa Lume', description: 'Uma seleção elegante para eventos e encontros especiais.', image: demoImages.dress, likes: 956, saves: 241 },
];

export const demoStores = [
  { id: 'store-aurora', store_name: 'Ateliê Aurora', category: 'Moda contemporânea', location: 'São Paulo, SP', followers: 18400, image: demoImages.collection },
  { id: 'store-lume', store_name: 'Casa Lume', category: 'Festa e acessórios', location: 'Belo Horizonte, MG', followers: 12300, image: demoImages.dress },
  { id: 'store-impar', store_name: 'Studio Ímpar', category: 'Casual urbano', location: 'Curitiba, PR', followers: 9700, image: demoImages.sneakers },
];

export const initialShowcases = [
  { id: 'showcase-essential', title: 'Essenciais em Cores', store_name: 'Ateliê Aurora', description: 'Cinco combinações para multiplicar as possibilidades do armário.', pieces: 12, rating: 4.9, image: demoImages.collection },
  { id: 'showcase-night', title: 'Noite Esmeralda', store_name: 'Casa Lume', description: 'Vestidos e acessórios em tons profundos para ocasiões especiais.', pieces: 8, rating: 4.8, image: demoImages.dress },
  { id: 'showcase-weekend', title: 'Fim de Semana Leve', store_name: 'Studio Ímpar', description: 'Conforto, cor e movimento em uma seleção casual.', pieces: 10, rating: 4.7, image: demoImages.sneakers },
];

export const demoEngagement = [
  { id: 'eng-1', name: 'Marina Alves', item_name: 'Bomber Nuvem Lilás', when: 'há 8 min' },
  { id: 'eng-2', name: 'Rafa Oliveira', item_name: 'Vestido Esmeralda', when: 'há 24 min' },
  { id: 'eng-3', name: 'Camila Nunes', item_name: 'Bolsa Traço', when: 'há 1 h' },
];
