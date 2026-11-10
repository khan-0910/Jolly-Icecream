// Background world for each flavour. Each bit floats at its own depth and leans toward the pointer.

const Pod = () => (
  <svg viewBox="0 0 40 300">
    <path d="M22 6 C34 80 30 200 14 294" fill="none" stroke="#3E2414" strokeWidth="11" strokeLinecap="round" />
    <path d="M22 10 C33 80 29 200 14 290" fill="none" stroke="#6B4127" strokeWidth="3" strokeLinecap="round" opacity=".6" />
  </svg>
);

const Drop = ({ c = '#FFFBEA' }) => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill={c} />
    <ellipse cx="36" cy="32" rx="12" ry="7" fill="#fff" opacity=".7" transform="rotate(-30 36 32)" />
  </svg>
);

const Cookie = () => (
  <svg viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="54" fill="#2A2024" />
    <circle cx="60" cy="60" r="44" fill="none" stroke="#3D3035" strokeWidth="3" />
    {[0, 45, 90, 135].map((a) => (
      <path key={a} d="M60 26 L60 94" stroke="#3D3035" strokeWidth="3" transform={`rotate(${a} 60 60)`} />
    ))}
    <circle cx="60" cy="60" r="10" fill="#3D3035" />
  </svg>
);

const Chunk = () => (
  <svg viewBox="0 0 100 80">
    <path d="M8 30 L40 6 L92 22 L80 70 L22 74 Z" fill="#2A2024" />
    <path d="M30 34 L48 22 L70 32 L62 52 L36 54 Z" fill="#3D3035" />
  </svg>
);

const Berry = () => (
  <svg viewBox="0 0 120 140">
    <path d="M60 30 C110 26 118 70 92 106 C80 124 68 134 60 134 C52 134 40 124 28 106 C2 70 10 26 60 30 Z" fill="#E2476B" />
    <path d="M60 30 C110 26 118 70 92 106" fill="none" stroke="#C7305A" strokeWidth="6" opacity=".5" />
    {[[40, 56], [60, 50], [80, 58], [48, 78], [70, 76], [90, 80], [36, 96], [58, 100], [78, 100], [60, 120]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2.4" ry="3.6" fill="#FFE6A3" />
    ))}
    <path d="M60 34 L40 16 L56 22 L60 4 L66 22 L82 14 L70 34 Z" fill="#6DB35A" />
  </svg>
);

const Bean = () => (
  <svg viewBox="0 0 80 100">
    <ellipse cx="40" cy="50" rx="30" ry="42" fill="#5A3519" />
    <path d="M40 10 C24 40 56 60 40 90" fill="none" stroke="#2E1A0C" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const Swirl = () => (
  <svg viewBox="0 0 600 600">
    <path
      d="M300 300 m-40 0 a40 40 0 1 1 80 0 a90 90 0 1 1 -180 0 a140 140 0 1 1 280 0 a190 190 0 1 1 -380 0 a240 240 0 1 1 480 0"
      fill="none"
      stroke="#C9A07A"
      strokeWidth="26"
      strokeLinecap="round"
      opacity=".55"
    />
  </svg>
);

const GuavaHalf = () => (
  <svg viewBox="0 0 160 160">
    <circle cx="80" cy="80" r="74" fill="#93C568" />
    <circle cx="80" cy="80" r="66" fill="#EAF5CF" />
    <circle cx="80" cy="80" r="60" fill="#FF8478" />
    <circle cx="80" cy="80" r="30" fill="#FF6A62" />
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return <circle key={i} cx={80 + Math.cos(a) * 20} cy={80 + Math.sin(a) * 20} r="3.4" fill="#FFE8C8" />;
    })}
    {Array.from({ length: 22 }, (_, i) => {
      const a = i * 2.4;
      const r = 36 + ((i * 7) % 20);
      return <rect key={`c${i}`} x={80 + Math.cos(a) * r} y={80 + Math.sin(a) * r} width="4" height="2.4" fill="#B71D16" transform={`rotate(${i * 33} ${80 + Math.cos(a) * r} ${80 + Math.sin(a) * r})`} />;
    })}
  </svg>
);

const Chilli = () => (
  <svg viewBox="0 0 200 80">
    <path d="M20 40 C60 70 140 70 182 26 C186 22 180 16 176 20 C140 44 80 40 30 26 C16 22 12 34 20 40 Z" fill="#D2231B" />
    <path d="M40 34 C80 46 130 46 170 26" fill="none" stroke="#FF6A55" strokeWidth="4" strokeLinecap="round" opacity=".6" />
    <path d="M178 22 C186 14 192 8 198 8" fill="none" stroke="#4E8F3A" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const WORLDS = {
  vanilla: [
    { C: Pod, x: 6, y: 8, s: 9, d: 1.4, r: 18 },
    { C: Pod, x: 34, y: 97, s: 6, d: 0.8, r: 82 },
    { C: Drop, x: 46, y: 6, s: 5, d: 2 },
    { C: Drop, x: 92, y: 14, s: 3.5, d: 1.2 },
    { C: Drop, x: 14, y: 78, s: 6, d: 0.6 },
    { C: Drop, x: 62, y: 86, s: 3, d: 1.8 }
  ],
  cookies: [
    { C: Cookie, x: 8, y: 12, s: 9, d: 1.6, r: 12 },
    { C: Cookie, x: 88, y: 86, s: 12, d: 0.7, r: -20 },
    { C: Chunk, x: 50, y: 8, s: 6, d: 2.2, r: 40 },
    { C: Chunk, x: 92, y: 18, s: 5, d: 1.1, r: -60 },
    { C: Chunk, x: 5, y: 92, s: 7, d: 1.9, r: 100 },
    { C: Chunk, x: 60, y: 88, s: 4, d: 2.6, r: 10 }
  ],
  strawberry: [
    { C: Berry, x: 6, y: 10, s: 9, d: 1.5, r: -14, fall: true },
    { C: Berry, x: 86, y: 84, s: 11, d: 0.8, r: 20, fall: true },
    { C: Berry, x: 52, y: 4, s: 5, d: 2.2, r: 30, fall: true },
    { C: Berry, x: 22, y: 80, s: 6, d: 1.2, r: -40, fall: true },
    { C: Berry, x: 94, y: 14, s: 4.5, d: 2, r: 8, fall: true }
  ],
  irish: [
    { C: Swirl, x: 62, y: 46, s: 62, d: 0.4, spin: true },
    { C: Bean, x: 8, y: 14, s: 5, d: 1.8, r: 30 },
    { C: Bean, x: 90, y: 16, s: 4, d: 1.2, r: -40 },
    { C: Bean, x: 14, y: 82, s: 4.5, d: 2.2, r: 70 },
    { C: Bean, x: 50, y: 90, s: 3.5, d: 1, r: -10 }
  ],
  guava: [
    { C: GuavaHalf, x: 6, y: 10, s: 12, d: 1.2, r: 0 },
    { C: GuavaHalf, x: 90, y: 88, s: 15, d: 0.7, r: 40 },
    { C: Chilli, x: 48, y: 8, s: 13, d: 2, r: -12 },
    { C: Chilli, x: 86, y: 14, s: 9, d: 1.5, r: 150 },
    { C: Chilli, x: 18, y: 84, s: 10, d: 2.4, r: 30 }
  ]
};

export default function Decor({ id }) {
  const bits = WORLDS[id] || [];
  return (
    <div className={`decor decor--${id}`} aria-hidden="true">
      {bits.map(({ C, x, y, s, d, r = 0, fall, spin }, i) => (
        <div
          key={i}
          className={`bit ${fall ? 'bit--fall' : ''} ${spin ? 'bit--spin' : ''}`}
          style={{ left: `${x}%`, top: `${y}%`, width: `${s}vmax`, '--d': d, '--r': `${r}deg`, '--delay': `${i * -1.7}s` }}
        >
          <div className="bit-inner">
            <C />
          </div>
        </div>
      ))}
    </div>
  );
}
