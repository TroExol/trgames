export const getAssetUrl = (path: string) => new URL(`/src/assets/${path}`, import.meta.url).href;
