import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SCOOP } from './Cone.jsx';
import { FLAVORS } from '../flavors.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const NOTES = [
  {
    title: 'Flavour you can name',
    body: 'Every scoop is built around one taste you would recognise with your eyes shut.'
  },
  {
    title: 'Rooted at home',
    body: 'Guava with chilli is the street-cart snack we all grew up on. Now it comes in a cone.'
  },
  {
    title: 'Two cities to start',
    body: 'We are scooping in Bangalore and Salem first. Tell us where you want us next.'
  }
];

// All five flavours stacked on one cone, top to bottom in the order you just met them.
function Stack() {
  const order = [...FLAVORS].reverse();
  return (
    <svg className="stack" viewBox="0 150 300 760" role="img" aria-label="A cone stacked with one scoop of every Jolly flavour">
      <defs>
        <pattern id="waffle-stack" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="#EDBB72" />
          <path d="M0 0 H22 M0 0 V22" stroke="#C98A3E" strokeWidth="4" />
        </pattern>
      </defs>
      <path d="M62 690 L238 690 L158 890 Q150 906 142 890 Z" fill="url(#waffle-stack)" />
      {order.map((f, i) => (
        <g key={f.id} className="stack-scoop" transform={`translate(${26 - (i % 2) * 6 + 3} ${640 - i * 104}) scale(.62)`}>
          <g transform="translate(0 -60)">
            <path d={SCOOP} fill={f.scoop} />
            <path d={SCOOP} fill="none" stroke={f.scoopShade} strokeWidth="6" opacity=".6" />
            <ellipse cx="150" cy="130" rx="30" ry="16" fill="#fff" opacity=".45" transform="rotate(-28 150 130)" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default function Story({ reduced }) {
  const root = useRef(null);
  useGSAP(
    () => {
      if (reduced) return;
      gsap.from('.stack-scoop', {
        y: -380,
        opacity: 0,
        stagger: 0.16,
        duration: 0.9,
        ease: 'bounce.out',
        scrollTrigger: { trigger: '.stack', start: 'top 70%' }
      });
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <section ref={root} className="story" id="story" aria-labelledby="story-title">
      <div className="story-grid">
        <div className="story-head">
          <h2 id="story-title" className="story-title">
            Made for hot afternoons
          </h2>
          <p className="story-lede">
            Jolly is ice cream the way it should be: cold, generous, and a little bit fun. Five flavours, each one with its own
            personality.
          </p>
        </div>
        <div className="story-stack">
          <Stack />
        </div>
        <ul className="story-notes">
          {NOTES.map((n) => (
            <li key={n.title} className="story-note">
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
