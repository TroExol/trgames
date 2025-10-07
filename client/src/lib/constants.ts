export const API_CONFIG = {
  development: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001',
    cryptozPath: '/cryptoz',
  },
  production: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://troexol.ru',
    cryptozPath: '/cryptoz',
  },
} as const;

export const getApiUrl = (path = '') => {
  const config = import.meta.env.DEV ? API_CONFIG.development : API_CONFIG.production;
  return `${config.baseUrl}${config.cryptozPath}${path}`;
};
