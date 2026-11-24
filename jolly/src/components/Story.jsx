import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Drip from './Drip.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LINES = ['Made', 'for hot', 'afternoons'];
const NOTES = [
  ['Flavour you can name', 'Every scoop is built around one taste you would recognise with your eyes shut.'],
  ['Rooted at home', 'Guava with chilli is the street-cart snack we all grew up on. Now it comes in a cone.'],
  ['Two cities to start', 'We are scooping in Bangalore and Salem first.']
];

// Where each letter touches its baseline, in em from its left edge: drips hang from there.
const FOOT = { M: 0.77, a: 0.157, d: 0.456, e: 0.267, f: 0.12, o: 0.277, r: 0.138, h: 0.122, t: 0.18, n: 0.127, s: 0.27 };
// Only the last line has room for long drips.
const dripFor = (n, c, last) => {
  const w = 0.06 + ((n * 13) % 5) / 130;
  return { left: `${FOOT[c] - w / 2}em`, width: `${w}em`, height: `${0.05 + (((n * 29) % 10) / 14) * (last ? 1 : 0.16)}em` };
};

export default function Story({ reduced }) {
  const root = useRef(null);
  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(
        '.melt-drip i',
        { y: 0, yPercent: -100 },
        { y: 0, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.melt', start: 'top 60%', end: 'bottom 5%', scrub: 0.6 } }
      );
    },
    { scope: root, dependencies: [reduced] }
  );
  let n = 0;
  return (
    <section ref={root} className="story" id="story" aria-labelledby="story-title">
      <h2 id="story-title" className="melt" aria-label="Made for hot afternoons">
        {LINES.map((line, row) => (
          <span key={line} className="melt-line" aria-hidden="true">
            {Array.from(line).map((c, i) =>
              c === ' ' ? (
                <span key={i} className="melt-gap" />
              ) : (
                <span key={i} className="melt-char">
                  {c}
                  <span className="melt-drip" style={dripFor(++n, c, row === LINES.length - 1)}>
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none">
                      <path d="M0 0 C22 4 22 40 22 60 H78 C78 40 78 4 100 0 Z" fill="currentColor" />
                    </svg>
                    <span className="melt-run">
                      <i />
                    </span>
                  </span>
                </span>
              )
            )}
          </span>
        ))}
      </h2>
      <dl className="notes">
        {NOTES.map(([t, b]) => (
          <div key={t}>
            <dt>{t}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
      <Drip color="#FF9A2B" seed={7} />
    </section>
  );
}
