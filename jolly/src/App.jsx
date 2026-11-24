import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Stage from './components/Stage.jsx';
import Tower from './components/Tower.jsx';
import Story from './components/Story.jsx';
import Cities from './components/Cities.jsx';
import { startLenis, scrollToTarget } from './lenis.js';
import { syncNav } from './nav.js';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

const NAV = [
  ['#flavours', 'Flavours'],
  ['#build', 'Build'],
  ['#story', 'Story'],
  ['#find-us', 'Find us']
];

const jump = (href) => (e) => {
  e.preventDefault();
  scrollToTarget(href);
};

export default function App() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const stop = reduced ? null : startLenis();
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncNav, onRefresh: syncNav });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      st.kill();
      stop?.();
    };
  }, [reduced]);

  const links = NAV.map(([href, label]) => (
    <li key={href}>
      <a href={href} onClick={jump(href)}>
        {label}
      </a>
    </li>
  ));

  return (
    <>
      <a className="skip" href="#build" onClick={jump('#build')}>
        Skip the flavours
      </a>
      <header className="nav">
        <a href="#top" className="nav-mark" onClick={jump('#top')} aria-label="Jolly Ice creams, back to top">
          Jolly
        </a>
        <nav aria-label="Main">
          <ul>{links}</ul>
        </nav>
      </header>

      <main>
        <Stage reduced={reduced} />
        <Tower reduced={reduced} />
        <Story reduced={reduced} />
        <Cities />
      </main>

      <footer className="footer">
        <div className="footer-top">
          <p className="footer-line">Back for another scoop?</p>
          <button type="button" className="btn btn--ink" onClick={jump('#top')}>
            Start from the top
          </button>
        </div>
        <p className="footer-word" aria-hidden="true">
          Jolly
        </p>
        <div className="footer-row">
          <p>
            <span lang="kn">ಜಾಲಿ</span> <span lang="ta">ஜாலி</span>
          </p>
          <ul>{links}</ul>
          <p>&copy; {new Date().getFullYear()} Jolly Ice creams</p>
        </div>
      </footer>
    </>
  );
}
