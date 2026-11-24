import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cone from './Cone.jsx';
import { FLAVORS, STOPS } from '../flavors.js';
import { dripPath, makeDrips } from '../drip.js';
import { scrollToTarget, scrollToY, setStage } from '../lenis.js';
import { inkNav } from '../nav.js';

gsap.registerPlugin(ScrollTrigger);

const LAST = STOPS.length - 1;
const LEAD = 0.2; // rest on the title before the first pour
const TAIL = 0.5; // rest on the last flavour before the stage lets go
const SPAN = LAST + LEAD + TAIL;
const HOLD = 0.2; // share of each step spent at rest on either side
const DRIPS = STOPS.map((_, i) => makeDrips(i + 2));
const HEAT = ['Add chilli', 'More chilli', 'Even more', 'You were warned'];

const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const isTall = () => window.innerWidth / window.innerHeight < 0.9 || (window.innerWidth <= 820 && window.innerHeight > 520);

export default function Stage({ reduced }) {
  const section = useRef(null);
  const stage = useRef(null);
  const canvas = useRef(null);
  const layers = useRef([]);
  const words = useRef([]);
  const copies = useRef([]);
  const picker = useRef(null);
  const goTo = useRef(null);
  const api = useRef(null);
  const [current, setCurrent] = useState(0);
  const [no3d, setNo3d] = useState(false);
  const [heat, setHeat] = useState(0);
  const [tall, setTall] = useState(isTall);

  useEffect(() => {
    let alive = true;
    let w = 1;
    let h = 1;
    let fit = [];
    let target = 0;
    let t = 0;
    let shown = -1;
    const inks = [];
    let drawn = -1;
    let pour = null; // { a, b, f }: one stop pouring straight into another, whatever lies between
    let hold = null; // the stop to show, whatever the scroll position says
    let travel = null; // 'in' or 'out': gliding between the stage and the rest of the page

    const measure = () => {
      w = stage.current.clientWidth;
      h = stage.current.clientHeight;
      const tops = copies.current.map((el) => el.parentElement.offsetTop + el.offsetTop - 12);
      const pen = document.createElement('canvas').getContext('2d');
      pen.font = '100px Shrikhand';
      const font = pen.measureText('x');
      const under = 0.43 - (font.fontBoundingBoxAscent - font.fontBoundingBoxDescent) / 200; // line bottom to baseline, in em
      let roof = h;
      words.current.forEach((el, i) => {
        const lines = el.childElementCount * 0.86;
        el.style.fontSize = '100px';
        let size = Math.min(((w * (tall ? 0.9 : 0.93)) / el.offsetWidth) * 100, (h * (tall ? 0.36 : h < 520 ? 0.5 : 0.6)) / (el.childElementCount * 0.86));
        // beside the copy, the word's baseline has to stay above it
        if (!tall) size = Math.min(size, (tops[i] - 64) / (lines - under));
        layers.current[i].style.paddingBottom = tall || h <= 520 ? '' : `${Math.max(h * 0.1, h + lines * size - 2 * (tops[i] + under * size))}px`;
        el.style.fontSize = `${size}px`;
        roof = Math.min(roof, 92 + el.offsetHeight * 0.5);
      });
      fit = [w, h, tall, tops, roof];
      api.current?.resize(...fit);
      drawn = -1;
    };

    // Stop a on show with stop b pouring over it; f is how far along (0..1).
    const draw = (a, b, f) => {
      STOPS.forEach((_, i) => {
        const layer = layers.current[i];
        const p = i === a ? 1 : i === b ? clamp(f / 0.96) : 0;
        const out = i === a ? f : 0;
        layer.style.zIndex = i === b ? 2 : 1;
        const vis = p > 0.0005 && out < 0.999;
        layer.style.visibility = vis ? 'visible' : 'hidden';
        if (vis) {
          layer.style.clipPath = p >= 0.9999 ? 'none' : `path('${dripPath(w, h, smooth(p), DRIPS[i])}')`;
          const vin = i === a ? 1 : smooth(clamp((p - 0.35) / 0.65));
          words.current[i].style.transform = `translateY(${(1 - vin) * 24 - out * 10}vh) scale(${1 + out * 0.08})`;
        }
        const near = i === a ? clamp(1 - f * 3.2) : i === b ? clamp(1 - (1 - f) * 3.2) : 0;
        const c = copies.current[i];
        c.style.opacity = near;
        c.style.transform = `translateY(${(i === b ? 1 : -1) * (1 - near) * 28}px)`;
        c.style.visibility = near > 0.02 ? 'visible' : 'hidden';
      });
      const n = f < 0.5 ? a : b;
      if (n !== shown) {
        shown = n;
        setCurrent(n);
        if (n !== LAST) setHeat(0);
      }
      // The top of the screen floods first and the bottom last, so the menus change ink at different moments.
      const at = (edge) => STOPS[f < edge ? a : b].ink;
      if (inks[0] !== at(0.74)) picker.current.style.setProperty('--ink', (inks[0] = at(0.74)));
      if (inks[1] !== at(0.3)) inkNav((inks[1] = at(0.3)));
    };
    const render = (dt) => {
      const a = pour ? pour.a : Math.min(LAST - 1, Math.floor(t));
      const b = pour ? pour.b : a + 1;
      const f = pour ? smooth(pour.f) : t - a;
      if (pour || t !== drawn) draw(a, b, f);
      drawn = pour ? -1 : t;
      if (dt) api.current?.frame(a, b, f, dt);
    };

    const read = (progress) => {
      const u = Math.min(LAST, Math.max(0, progress * SPAN - LEAD));
      const i = Math.floor(u);
      target = i + clamp((u - i - HOLD) / (1 - HOLD * 2));
      if (reduced) target = Math.round(target);
    };

    measure();
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: () => `+=${section.current.offsetHeight - stage.current.offsetHeight}`,
      onUpdate: (self) => read(self.progress),
      onRefresh: (self) => read(self.progress)
    });
    read(st.progress);
    t = target;
    render(0);

    const tick = (time, ms) => {
      const r = section.current.getBoundingClientRect();
      if (r.bottom < 1) {
        if (travel === 'out') travel = hold = null;
        pour = null;
        t = hold ?? target;
        render(0);
        return;
      }
      const dt = Math.min(0.05, ms / 1000);
      const want = hold ?? target;
      const ease = (to, snap) => {
        t += (to - t) * (1 - Math.exp(-dt * 9));
        if (Math.abs(to - t) < snap) t = to;
      };
      if (reduced) t = want;
      else if (pour) {
        pour.f += (dt / 1.3) * (want === pour.b ? 1 : 2);
        if (pour.f >= 1) {
          t = pour.b;
          pour = null;
        }
      } else if (hold !== null ? t === Math.round(t) && t !== hold : Math.abs(want - t) > 1.5) {
        const a = Math.round(t);
        if (t === a) pour = { a, b: Math.round(want), f: 0 };
        else ease(a, 0.02);
      } else if (Math.abs(want - t) < 1 || hold === null) ease(want, 0.0004);
      else ease(Math.round(t), 0.02);
      if (!travel && t === hold) hold = null;
      render(dt);
    };
    gsap.ticker.add(tick);

    import('../three/stageScene.js')
      .then(({ createStage }) => {
        if (!alive) return;
        api.current = createStage(canvas.current, { small: window.innerWidth <= 820, reduced });
        api.current.resize(...fit);
      })
      .catch(() => alive && setNo3d(true));

    // Links and dots pour straight to their flavour; the scroll position catches up unseen.
    const stopY = (i) => st.start + ((i + (i ? LEAD : 0)) / SPAN) * (st.end - st.start);
    const pinned = () => window.scrollY < st.end - 1;
    const JUMP = { immediate: true };
    const go = (i) => {
      hold = Math.max(0, Math.min(LAST, i));
      const y = stopY(hold);
      travel = pinned() || reduced ? null : 'in';
      if (!travel) return scrollToY(y, JUMP);
      scrollToY(st.end, {
        onComplete: () => {
          if (travel !== 'in') return;
          travel = null;
          scrollToY(y, JUMP);
        }
      });
    };
    const leave = () => {
      if (!pinned() || reduced) return;
      hold = pour ? pour.b : Math.round(t);
      travel = 'out';
      scrollToY(st.end, JUMP);
    };
    const takeOver = () => (travel = null);
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchmove', takeOver, { passive: true });
    goTo.current = go;
    setStage({ go, leave });

    const ro = new ResizeObserver(() => {
      setTall(isTall());
      measure();
    });
    ro.observe(stage.current);
    document.fonts?.ready.then(() => alive && measure());

    const move = (e) => api.current?.pointer((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      alive = false;
      st.kill();
      ro.disconnect();
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('wheel', takeOver);
      window.removeEventListener('touchmove', takeOver);
      api.current?.dispose();
      api.current = null;
    };
  }, [reduced, tall]);

  // Drag to spin the cone; on touch, a swipe also changes flavour. Tap: squish.
  const press = useRef(null);
  const down = (e) => {
    if (e.target.closest('a,button')) return;
    press.current = { x: e.clientX, x0: e.clientX, y0: e.clientY };
    if (e.pointerType === 'mouse') stage.current.setPointerCapture(e.pointerId);
    if (api.current) api.current.drag.on = true;
  };
  const move = (e) => {
    if (!press.current || !api.current?.drag.on) return;
    api.current.dragBy(e.clientX - press.current.x);
    press.current.x = e.clientX;
  };
  const up = (e) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (api.current) api.current.drag.on = false;
    const dx = e.clientX - p.x0;
    const dy = e.clientY - p.y0;
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) api.current?.poke();
    else if (e.pointerType !== 'mouse' && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) goTo.current(current + (dx < 0 ? 1 : -1));
  };
  const cancel = () => {
    press.current = null;
    if (api.current) api.current.drag.on = false;
  };

  return (
    <section ref={section} id="top" className="stage-track" style={{ '--steps': SPAN }} aria-label="Jolly Ice creams and its five flavours">
      <span id="flavours" className="stage-mark" style={{ top: `calc((100% - 100lvh) * ${(1 + LEAD) / SPAN})` }} />
      <div ref={stage} className="stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
        {STOPS.map((s, i) => {
          const Tag = i === 0 ? 'h1' : 'h2';
          const lines = tall && s.id === 'strawberry' ? ['Straw', 'berry'] : s.lines;
          return (
            <div key={s.id} ref={(el) => (layers.current[i] = el)} className="flood" style={{ background: s.bg, color: s.word }}>
              <Tag ref={(el) => (words.current[i] = el)} className="word" aria-label={i === 0 ? 'Jolly Ice creams' : FLAVORS[i - 1].name}>
                {lines.map((line) => (
                  <span key={line} aria-hidden="true">
                    {line}
                  </span>
                ))}
              </Tag>
            </div>
          );
        })}

        <canvas ref={canvas} className="stage-canvas" aria-hidden="true" />
        {no3d && <Cone flavor={FLAVORS[STOPS[current].flavor]} className="stage-flat" />}

        <div className="stage-copy">
          {STOPS.map((s, i) => {
            const f = FLAVORS[i - 1];
            return (
              <div key={s.id} ref={(el) => (copies.current[i] = el)} className="copy" style={{ color: s.ink }}>
                <p className="copy-tag">{f ? f.tagline : 'Ice creams for Bangalore and Salem'}</p>
                <p className="copy-body">{f ? f.body : 'Five flavours, from the vanilla you grew up with to a guava scoop with a kick of chilli.'}</p>
                {f && <p className="copy-pair">Best with {f.pairs}.</p>}
                {f?.id === 'guava' && (
                  <button
                    type="button"
                    className="btn btn--chilli"
                    onClick={() => {
                      api.current?.chilli();
                      setHeat((n) => n + 1);
                    }}
                  >
                    {HEAT[Math.min(heat, HEAT.length - 1)]}
                  </button>
                )}
                {!f && (
                  <div className="copy-cta">
                    <button type="button" className="btn btn--ink" onClick={() => goTo.current(1)}>
                      Meet the flavours
                    </button>
                    <button type="button" className="btn btn--text" onClick={() => scrollToTarget('#build')}>
                      Build a cone
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <nav ref={picker} className="picker" aria-label="Flavours">
          {FLAVORS.map((f, i) => (
            <button key={f.id} type="button" className="picker-item" aria-current={current === i + 1 ? 'true' : undefined} onClick={() => goTo.current(i + 1)}>
              <span className="picker-dot" style={{ background: f.col }} />
              <span className="picker-name">{f.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
