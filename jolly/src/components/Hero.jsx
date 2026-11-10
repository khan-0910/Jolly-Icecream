import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitText from './bits/SplitText.jsx';
import Magnet from './bits/Magnet.jsx';
import Cone from './Cone.jsx';
import { introDone } from './Intro.jsx';
import { FLAVORS } from '../flavors.js';
import { ASSETS } from '../config.js';
import { scrollToTarget } from '../lenis.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const strawberry = FLAVORS.find((f) => f.id === 'strawberry');

export default function Hero({ reduced }) {
  const root = useRef(null);
  const tiltRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    introDone.then(() => setReady(true));
  }, []);

  useGSAP(
    (ctx, contextSafe) => {
      if (reduced) return;
      // Everything waits under the cream sheet, then plays as one entrance.
      gsap.set(['.hero-arch', '.hero-copy > *', '.hero-scripts', '.hero-hand'], { autoAlpha: 0 });
      gsap.set('.title-drip', { scaleY: 0, transformOrigin: '50% 0%' });

      let alive = true;
      introDone.then(
        contextSafe(() => {
          if (!alive) return;
          const tl = gsap.timeline({ delay: 0.15 });
          tl.fromTo('.hero-arch', { autoAlpha: 0, scale: 0.8, rotate: -4 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' })
            .fromTo('.hero-arch .scoop', { y: -460 }, { y: 0, duration: 0.85, ease: 'power3.in' }, 0.2)
            .to('.hero-arch .scoop', { scaleY: 0.84, scaleX: 1.1, transformOrigin: '50% 90%', duration: 0.12, ease: 'power1.out' })
            .to('.hero-arch .scoop', { scaleY: 1, scaleX: 1, duration: 1, ease: 'elastic.out(1, 0.3)' })
            .to('.title-drip', { scaleY: 1, duration: 1.4, stagger: 0.18, ease: 'power2.out' }, 0.7)
            .fromTo('.hero-scripts', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.9)
            .fromTo('.hero-copy > *', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.8, ease: 'power3.out' }, 0.8)
            .fromTo('.hero-hand', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 1.4)
            .fromTo('.hero-hand path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.25, ease: 'power2.out' }, 1.4)
            .fromTo('.hero-hand-text', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'steps(18)' }, 1.5);
          // drips keep slowly stretching, like they're still melting
          gsap.to('.title-drip', { scaleY: 1.25, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.7, delay: 2.4 });
        })
      );

      // The arch leans toward the pointer
      const rx = gsap.quickTo(tiltRef.current, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      const ry = gsap.quickTo(tiltRef.current, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      const onMove = (e) => {
        const r = root.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ry(x * 14);
        rx(-y * 10);
      };
      const onLeave = () => {
        rx(0);
        ry(0);
      };
      root.current.addEventListener('pointermove', onMove);
      root.current.addEventListener('pointerleave', onLeave);

      // As you scroll away, the drip at the bottom of the hero stretches toward the first flavour.
      gsap.to('.hero-drip path', {
        scaleY: 2.4,
        transformOrigin: '50% 0%',
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero-arch', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero-word', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      });
      return () => {
        alive = false;
        root.current?.removeEventListener('pointermove', onMove);
        root.current?.removeEventListener('pointerleave', onLeave);
      };
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <header ref={root} className="hero" id="top">
      <div className="hero-grid">
        <div className="hero-word">
          <div className="hero-title-wrap">
            {ready ? (
              <SplitText
                text="Jolly"
                tag="h1"
                className="hero-title"
                splitType="chars"
                delay={70}
                duration={1.1}
                ease="back.out(1.8)"
                from={{ opacity: 0, y: 120, rotate: -8 }}
                to={{ opacity: 1, y: 0, rotate: 0 }}
                trigger="load"
                textAlign="left"
                  hoverEffect="lift"
              />
            ) : (
              <h1 className="hero-title" style={{ visibility: 'hidden' }}>
                Jolly
              </h1>
            )}
            <svg className="title-drips" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
              {[
                [92, 34, 120],
                [300, 22, 70],
                [520, 30, 150],
                [660, 18, 60],
                [880, 26, 110]
              ].map(([x, wdt, len], i) => (
                <path
                  key={i}
                  className="title-drip"
                  d={`M${x - wdt} 0 C${x - wdt * 0.5} 0 ${x - wdt * 0.55} ${len * 0.5} ${x - wdt * 0.55} ${len} C${x - wdt * 0.55} ${len + wdt} ${x + wdt * 0.55} ${len + wdt} ${x + wdt * 0.55} ${len} C${x + wdt * 0.55} ${len * 0.5} ${x + wdt * 0.5} 0 ${x + wdt} 0 Z`}
                />
              ))}
            </svg>
          </div>
          <p className="hero-scripts" lang="kn">
            ಜಾಲಿ <span lang="ta">ஜாலி</span>
          </p>
        </div>

        <div className="hero-copy">
          <p className="hero-lede">Ice cream for Bangalore and Salem.</p>
          <p className="hero-sub">
            Five flavours, from the vanilla you grew up with to a guava scoop with a kick of chilli.
          </p>
          <div className="hero-ctas">
            <Magnet padding={60} magnetStrength={3}>
              <a
                href="#flavours"
                className="btn btn--solid"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget('#flavours');
                }}
              >
                Meet the flavours
              </a>
            </Magnet>
            <a
              href="#find-us"
              className="btn btn--ghost"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('#find-us');
              }}
            >
              Find Jolly near you
            </a>
          </div>
        </div>

        <div className="hero-stage">
          <div ref={tiltRef} className="hero-tilt">
            <div className="hero-arch">
              {ASSETS.heroVideo ? (
                <video className="hero-video" src={ASSETS.heroVideo} poster={ASSETS.heroPoster || undefined} autoPlay muted loop playsInline />
              ) : (
                <Cone flavor={strawberry} className="hero-cone" />
              )}
            </div>
          </div>
          <div className="hero-hand" aria-hidden="true">
            <span className="hero-hand-text">strawberry, obviously</span>
            <svg viewBox="0 0 120 90">
              <path pathLength="1" d="M108 8 C 96 40, 70 66, 22 76" />
              <path pathLength="1" d="M36 64 L 20 77 L 38 86" />
            </svg>
          </div>
        </div>
      </div>

      <svg className="hero-drip" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 0 H1440 V40 C1400 40 1396 96 1376 96 C1356 96 1356 40 1320 40 C1200 40 1180 40 1140 40 C1104 40 1104 118 1080 118 C1056 118 1058 40 1020 40 C900 40 860 40 820 40 C790 40 792 80 770 80 C748 80 750 40 720 40 C600 40 520 40 480 40 C446 40 448 108 420 108 C392 108 396 40 360 40 C260 40 220 40 180 40 C150 40 152 76 130 76 C108 76 110 40 80 40 C40 40 20 40 0 40 Z"
          fill="#FFF4CC"
        />
      </svg>
    </header>
  );
}
