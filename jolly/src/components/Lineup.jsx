import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { FLAVORS } from '../flavors.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function rng(seed) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return (a - 1) / 2147483646;
  };
}

// A scoop seen from above: lumpy edge, the curl the scooper leaves, and the flavour's own bits.
function TopScoop({ flavor, seed }) {
  const { edge, bits } = useMemo(() => {
    const r = rng(seed);
    const pts = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = 96 + r() * 12;
      pts.push([150 + Math.cos(a) * rad, 150 + Math.sin(a) * rad]);
    }
    // smooth closed curve through the points
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    const b = [];
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 86;
      b.push({ x: 150 + Math.cos(a) * rad, y: 150 + Math.sin(a) * rad, s: r(), t: r() });
    }
    return { edge: d + ' Z', bits: b };
  }, [seed]);

  const id = flavor.id;
  return (
    <svg className="top-scoop" viewBox="0 0 300 300" aria-hidden="true">
      <defs>
        <radialGradient id={`ts-${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".55" />
          <stop offset="35%" stopColor={flavor.scoop} />
          <stop offset="100%" stopColor={flavor.scoopShade} />
        </radialGradient>
        <clipPath id={`tsc-${id}`}>
          <path d={edge} />
        </clipPath>
      </defs>
      <path d={edge} fill={flavor.scoopShade} transform="translate(4 8)" opacity=".5" />
      <path d={edge} fill={`url(#ts-${id})`} />
      <g clipPath={`url(#tsc-${id})`}>
        {/* the curl a scooper leaves */}
        <path d="M70 150 C 70 90, 150 70, 190 100 C 225 125, 210 180, 165 185 C 130 188, 118 155, 140 140" fill="none" stroke={flavor.scoopShade} strokeWidth="9" strokeLinecap="round" opacity=".7" />
        <path d="M86 196 C 120 226, 190 222, 222 180" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".35" />
        {id === 'vanilla' &&
          bits.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={1.4 + p.s * 1.4} ry="1" transform={`rotate(${p.t * 180} ${p.x} ${p.y})`} fill="#3B2414" opacity=".7" />)}
        {id === 'cookies' &&
          bits.slice(0, 22).map((p, i) => {
            const s = 5 + p.s * 10;
            return <path key={i} d={`M${p.x - s} ${p.y} L${p.x} ${p.y - s} L${p.x + s} ${p.y - s * 0.2} L${p.x + s * 0.4} ${p.y + s} Z`} fill="#2B2125" />;
          })}
        {id === 'strawberry' &&
          bits.slice(0, 14).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5 + p.s * 7} fill="#D93A63" opacity=".9" />)}
        {id === 'irish' && (
          <path d="M60 120 C 110 80, 140 170, 190 130 C 220 105, 240 140, 250 160" fill="none" stroke="#8C5530" strokeWidth="12" strokeLinecap="round" />
        )}
        {id === 'guava' &&
          bits.map((p, i) => <rect key={i} x={p.x} y={p.y} width={3 + p.s * 3} height="2" fill="#B71D16" transform={`rotate(${p.t * 180} ${p.x} ${p.y})`} />)}
      </g>
    </svg>
  );
}

export default function Lineup({ reduced }) {
  const root = useRef(null);

  useGSAP(
    (ctx, contextSafe) => {
      const rings = gsap.utils.toArray('.lineup-ring');
      const spins = rings.map((ring, i) =>
        gsap.to(ring, { rotation: i % 2 ? -360 : 360, duration: 22 + i * 3, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
      );
      if (reduced) {
        spins.forEach((s) => s.pause());
        return;
      }

      // Each scoop plops in from above and squashes as it lands.
      const items = gsap.utils.toArray('.lineup-item');
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 65%' } });
      items.forEach((item, i) => {
        const body = item.querySelector('.lineup-body');
        tl.from(body, { y: -260, opacity: 0, duration: 0.55, ease: 'power3.in' }, i * 0.12)
          .to(body, { scaleY: 0.82, scaleX: 1.12, duration: 0.1, ease: 'power1.out', transformOrigin: '50% 100%' })
          .to(body, { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      });
      tl.from('.lineup-note', { opacity: 0, y: 20, duration: 0.6 }, '-=0.6');

      // Gentle depth as the band scrolls past
      items.forEach((item, i) => {
        gsap.to(item, {
          yPercent: [-14, 10, -6, 16, -10][i % 5],
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      // Hover: the name spins faster and the scoop wobbles
      items.forEach((item, i) => {
        const body = item.querySelector('.lineup-body');
        const enter = contextSafe(() => {
          gsap.to(spins[i], { timeScale: 6, duration: 0.5 });
          gsap.fromTo(body, { rotate: -6 }, { rotate: 0, scale: 1.06, duration: 0.9, ease: 'elastic.out(1, 0.3)' });
        });
        const leave = contextSafe(() => {
          gsap.to(spins[i], { timeScale: 1, duration: 1.2 });
          gsap.to(body, { scale: 1, duration: 0.6, ease: 'power3.out' });
        });
        item.addEventListener('pointerenter', enter);
        item.addEventListener('pointerleave', leave);
        item.addEventListener('focus', enter);
        item.addEventListener('blur', leave);
      });
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <section ref={root} className="lineup" id="lineup" aria-labelledby="lineup-title">
      <svg className="scallop scallop--top" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path d={`M0 40 ${Array.from({ length: 24 }, (_, i) => `Q${i * 50 + 25} -14 ${i * 50 + 50} 40`).join(' ')} Z`} />
      </svg>
      <div className="lineup-head">
        <h2 id="lineup-title" className="lineup-title">
          Pick a scoop
        </h2>
        <p className="lineup-note">tap one and we'll take you to it</p>
      </div>
      <ul className="lineup-row">
        {FLAVORS.map((f, i) => (
          <li key={f.id} className="lineup-cell">
            <button
              type="button"
              className="lineup-item"
              style={{ '--size': ['16rem', '13.5rem', '15rem', '12.5rem', '14rem'][i] }}
              onClick={() => window.dispatchEvent(new CustomEvent('jolly:goto', { detail: f.id }))}
              aria-label={`Go to ${f.name}`}
            >
              <span className="lineup-body">
                <TopScoop flavor={f} seed={11 + i * 37} />
              </span>
              <svg className="lineup-ring" viewBox="0 0 300 300" aria-hidden="true">
                <defs>
                  <path id={`ring-${f.id}`} d="M150 150 m-132 0 a132 132 0 1 1 264 0 a132 132 0 1 1 -264 0" />
                </defs>
                <text>
                  {/* repeat the name so it wraps the whole scoop, then stretch it to close the ring exactly */}
                  <textPath href={`#ring-${f.id}`} startOffset="0" textLength="820" lengthAdjust="spacing">
                    {Array.from({ length: Math.max(2, Math.round(38 / (f.name.length + 3))) }, () => `${f.name} • `).join('')}
                  </textPath>
                </text>
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
