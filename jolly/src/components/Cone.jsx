import { forwardRef, useId, useMemo } from 'react';

// Hand-drawn cone art. Every flavour gets its own inclusions so no two scoops look alike.

const SCOOP =
  'M58 250 C50 150 120 78 200 76 C280 78 350 150 342 250 C344 268 330 276 318 268 C312 300 296 318 286 296 ' +
  'C282 284 276 276 262 280 C252 284 250 300 246 330 C243 352 222 352 220 330 C218 300 214 284 200 282 ' +
  'C184 282 178 292 170 300 C162 308 150 304 148 292 C146 280 136 276 124 280 C112 284 110 310 104 318 ' +
  'C96 330 82 326 82 310 C82 296 78 282 66 276 C56 270 56 260 58 250 Z';

const CONE = 'M86 262 L314 262 L210 572 Q200 594 190 572 Z';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random points that sit inside the dome of the scoop.
function domePoints(count, seed, pad = 0) {
  const r = rng(seed);
  const pts = [];
  while (pts.length < count) {
    const x = 200 + (r() * 2 - 1) * (128 - pad);
    const y = 175 + (r() * 2 - 1) * (95 - pad);
    const nx = (x - 200) / (130 - pad);
    const ny = (y - 180) / (100 - pad);
    if (nx * nx + ny * ny < 1 && y < 262) pts.push({ x, y, r: r(), s: r(), t: r() });
  }
  return pts;
}

function Inclusions({ id }) {
  const pts = useMemo(() => {
    switch (id) {
      case 'vanilla':
        return domePoints(46, 7);
      case 'cookies':
        return domePoints(15, 21, 10);
      case 'strawberry':
        return domePoints(10, 33, 14);
      case 'irish':
        return domePoints(22, 45);
      case 'guava':
        return domePoints(26, 58);
      default:
        return [];
    }
  }, [id]);

  if (id === 'vanilla') {
    return (
      <g className="incl incl-vanilla">
        {pts.map((p, i) => (
          <ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx={1.4 + p.r * 1.6}
            ry={0.9 + p.s}
            transform={`rotate(${p.t * 180} ${p.x} ${p.y})`}
            fill="#3B2414"
            opacity={0.55 + p.r * 0.4}
          />
        ))}
      </g>
    );
  }

  if (id === 'cookies') {
    return (
      <g className="incl incl-cookies">
        {pts.map((p, i) => {
          const s = 7 + p.r * 13;
          const d = `M${-s} ${-s * 0.4} L${-s * 0.2} ${-s} L${s} ${-s * 0.5} L${s * 0.7} ${s * 0.6} L${-s * 0.4} ${s * 0.8} Z`;
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.t * 360})`} className="cookie-chunk">
              <path d={d} fill="#2B2125" />
              <path d={d} fill="none" stroke="#4A3B40" strokeWidth="1.5" transform="scale(.55)" />
            </g>
          );
        })}
        {domePoints(40, 99).map((p, i) => (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r={1 + p.r * 2} fill="#2B2125" opacity=".7" />
        ))}
      </g>
    );
  }

  if (id === 'strawberry') {
    return (
      <g className="incl incl-strawberry">
        <path
          d="M90 200 C130 170 160 230 200 196 C240 162 270 220 312 190"
          fill="none"
          stroke="#F0708F"
          strokeWidth="9"
          strokeLinecap="round"
          opacity=".55"
        />
        {pts.map((p, i) => {
          const s = 10 + p.r * 9;
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.t * 360})`}>
              <path d={`M0 ${-s} C${s} ${-s} ${s} ${s * 0.4} 0 ${s} C${-s} ${s * 0.4} ${-s} ${-s} 0 ${-s} Z`} fill="#D93A63" />
              <circle cx={-s * 0.3} cy={-s * 0.2} r="1.3" fill="#FFE7A8" />
              <circle cx={s * 0.3} cy={s * 0.1} r="1.3" fill="#FFE7A8" />
              <circle cx={0} cy={s * 0.5} r="1.3" fill="#FFE7A8" />
            </g>
          );
        })}
      </g>
    );
  }

  if (id === 'irish') {
    return (
      <g className="incl incl-irish">
        <path
          className="irish-ribbon"
          d="M78 214 C110 150 170 230 210 168 C240 122 300 160 324 206"
          fill="none"
          stroke="#8C5530"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M104 248 C150 210 196 262 240 226 C270 202 300 222 320 240"
          fill="none"
          stroke="#A86B3E"
          strokeWidth="7"
          strokeLinecap="round"
          opacity=".7"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1 + p.r * 1.4} fill="#5A3519" opacity=".5" />
        ))}
      </g>
    );
  }

  if (id === 'guava') {
    return (
      <g className="incl incl-guava">
        {pts.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={p.y}
            width={2 + p.r * 2.4}
            height={1.4 + p.s * 1.4}
            rx=".6"
            transform={`rotate(${p.t * 180} ${p.x} ${p.y})`}
            fill="#B71D16"
            opacity={0.6 + p.r * 0.4}
          />
        ))}
      </g>
    );
  }
  return null;
}

function GuavaSlice() {
  return (
      <g className="guava-slice" transform="translate(262 96) rotate(18)">
        <ellipse cx="0" cy="0" rx="44" ry="30" fill="#8FC266" />
        <ellipse cx="0" cy="0" rx="38" ry="25" fill="#E7F3C9" />
        <ellipse cx="0" cy="0" rx="33" ry="21" fill="#FF8579" />
        <ellipse cx="0" cy="0" rx="17" ry="11" fill="#FF6E66" />
        {[[-8, -4], [6, -6], [-2, 5], [10, 4], [-12, 3], [2, -1]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" fill="#FFE9C9" />
        ))}
        {domePoints(9, 7).map((p, i) => (
          <rect key={`c${i}`} x={(p.x - 200) * 0.25} y={(p.y - 175) * 0.2} width="2.6" height="1.6" fill="#B71D16" />
        ))}
      </g>
  );
}

const Cone = forwardRef(function Cone({ flavor, className = '', children }, ref) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg ref={ref} className={`cone ${className}`} viewBox="0 0 400 600" role="img" aria-label={`${flavor.name} ice cream cone`}>
      <defs>
        <pattern id={`waffle-${uid}`} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="26" height="26" fill="#EDBB72" />
          <path d="M0 0 H26 M0 0 V26" stroke="#C98A3E" strokeWidth="5" />
          <path d="M4 4 H22" stroke="#F6D196" strokeWidth="2" opacity=".6" />
        </pattern>
        <radialGradient id={`shade-${uid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={flavor.scoop} />
          <stop offset="65%" stopColor={flavor.scoop} />
          <stop offset="100%" stopColor={flavor.scoopShade} />
        </radialGradient>
        <clipPath id={`scoopclip-${uid}`}>
          <path d={SCOOP} />
        </clipPath>
      </defs>

      <g className="cone-body">
        <path d={CONE} fill={`url(#waffle-${uid})`} />
        <path d={CONE} fill="none" stroke="#B57A33" strokeWidth="3" strokeLinejoin="round" opacity=".5" />
        <path d="M86 262 L314 262 L306 286 L94 286 Z" fill="#D9A257" opacity=".75" />
      </g>

      <g className="scoop">
        <ellipse cx="200" cy="292" rx="122" ry="10" fill="#7A4A1E" opacity=".18" />
        <path d={SCOOP} fill={`url(#shade-${uid})`} />
        <g clipPath={`url(#scoopclip-${uid})`}>
          <Inclusions id={flavor.id} />
          {children}
        </g>
        {flavor.id === 'guava' && <GuavaSlice />}
        <ellipse cx="148" cy="128" rx="34" ry="18" fill="#fff" opacity=".45" transform="rotate(-28 148 128)" />
        <ellipse cx="128" cy="160" rx="7" ry="5" fill="#fff" opacity=".5" />
      </g>
    </svg>
  );
});

export default Cone;
export { SCOOP };
