export const API_CONFIG = {
  development: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001',
    cryptozPath: '/cryptoz',
    lucidPath: '/lucid',
  },
  production: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://troexol.ru',
    cryptozPath: '/cryptoz',
    lucidPath: '/lucid',
  },
} as const;

export const getApiUrl = (path = '') => {
  const config = import.meta.env.DEV ? API_CONFIG.development : API_CONFIG.production;
  return `${config.baseUrl}${config.cryptozPath}${path}`;
};

export const getLucidUrl = (path = '') => {
  const config = import.meta.env.DEV ? API_CONFIG.development : API_CONFIG.production;

  return `${config.baseUrl}${config.lucidPath}${path}`;
};
