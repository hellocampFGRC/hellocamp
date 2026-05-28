import 'server-only';

// Mapeia os idiomas para os ficheiros JSON correspondentes
const dictionaries = {
  pt: () => import('../dictionaries/pt.json').then((module) => module.default),
  en: () => import('../dictionaries/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'pt' | 'en') => {
  // Se o idioma não for pt ou en, força o pt por segurança
  const getDict = dictionaries[locale] || dictionaries.pt;
  return getDict();
};