
const nav = typeof navigator !== 'undefined' ? navigator : { platform: '' };

export const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isMac = /Mac/.test(nav.platform);
