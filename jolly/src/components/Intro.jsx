import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { dripPath } from './FlavorJourney.jsx';

// The page opens under a sheet of cream that lifts away, dripping as it goes.
let resolveDone;
export const introDone = new Promise((r) => (resolveDone = r));

const DRIPS = Array.from({ length: 11 }, (_, k) => ({
  x: (k + 0.3 + ((k * 37) % 10) / 25) / 11,
  w: 0.03 + ((k * 13) % 7) / 140,
  len: 0.4 + ((k * 29) % 10) / 16,
  phase: k * 1.7
})).sort((a, b) => b.x - a.x);

export default function Intro({ reduced }) {
  const root = useRef(null);
  const path = useRef(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    if (reduced) {
      resolveDone();
      setGone(true);
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const state = { p: 1 };
    const draw = () => path.current?.setAttribute('d', dripPath(w, h, state.p, DRIPS));
    draw();
    document.documentElement.classList.add('is-intro');

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.classList.remove('is-intro');
        setGone(true);
      }
    });
    tl.fromTo('.intro-char', { yPercent: 120, rotate: 12 }, { yPercent: 0, rotate: 0, duration: 0.7, stagger: 0.06, ease: 'back.out(2)' })
      .fromTo(['.intro-sub', '.intro-note'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, '-=0.3')
      .to('.intro-word', { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.35')
      .add(() => resolveDone(), '-=0.1')
      .to(state, { p: 0, duration: 1.25, ease: 'power3.inOut', onUpdate: draw }, '-=0.15');
    return () => {
      tl.kill();
      document.documentElement.classList.remove('is-intro');
    };
  }, [reduced]);

  if (gone) return null;
  return (
    <div ref={root} className="intro" aria-hidden="true">
      <svg className="intro-sheet" width="100%" height="100%">
        <path ref={path} />
      </svg>
      <div className="intro-word">
        <p className="intro-title">
          {Array.from('Jolly').map((c, i) => (
            <span key={i} className="intro-char">
              {c}
            </span>
          ))}
        </p>
        <p className="intro-sub">Ice creams</p>
        <p className="intro-note">scooping your page...</p>
      </div>
    </div>
  );
}
