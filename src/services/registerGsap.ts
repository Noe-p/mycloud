/* eslint-disable @typescript-eslint/no-explicit-any */
let cachedGsap: {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: any;
} | null = null;

export async function getGsap() {
  if (cachedGsap) return cachedGsap;

  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');

  if (!(gsap as any).core.globals().ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  cachedGsap = { gsap, ScrollTrigger };
  return cachedGsap;
}

export type GSAPContext = ReturnType<typeof import('gsap').gsap.context>;
