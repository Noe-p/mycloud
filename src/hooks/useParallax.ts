/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

export type EasingName =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic';

export const EASING_FUNCTIONS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
};

export interface ParallaxConfig {
  ref: React.RefObject<HTMLElement>;
  /**
   * distance (px) parcourue pour 1 viewport height de scroll
   * >0 : sens normal, <0 : inverse
   */
  speed: number;
  /**
   * 'vertical' pour translateY, 'horizontal' pour translateX
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * nom de la fonction d'easing prédéfinie
   * @default 'linear'
   */
  easing?: EasingName;
}

/**
 * throttle: n’exécute pas plus d’une fois tous les wait ms
 */
function throttle<T extends any[]>(fn: (...args: T) => void, wait: number) {
  let last = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - last >= wait) {
      fn(...args);
      last = now;
    }
  };
}

/**
 * Hook Parallax
 * @param configs tableau de configs
 * @param throttleMs intervalle mini (ms) entre deux updates (0 = pas de throttle)
 */
export function useParallax(configs: ParallaxConfig[], throttleMs = 50) {
  useEffect(() => {
    // mets à jour la position de tous les éléments
    const update = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      // on calcule une progression 0→1 sur la base du scroll
      const rawProg = scrollY / vh;
      const prog = Math.min(Math.max(rawProg, 0), 1);

      configs.forEach((cfg) => {
        const el = cfg.ref.current;
        if (!el) return;

        const { speed, direction = 'vertical', easing = 'linear' } = cfg;
        // applique easing
        const eased = EASING_FUNCTIONS[easing](prog);
        const offset = speed * eased;

        const rect = el.getBoundingClientRect();
        // si visible (même partiellement)
        if (rect.bottom >= 0 && rect.top <= vh) {
          if (direction === 'horizontal') {
            el.style.transform = `translateX(${offset}px)`;
          } else {
            el.style.transform = `translateY(${offset}px)`;
          }
        } else {
          // reset quand hors viewport
          el.style.transform = 'translate(0, 0)';
        }
      });
    };

    const handler = throttleMs > 0 ? throttle(update, throttleMs) : update;

    window.addEventListener('scroll', handler);
    window.addEventListener('resize', update);

    // premier rendu → scrollY = 0 donc offset = 0
    update();

    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', update);
    };
  }, [configs, throttleMs]);
}
