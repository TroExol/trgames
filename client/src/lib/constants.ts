const baseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:4001`;

export const getCryptozUrl = (path = '') => `${baseUrl}/cryptoz${path}`;

export const getLucidUrl = (path = '') => `${baseUrl}/lucid${path}`;
