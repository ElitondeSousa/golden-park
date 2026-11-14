/** Detecção de WebGL fora do módulo 3D: a página decide o mapa sem baixar o three.js. */
/** WebGL disponível? (jsdom e aparelhos sem GPU caem no mapa 2D) */
export function temWebGL(): boolean {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (navigator.userAgent.includes('jsdom')) return false;
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

