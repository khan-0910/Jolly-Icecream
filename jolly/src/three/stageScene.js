import * as THREE from 'three';
import { FLAVORS, STOPS } from '../flavors.js';
import { makeRenderer, makeScoopGeometry, makeScoopMaterial, setPair, makeCone, makeInclusions, rng } from './icecream.js';
import { makeFloaters } from './props.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Where the cone sits at each stop (desktop): offset, size, tilt.
const POSES = [
  { x: 0.1, y: 0.02, s: 1.02, rz: -0.2, rx: 0.16 },
  { x: 0, y: 0.1, s: 0.98, rz: 0.1, rx: 0.2 },
  { x: 0, y: 0.0, s: 1.02, rz: -0.14, rx: 0.26 },
  { x: 0, y: 0.1, s: 0.98, rz: 0.16, rx: 0.18 },
  { x: 0, y: 0.04, s: 1.02, rz: -0.1, rx: 0.3 },
  { x: 0, y: 0.1, s: 0.98, rz: 0.14, rx: 0.22 }
];

export function createStage(canvas, { small, reduced }) {
  const { renderer, scene, camera, key, resize } = makeRenderer(canvas, small);
  const root = new THREE.Group(); // pose
  const spin = new THREE.Group(); // turning
  scene.add(root);
  root.add(spin);
  const mat = makeScoopMaterial(FLAVORS[2]);
  const scoop = new THREE.Mesh(makeScoopGeometry(4, small ? 150 : 220, small ? 100 : 140), mat);
  scoop.castShadow = scoop.receiveShadow = true;
  scoop.position.y = 0.02;
  spin.add(makeCone(), scoop);

  const incl = {};
  const floaters = {};
  FLAVORS.forEach((f, i) => {
    const m = makeInclusions(f.id, i + 3);
    if (m) scoop.add((incl[f.id] = m));
    scene.add((floaters[f.id] = makeFloaters(f.id)));
  });

  // Chilli flakes that rain on the guava scoop
  const FL = 160;
  const flakes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.016, 0.035), new THREE.MeshStandardMaterial({ color: '#C5190F', roughness: 0.6 }), FL);
  flakes.frustumCulled = false;
  flakes.visible = false;
  scene.add(flakes);
  const fs = Array.from({ length: FL }, () => ({ life: 2, p: new THREE.Vector3(), v: 0, r: new THREE.Euler() }));
  let nextFlake = 0;
  let heat = 0;
  const O = new THREE.Object3D();
  const r = rng(8);

  let hw = 1;
  let hh = 1;
  let portrait = false;
  let fits = []; // per stop: how low things may hang, and on tall screens the cone that fits above the copy
  const touch = window.matchMedia('(hover: none)').matches;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { a: 0, v: 0, on: false };
  let intro = reduced ? 1 : 0;
  let introV = 0;
  let time = 0;
  let squash = 0;
  let squashV = 0;
  let lastPair = '';

  // Build every material and upload every mesh now, so no flavour stutters on first sight.
  flakes.visible = true;
  scene.traverse((o) => (o.frustumCulled = false));
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  flakes.visible = false;

  return {
    drag,
    // tops: where each stop's copy starts, in pixels. roof: how high the cone may reach.
    resize(w, h, tall, tops, roof) {
      resize(w, h);
      hh = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      hw = hh * camera.aspect;
      portrait = tall;
      const up = (px) => hh - (px / h) * 2 * hh;
      fits = tops.map((top) => {
        const floor = up(top);
        const s = Math.max(0.3, Math.min(clamp(hw / 2.5, 0.42, 0.78), (up(roof) - floor) / 4.2));
        return { floor, s, y: Math.max(Math.min(hh * 0.19, up(roof) - s * 1.05), floor + s * 3.15) };
      });
    },
    pointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    dragBy(dx) {
      drag.v = dx * 0.35;
      drag.a += dx * 0.008;
    },
    poke() {
      if (!reduced) squashV -= 2.6;
    },
    chilli() {
      heat = Math.min(1, heat + 0.25);
      if (reduced) return;
      squashV -= 2;
      flakes.visible = true;
      for (let i = 0; i < 40; i++) {
        const f = fs[nextFlake++ % FL];
        f.life = 0;
        f.v = 0;
        f.p.set((r() - 0.5) * 2, hh + 0.2 + r() * 1.6, (r() - 0.5) * 1.4 + 0.5);
        f.r.set(r() * 6, r() * 6, r() * 6);
      }
    },
    // Stop i pouring into stop j; f is how far along (0..1).
    frame(i, j, f, dt) {
      time += dt;
      const step = Math.min(dt, 0.03);
      const a = FLAVORS[STOPS[i].flavor];
      const b = FLAVORS[STOPS[j].flavor];
      const pour = smooth(clamp((f - 0.08) / 0.8));
      const pair = `${i}|${j}|${pour.toFixed(3)}`;
      if (pair !== lastPair) {
        lastPair = pair;
        setPair(mat, a, b, pour);
        const edge = lerp(1.5, -1.6, pour);
        Object.entries(incl).forEach(([id, m]) => {
          m.userData.reveal((y) => {
            const covered = clamp((y - edge) * 5);
            return Math.max(a.id === id ? 1 - covered : 0, b.id === id ? covered : 0);
          });
        });
      }
      if ((f < 0.5 ? i : j) !== STOPS.length - 1) heat = Math.max(0, heat - dt);
      const u = mat.userData.u;
      u.uHeat.value += (heat - u.uHeat.value) * Math.min(1, dt * 3);
      u.uMelt.value = 0.12 + Math.sin(f * Math.PI) * 0.6 + (reduced ? 0 : Math.sin(time * 0.7) * 0.06);

      // entrance and poke springs
      introV += ((1 - intro) * 46 - introV * 8.5) * step;
      intro += introV * step;
      squashV += (-squash * 190 - squashV * 9) * step;
      squash += squashV * step;

      // no cursor to follow on a touch screen, so the scene drifts by itself
      if (touch && !reduced) {
        ptr.tx = Math.sin(time * 0.5) * 0.7;
        ptr.ty = Math.cos(time * 0.37) * 0.5;
      }
      const k = 1 - Math.exp(-dt * 5);
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      if (!drag.on) {
        drag.a += drag.v * dt * 1.2;
        drag.v *= Math.exp(-dt * 2.4);
        if (Math.abs(drag.v) < 0.15) drag.a += (Math.round(drag.a / (Math.PI * 2)) * Math.PI * 2 - drag.a) * (1 - Math.exp(-dt * 1.2));
      }

      const e = smooth(f);
      const P = (n) => lerp(POSES[i][n], POSES[j][n], e);
      const fit = (n) => lerp(fits[i][n], fits[j][n], e);
      const ms = portrait ? fit('s') : clamp(hw / 3.4, 0.7, 1);
      const s = (portrait ? 1 : P('s')) * ms * (1 + Math.sin(f * Math.PI) * 0.1);
      root.position.set(P('x') * (portrait ? 0 : 1), (portrait ? fit('y') : P('y')) - (1 - intro) * hh * 2.4 + (reduced ? 0 : Math.sin(time * 0.9) * 0.035), 0);
      root.scale.set(s * (1 - squash * 0.5), s * (1 + squash), s * (1 - squash * 0.5));
      root.rotation.set(P('rx') - ptr.y * 0.12, 0, P('rz') - ptr.x * 0.06 + (1 - intro) * 0.8);
      spin.rotation.y = (i + e) * Math.PI * 2 + 0.5 + ptr.x * 0.4 + drag.a - (1 - intro) * 5 + (reduced ? 0 : Math.sin(time * 0.35) * 0.16);

      // Ingredients: each flavour's set arrives as it pours, and is thrown up as the next one does.
      FLAVORS.forEach((fl, fi) => {
        const from = STOPS[i].flavor === fi;
        const to = STOPS[j].flavor === fi;
        const vin = from ? clamp(intro) : to ? clamp((f - 0.38) / 0.62) : 0;
        const out = from && !to ? clamp(f / 0.6) : 0;
        floaters[fl.id].userData.place(vin, out, reduced ? 0 : time, hw, hh, portrait, ptr.x, ptr.y, fit('floor'));
      });

      if (flakes.visible) {
        let alive = false;
        fs.forEach((fl, n) => {
          if (fl.life < 1.6) {
            alive = true;
            fl.life += dt;
            fl.v += dt * 9;
            fl.p.y -= fl.v * dt;
            fl.r.x += dt * 8;
          }
          const landed = Math.hypot(fl.p.x - root.position.x, fl.p.y - root.position.y) < 0.85 * s && fl.p.z < 0.9;
          if (landed) fl.life = 2;
          O.position.copy(fl.p);
          O.rotation.copy(fl.r);
          O.scale.setScalar(fl.life < 1.6 ? 1 : 0.0001);
          O.updateMatrix();
          flakes.setMatrixAt(n, O.matrix);
        });
        flakes.instanceMatrix.needsUpdate = true;
        flakes.visible = alive;
      }
      key.target.position.copy(root.position);
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose?.();
      });
      scene.environment?.dispose();
      renderer.dispose();
    }
  };
}
