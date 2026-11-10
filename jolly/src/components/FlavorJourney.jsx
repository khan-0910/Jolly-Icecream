import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Cone from './Cone.jsx';
import Decor from './Decor.jsx';
import { FLAVORS } from '../flavors.js';
import { ASSETS } from '../config.js';
import { scrollToY } from '../lenis.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const N = FLAVORS.length;
const HOLD = 0.38; // share of each step spent resting on a flavour before the next one pours in
const TAIL = 0.55; // extra rest on the final flavour
const LEAD = 0.45; // rest on vanilla before the first pour, so it gets its own moment

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return (a - 1) / 2147483646;
  };
}

// Each incoming flavour gets its own set of drips so no two pours look the same.
const DRIPS = FLAVORS.map((_, i) => {
  const r = seeded(17 + i * 101);
  const count = 7 + Math.floor(r() * 4);
  return Array.from({ length: count }, (_, k) => ({
    x: (k + 0.25 + r() * 0.5) / count,
    w: 0.035 + r() * 0.05,
    len: 0.35 + r() * 0.65,
    phase: r() * Math.PI * 2
  })).sort((a, b) => b.x - a.x);
});

// Builds the melting edge: a flood of colour from the top with rounded drips running ahead of it.
export function dripPath(w, h, p, drips) {
  if (p <= 0.0001) return 'M0 0 Z';
  if (p >= 0.9999) return `M0 0 H${w} V${h} H0 Z`;
  const maxDrip = h * 0.34;
  const env = Math.sin(Math.PI * Math.min(1, p * 1.08));
  const L = -maxDrip * 0.9 + p * (h + maxDrip * 0.9);
  const wobble = Math.sin(p * 9);
  let d = `M0 0 H${w} V${L.toFixed(1)}`;
  let prevX = w;
  drips.forEach((dr) => {
    const cx = dr.x * w;
    const hw = Math.max(16, dr.w * w) / 2;
    const len = Math.max(0, maxDrip * dr.len * env + wobble * 6 * Math.sin(dr.phase));
    const sag = 10 * Math.sin(dr.phase + p * 7);
    const right = cx + hw;
    d += ` Q${((prevX + right) / 2).toFixed(1)} ${(L + sag).toFixed(1)} ${right.toFixed(1)} ${L.toFixed(1)}`;
    d +=
      ` C${(cx + hw * 0.35).toFixed(1)} ${L.toFixed(1)} ${(cx + hw * 0.58).toFixed(1)} ${(L + len * 0.5).toFixed(1)} ${(cx + hw * 0.58).toFixed(1)} ${(L + len).toFixed(1)}` +
      ` C${(cx + hw * 0.58).toFixed(1)} ${(L + len + hw * 0.85).toFixed(1)} ${(cx - hw * 0.58).toFixed(1)} ${(L + len + hw * 0.85).toFixed(1)} ${(cx - hw * 0.58).toFixed(1)} ${(L + len).toFixed(1)}` +
      ` C${(cx - hw * 0.58).toFixed(1)} ${(L + len * 0.5).toFixed(1)} ${(cx - hw * 0.35).toFixed(1)} ${L.toFixed(1)} ${(cx - hw).toFixed(1)} ${L.toFixed(1)}`;
    prevX = cx - hw;
  });
  d += ` Q${(prevX / 2).toFixed(1)} ${(L - 6 * wobble).toFixed(1)} 0 ${L.toFixed(1)} Z`;
  return d;
}

const clamp = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// The side menu keeps its own state, so changing flavour never re-renders the panels.
function Rail({ setRef, onPick }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setRef.current = setActive;
  }, [setRef]);
  return (
    <nav className="rail" aria-label="Jump to a flavour" style={{ '--rail-ink': FLAVORS[active].ink }}>
      {FLAVORS.map((f, i) => (
        <button
          key={f.id}
          type="button"
          className={`rail-item ${i === active ? 'is-active' : ''}`}
          aria-current={i === active ? 'true' : undefined}
          onClick={() => onPick(i)}
        >
          <span className="rail-dot" style={{ background: f.scoop }} />
          <span className="rail-label">{f.name}</span>
        </button>
      ))}
    </nav>
  );
}

const HEAT = ['Add a pinch of chilli', 'A little more', 'Go on, more', 'You were warned'];

function FlavorPanel({ flavor, index, panelRef, rimRef, onChilli, chilliRef, heat }) {
  const img = ASSETS.flavors[flavor.id];
  let ci = 0;
  const words = flavor.name.split(" ").map((w) => Array.from(w).map((c) => ({ c, i: ci++ })));
  return (
    <article
      ref={panelRef}
      className={`flv flv--${flavor.id}`}
      style={{
        '--bg': flavor.bg,
        '--ink': flavor.ink,
        '--soft': flavor.soft,
        '--in': index === 0 ? 1 : 0,
        '--out': 0,
        zIndex: index,
        // CSS path() clip: works the same in Chrome, Safari (iPhone) and Firefox
        clipPath: index === 0 ? undefined : "path('M0 0 Z')"
      }}
      aria-label={flavor.name}
    >
      <Decor id={flavor.id} />
      {index > 0 && (
        <svg className="drip-rim" aria-hidden="true">
          <path ref={rimRef} d="M0 0 Z" />
        </svg>
      )}
      <div className="flv-inner">
        <div className="flv-text">
          <p className="flv-count">
            {index + 1} of {N}
          </p>
          <h2 className="flv-name" aria-label={flavor.name} style={{ "--fit": Math.max(...words.map((w) => w.length)) }}>
            {words.map((word, wi) => (
              <span key={wi} className="flv-word" aria-hidden="true">
                {word.map(({ c, i }) => (
                  <span key={i} className="flv-char" style={{ "--ci": i }}>
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p className="flv-tag">{flavor.tagline}</p>
          <p className="flv-body">{flavor.body}</p>
          <p className="flv-pair">
            <span>Best with</span>
            {flavor.pairs}
          </p>
          {flavor.id === 'guava' && (
            <button type="button" className="chilli-btn" onClick={onChilli}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 18c6 1 12-4 13-11 1-2 2-3 3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 18c-2 0-3-2-1-4 3-3 6-3 9-7 1 5-3 10-8 11z" fill="currentColor" />
              </svg>
              {HEAT[Math.min(heat, HEAT.length - 1)]}
            </button>
          )}
        </div>
        <div className="flv-art">
          {/* Hand-written notes with arrows that draw themselves in as the flavour arrives */}
          {flavor.notes?.map((note, ni) => (
            <div key={ni} className={`note note--${ni === 0 ? 'a' : 'b'}`} aria-hidden="true">
              <span className="note-text">{note}</span>
              <svg className="note-arrow" viewBox="0 0 120 90">
                {ni === 0 ? (
                  <>
                    <path pathLength="1" d="M108 8 C 96 40, 70 66, 22 76" />
                    <path pathLength="1" d="M36 64 L 20 77 L 38 86" />
                  </>
                ) : (
                  <>
                    <path pathLength="1" d="M10 80 C 30 46, 64 22, 104 18" />
                    <path pathLength="1" d="M88 8 L 106 18 L 92 32" />
                  </>
                )}
              </svg>
            </div>
          ))}
          <div className="flv-art-float">
            {img ? (
              <img src={img} alt={`${flavor.name} ice cream cone`} className="cone cone-img" />
            ) : (
              <Cone flavor={flavor}>{flavor.id === 'guava' && <g ref={chilliRef} />}</Cone>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FlavorJourney({ reduced }) {
  const section = useRef(null);
  const stage = useRef(null);
  const panels = useRef([]);
  const rims = useRef([]);
  const chilliRef = useRef(null);
  const [heat, setHeat] = useState(0);
  const resetChilliRef = useRef(null);
  const activeRef = useRef(0);
  const railSet = useRef(null);

  useGSAP(
    () => {
      if (reduced) return;
      let w = window.innerWidth;
      let h = window.innerHeight;

      // Only touch the DOM when a value actually changes: most panels sit still on most frames.
      const last = {};
      const put = (key, value, apply) => {
        if (last[key] === value) return;
        last[key] = value;
        apply(value);
      };
      let enter0 = 0; // vanilla's own entrance as the section scrolls up into view
      let lastProgress = 0;

      // The moving parts of each panel, found once. Styles are written straight onto these:
      // a CSS variable on the panel would make the browser recheck every node inside it each frame.
      const q = (el, sel) => el.querySelector(sel);
      const parts = panels.current.map((el) => ({
        text: q(el, '.flv-text'),
        count: q(el, '.flv-count'),
        rise: [
          [q(el, '.flv-tag'), 40, 1],
          [q(el, '.flv-body'), 60, 0.9],
          [q(el, '.flv-pair'), 70, 1],
          [q(el, '.chilli-btn'), 80, 1]
        ].filter(([n]) => n),
        chars: [...el.querySelectorAll('.flv-char')],
        art: q(el, '.flv-art'),
        notes: [...el.querySelectorAll('.note')].map((n) => ({
          n,
          text: q(n, '.note-text'),
          paths: [...n.querySelectorAll('.note-arrow path')]
        })),
        ribbon: q(el, '.irish-ribbon'),
        bits: [...el.querySelectorAll('.bit')],
        spin: q(el, '.bit--spin .bit-inner')
      }));

      const applyPanel = (i, vIn, out) => {
        const P = parts[i];
        const e = vIn * vIn * (3 - 2 * vIn);
        P.text.style.opacity = clamp(1 - out * 1.6);
        P.text.style.transform = `translateY(${out * 0.08 * h}px)`;
        P.count.style.opacity = 0.65 * e;
        P.rise.forEach(([n, dist, op]) => {
          n.style.transform = `translateY(${(1 - e) * dist}px)`;
          n.style.opacity = e * op;
        });
        P.chars.forEach((c, ci) => {
          const k = 1 - clamp(vIn * 1.6 - ci * 0.06);
          c.style.transform = `translateY(${k * 0.9}em) rotate(${k * 10}deg)`;
          c.style.opacity = clamp(vIn * 2.2 - ci * 0.08);
        });
        P.art.style.transform = `translateY(${(1 - e) * 0.3 * h + out * 0.14 * h}px) scale(${1 + out * 0.08}, ${1 - out * 0.14})`;
        const draw = clamp(vIn * 2.2 - 1.1);
        P.notes.forEach(({ n, text, paths }) => {
          n.style.opacity = clamp(1 - out * 2);
          text.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;
          paths.forEach((p) => (p.style.strokeDashoffset = 1 - draw));
        });
        if (P.ribbon) P.ribbon.style.strokeDashoffset = (1 - e) * 520;
        P.bits.forEach((b) => b.style.setProperty('--in-e', e));
        if (P.spin) P.spin.style.transform = `rotate(${e * 140 - out * 90}deg)`;
      };

      const render = (progress) => {
        lastProgress = progress;
        const t = progress * (N - 1 + TAIL + LEAD) - LEAD;
        let current = 0;
        const local = FLAVORS.map((_, i) => (i === 0 ? 1 : clamp((t - (i - 1) - HOLD) / (1 - HOLD))));
        local.forEach((p, i) => {
          if (i > 0) {
            const q = Math.round(easeInOut(p) * 1000) / 1000;
            // size is part of the key so a phone's browser bar resizing redraws the pour
            put(`p${i}`, `${q}@${w}x${h}`, () => {
              const d = dripPath(w, h, q, DRIPS[i]);
              panels.current[i].style.clipPath = `path('${d}')`;
              // the rim only traces the melting edge, not the panel border
              const rim = q >= 0.9999 ? 'M0 0' : d.replace(/^M0 0 H([\d.]+) V/, 'M$1 ').replace(/ Z$/, '');
              rims.current[i]?.setAttribute('d', rim);
            });
            if (p > 0.55) current = i;
          }
          const el = panels.current[i];
          if (!el) return;
          const next = local[i + 1] ?? 0;
          // --in: how far this flavour has arrived. It waits until the pour has passed the words,
          // so the old and new names never sit on top of each other.
          // --out: how far the next flavour has covered this one.
          const vIn = i === 0 ? enter0 : clamp((p - 0.45) / 0.55);
          put(`st${i}`, `${vIn.toFixed(3)}|${next.toFixed(3)}|${h}`, () => applyPanel(i, vIn, next));
          const onScreen = p > 0 && next < 1;
          // Neighbours stay ready to show; far-away panels skip style and paint work entirely.
          const mode = onScreen ? 'on' : Math.abs(i - current) <= 1 ? 'near' : 'far';
          put(`vis${i}`, mode, (m) => {
            el.style.visibility = m === 'on' ? 'visible' : 'hidden';
            el.style.setProperty('content-visibility', m === 'far' ? 'hidden' : 'visible');
          });
        });
        const guavaShown = local[N - 1] > 0.02;
        put('guavaShown', guavaShown, (shown) => {
          if (!shown) resetChilliRef.current?.();
        });
        if (current !== activeRef.current) {
          activeRef.current = current;
          railSet.current?.(current);
        }
      };

      ScrollTrigger.create({
        trigger: section.current,
        start: 'top 85%',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          enter0 = self.progress;
          render(lastProgress);
        }
      });

      // The pour follows scroll with a short glide, so fast flicks ease through instead of jumping.
      const glide = { p: 0 };
      const tween = gsap.to(glide, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(glide.p),
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.45,
          onRefresh: () => {
            w = stage.current.clientWidth;
            h = stage.current.clientHeight;
          }
        }
      });
      render(tween.scrollTrigger.progress);

      // Phone address bars grow and shrink the stage; keep the pour sized to it.
      const ro = new ResizeObserver(() => {
        w = stage.current.clientWidth;
        h = stage.current.clientHeight;
        render(lastProgress);
      });
      ro.observe(stage.current);

      // Pointer depth for the floating bits in each flavour's world (only the decor layers, not whole panels)
      const decors = panels.current.map((el) => q(el, '.decor'));
      const onMove = (e) => {
        const mx = (e.clientX / window.innerWidth) * 2 - 1;
        const my = (e.clientY / window.innerHeight) * 2 - 1;
        gsap.to(decors, { '--mx': mx, '--my': my, duration: 0.8, ease: 'power3.out', overwrite: true });
      };
      window.addEventListener('pointermove', onMove);
      return () => {
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
      };
    },
    { scope: section, dependencies: [reduced] }
  );

  const goTo = (i) => {
    const el = section.current;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    const t = i === 0 ? 0 : i - 1 + HOLD + (1 - HOLD) + 0.02;
    scrollToY(top + ((t + LEAD) / (N - 1 + TAIL + LEAD)) * total);
  };

  // Other sections (the scoop line-up) can ask to jump to a flavour.
  useEffect(() => {
    const onGoto = (e) => {
      const i = FLAVORS.findIndex((f) => f.id === e.detail);
      if (i < 0) return;
      if (reduced) panels.current[i]?.scrollIntoView();
      else goTo(i);
    };
    window.addEventListener('jolly:goto', onGoto);
    return () => window.removeEventListener('jolly:goto', onGoto);
  });

  // Clear every flake and the warm glow, and put the button back to its first label.
  resetChilliRef.current = () => {
    const g = chilliRef.current;
    if (g) {
      gsap.killTweensOf(g.childNodes);
      while (g.firstChild) g.removeChild(g.firstChild);
    }
    setHeat(0);
  };

  const addChilli = () => {
    const g = chilliRef.current;
    if (!g) return;
    const ns = 'http://www.w3.org/2000/svg';
    const count = 26;
    // each pinch warms the whole scoop a little
    let glow = g.querySelector('.heat-glow');
    if (!glow) {
      glow = document.createElementNS(ns, 'rect');
      glow.setAttribute('class', 'heat-glow');
      glow.setAttribute('x', 40);
      glow.setAttribute('y', 60);
      glow.setAttribute('width', 320);
      glow.setAttribute('height', 300);
      glow.setAttribute('fill', '#E8341F');
      glow.setAttribute('opacity', 0);
      g.appendChild(glow);
    }
    gsap.to(glow, { opacity: Math.min(0.3, (heat + 1) * 0.07), duration: 1.2, ease: 'power2.out' });
    for (let k = 0; k < count; k++) {
      const flake = document.createElementNS(ns, 'rect');
      const x = 90 + Math.random() * 220;
      const y = 110 + Math.random() * 140;
      flake.setAttribute('x', x);
      flake.setAttribute('y', y);
      flake.setAttribute('width', 4 + Math.random() * 4);
      flake.setAttribute('height', 2.4 + Math.random() * 2.4);
      flake.setAttribute('rx', 0.6);
      flake.setAttribute('fill', Math.random() > 0.3 ? '#C21F17' : '#E8461F');
      g.appendChild(flake);
      gsap.fromTo(
        flake,
        { y: -220 - Math.random() * 120, rotate: Math.random() * 360, opacity: 0, transformOrigin: 'center' },
        { y: 0, rotate: Math.random() * 360, opacity: 1, duration: 0.7 + Math.random() * 0.5, ease: 'power2.in', delay: Math.random() * 0.35 }
      );
    }
    while (g.childNodes.length > 160) g.removeChild(g.childNodes[1]); // keep the glow (first child)
    const art = panels.current[N - 1]?.querySelector('.flv-art-float');
    if (art) gsap.fromTo(art, { rotate: -4 }, { rotate: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)' });
    const name = panels.current[N - 1]?.querySelector('.flv-name');
    if (name) gsap.to(name, { keyframes: { x: [0, -7, 6, -5, 3, -1, 0] }, duration: 0.5, ease: 'none' });
    setHeat((h) => h + 1);
  };

  return (
    <section
      id="flavours"
      ref={section}
      className={`journey ${reduced ? 'journey--static' : ''}`}
      style={{ '--steps': N - 1 + TAIL + LEAD }}
      aria-label="Our flavours"
    >
      <div ref={stage} className="journey-stage">
        {FLAVORS.map((f, i) => (
          <FlavorPanel
            key={f.id}
            flavor={f}
            index={i}
            panelRef={(el) => (panels.current[i] = el)}
            rimRef={(el) => (rims.current[i] = el)}
            onChilli={addChilli}
            chilliRef={chilliRef}
            heat={heat}
          />
        ))}

        {!reduced && <Rail setRef={railSet} onPick={goTo} />}
      </div>
    </section>
  );
}
