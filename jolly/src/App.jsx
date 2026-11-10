import { useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './components/Hero.jsx';
import FlavorJourney from './components/FlavorJourney.jsx';
import Story from './components/Story.jsx';
import Cities from './components/Cities.jsx';
import Lineup from './components/Lineup.jsx';
import Intro from './components/Intro.jsx';
import ScrollVelocity from './components/bits/ScrollVelocity.jsx';
import { startLenis, scrollToTarget } from './lenis.js';
import 'lenis/dist/lenis.css';

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
  ['#story', 'Our story'],
  ['#find-us', 'Find us']
];

const jump = (href) => (e) => {
  e.preventDefault();
  scrollToTarget(href);
};

export default function App() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const stop = startLenis();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return stop;
  }, [reduced]);

  return (
    <>
      <Intro reduced={reduced} />
      <a className="skip" href="#flavours">
        Skip to flavours
      </a>
      <nav className="nav" aria-label="Main">
        <a href="#top" className="nav-mark" onClick={jump('#top')}>
          Jolly Ice creams
        </a>
        <ul className="nav-links">
          {NAV.map(([href, label]) => (
            <li key={href}>
              <a href={href} onClick={jump(href)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <Hero reduced={reduced} />
        <FlavorJourney reduced={reduced} />
        <div className="ribbon" aria-hidden="true">
          <ScrollVelocity
            texts={['now scooping in Bangalore and Salem', 'Vanilla, cookies & cream, strawberry, Irish, guava']}
            velocity={reduced ? 0 : 40}
            numCopies={4}
            className="ribbon-text"
            separator={<span className="ribbon-dot" />}
          />
        </div>
        <Lineup reduced={reduced} />
        <Story reduced={reduced} />
        <Cities />
      </main>

      <footer className="footer">
        <p className="footer-mark">
          Jolly <span className="nowrap">Ice creams</span> <span lang="kn">ಜಾಲಿ</span> <span lang="ta">ஜாலி</span>
        </p>
        <div className="footer-row">
          <p>Jolly Ice creams. Bangalore and Salem.</p>
          <ul>
            {NAV.map(([href, label]) => (
              <li key={href}>
                <a href={href} onClick={jump(href)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <p>&copy; {new Date().getFullYear()} Jolly Ice creams</p>
        </div>
      </footer>
    </>
  );
}
