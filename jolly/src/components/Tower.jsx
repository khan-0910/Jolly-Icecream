import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { FLAVORS } from '../flavors.js';
import Drip from './Drip.jsx';

const MAX = 6;
const BG = '#4A0D24';

export default function Tower({ reduced }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const built = useRef(0);
  const [stack, setStack] = useState([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const add = (f) => setStack((s) => (s.length >= MAX ? s : [...s, f]));

  // Keep the 3D tower in step with the list.
  useEffect(() => {
    if (!api.current) return;
    if (stack.length === 0) {
      api.current.clear();
      built.current = 0;
    }
    while (built.current < stack.length) api.current.add(stack[built.current++]);
  }, [stack, ready]);

  useEffect(() => {
    let alive = true;
    let visible = false;
    let started = false;
    let greeted = false;
    const timers = [];
    const size = () => api.current?.resize(canvas.current.clientWidth, canvas.current.clientHeight);
    const tick = (time, ms) => visible && api.current?.frame(ms / 1000);
    const boot = (near) => {
        if (!near || started || !alive) return;
        started = true;
        import('../three/towerScene.js')
          .then(({ createTower }) => {
            if (!alive) return;
            api.current = createTower(canvas.current, { small: window.innerWidth <= 820, reduced });
            size();
            gsap.ticker.add(tick);
            setReady(true);
          })
          .catch(() => alive && setFailed(true));
    };
    const pre = new IntersectionObserver(([e]) => boot(e.isIntersecting), { rootMargin: '120% 0px' });
    // Load it while the visitor is still looking at the title, not mid-scroll.
    timers.push(setTimeout(() => boot(true), 2600));
    const vis = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (e.intersectionRatio < 0.4 || greeted) return;
        greeted = true;
        add(FLAVORS[2]);
        timers.push(setTimeout(() => add(FLAVORS[0]), 420));
      },
      { threshold: [0, 0.4, 0.6] }
    );
    pre.observe(root.current);
    vis.observe(canvas.current);
    const ro = new ResizeObserver(size);
    ro.observe(canvas.current);
    const move = (e) => api.current?.pointer((e.clientX / window.innerWidth) * 2 - 1);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      pre.disconnect();
      vis.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', move);
      api.current?.dispose();
      api.current = null;
      built.current = 0;
      setReady(false);
      setStack([]);
    };
  }, [reduced]);

  const save = async () => {
    const src = canvas.current;
    const W = 1080;
    const H = 1350;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const c = out.getContext('2d');
    c.fillStyle = BG;
    c.fillRect(0, 0, W, H);
    await document.fonts?.load('400 120px Shrikhand');
    c.fillStyle = '#FF7FA0';
    c.textAlign = 'center';
    c.font = '400 120px Shrikhand';
    c.fillText('Jolly', W / 2, H - 70);
    api.current.frame(0); // the canvas can only be copied straight after it is drawn
    const k = (H - 190) / src.height;
    c.drawImage(src, (W - src.width * k) / 2, 0, src.width * k, src.height * k);
    out.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'my-jolly-cone.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  };

  const full = stack.length >= MAX;
  let status = 'An empty cone. Pick a flavour to start.';
  if (full) status = 'Six scoops. That is as tall as it goes.';
  else if (stack.length) status = `${stack.length} ${stack.length === 1 ? 'scoop' : 'scoops'}: ${stack.map((f) => f.name).join(', ')}`;
  if (failed) status = 'This browser can’t show the 3D cone.';

  return (
    <section ref={root} className="tower" id="build" aria-labelledby="build-title">
      <div className="tower-copy">
        <h2 id="build-title" className="title">
          Build a <br />
          tall one
        </h2>
        <p className="tower-lede">Tap a flavour to drop a scoop. Up to six, if it holds.</p>
        <ul className="tower-picks">
          {FLAVORS.map((f) => (
            <li key={f.id}>
              <button type="button" className="pick" style={{ '--c': f.col, '--s': f.shade }} disabled={full || !ready} onClick={() => add(f)}>
                <span className="pick-ball" />
                {f.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="tower-status" role="status">
          {status}
        </p>
        <div className="tower-actions">
          <button type="button" className="btn btn--pink" disabled={!stack.length || !ready} onClick={save}>
            Save picture
          </button>
          <button type="button" className="btn btn--text" disabled={!stack.length} onClick={() => setStack([])}>
            Start over
          </button>
        </div>
      </div>
      <div className="tower-view">
        <canvas ref={canvas} className="tower-canvas" role="img" aria-label="Your ice cream tower" />
      </div>
      <Drip color={BG} seed={4} />
    </section>
  );
}
