import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
let stage = null;
export const setStage = (s) => (stage = s);

export function startLenis() {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
  };
}

const GLIDE = { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) };

export function scrollToY(y, opts) {
  if (lenis) lenis.scrollTo(y, { ...GLIDE, ...opts, force: true });
  else window.scrollTo({ top: y });
}

export function scrollToTarget(selector) {
  if (selector === '#top') return stage.go(0);
  if (selector === '#flavours') return stage.go(1);
  const el = document.querySelector(selector);
  if (!el) return;
  stage.leave();
  // land just past the drips hanging from the section above
  const offset = el.matches('#story, #find-us') ? Math.min(170, window.innerWidth * 0.1) : 0;
  if (lenis) lenis.scrollTo(el, { ...GLIDE, offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
}
