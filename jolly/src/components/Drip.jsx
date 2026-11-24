import { dripPath, makeDrips } from '../drip.js';

// A strip of the section above, dripping into the one below.
export default function Drip({ color, seed = 1 }) {
  return (
    <svg className="drip" viewBox="0 120 1440 190" preserveAspectRatio="none" aria-hidden="true">
      <path d={dripPath(1440, 420, 0.5, makeDrips(seed))} fill={color} />
    </svg>
  );
}
