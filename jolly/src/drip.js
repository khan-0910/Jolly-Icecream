function seeded(seed) {
  let a = seed;
  return () => ((a = (a * 16807) % 2147483647), (a - 1) / 2147483646);
}

export function makeDrips(seed) {
  const r = seeded(17 + seed * 101);
  const count = 7 + Math.floor(r() * 4);
  return Array.from({ length: count }, (_, k) => ({
    x: (k + 0.25 + r() * 0.5) / count,
    w: 0.035 + r() * 0.05,
    len: 0.35 + r() * 0.65,
    phase: r() * Math.PI * 2
  })).sort((a, b) => b.x - a.x);
}

// A melting edge: a flood of colour from the top with rounded drips running ahead of it.
export function dripPath(w, h, p, drips) {
  if (p <= 0.0001) return 'M0 0 Z';
  if (p >= 0.9999) return `M0 0 H${w} V${h} H0 Z`;
  const maxDrip = h * 0.34;
  const env = Math.sin(Math.PI * Math.min(1, p * 1.08));
  const L = -maxDrip * 0.9 + p * (h + maxDrip * 0.9);
  const n = (v) => v.toFixed(1);
  let d = `M0 0 H${w} V${n(L)}`;
  let prevX = w;
  drips.forEach((dr) => {
    const cx = dr.x * w;
    const hw = Math.max(16, dr.w * w) / 2;
    const len = Math.max(0, maxDrip * dr.len * env + Math.sin(p * 9) * 6 * Math.sin(dr.phase));
    const sag = 10 * Math.sin(dr.phase + p * 7);
    const a = hw * 0.58;
    d += ` Q${n((prevX + cx + hw) / 2)} ${n(L + sag)} ${n(cx + hw)} ${n(L)}`;
    d += ` C${n(cx + hw * 0.35)} ${n(L)} ${n(cx + a)} ${n(L + len * 0.5)} ${n(cx + a)} ${n(L + len)}`;
    d += ` C${n(cx + a)} ${n(L + len + hw * 0.85)} ${n(cx - a)} ${n(L + len + hw * 0.85)} ${n(cx - a)} ${n(L + len)}`;
    d += ` C${n(cx - a)} ${n(L + len * 0.5)} ${n(cx - hw * 0.35)} ${n(L)} ${n(cx - hw)} ${n(L)}`;
    prevX = cx - hw;
  });
  return d + ` Q${n(prevX / 2)} ${n(L)} 0 ${n(L)} Z`;
}
