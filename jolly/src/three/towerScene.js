import * as THREE from 'three';
import { FLAVORS } from '../flavors.js';
import { makeRenderer, makeScoopGeometry, makeScoopMaterial, makeCone, makeInclusions } from './icecream.js';

// A cone you can stack. Each scoop is the child of the one below, so the tower bends like a real one.
export function createTower(canvas, { small, reduced }) {
  const { renderer, scene, camera, resize } = makeRenderer(canvas, small);
  const root = new THREE.Group();
  scene.add(root);
  root.add(makeCone());
  const geos = [2, 5, 7].map((n) => makeScoopGeometry(n, small ? 110 : 150, small ? 76 : 100, 0.75));
  const list = [];
  const touch = window.matchMedia('(hover: none)').matches;
  let sway = 0;
  let swayV = 0;
  let tx = 0;
  let rot = 0.4;
  let time = 0;
  let hh = 1;
  let hw = 1;
  let vs = 0.6;
  let vy = 0;

  // Warm up one of each scoop so the first drop doesn't stutter.
  const warm = new THREE.Group();
  geos.forEach((g) => warm.add(new THREE.Mesh(g, makeScoopMaterial(FLAVORS[0]))));
  FLAVORS.forEach((f) => {
    const inc = makeInclusions(f.id);
    if (inc) warm.add(inc);
  });
  scene.add(warm);
  warm.traverse((o) => {
    o.frustumCulled = false;
    o.castShadow = o.receiveShadow = true;
  });
  renderer.render(scene, camera);
  renderer.getContext().readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4)); // wait for the GPU to finish
  warm.removeFromParent();

  return {
    resize(w, h) {
      resize(w, h);
      hh = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      hw = hh * camera.aspect;
    },
    pointer(x) {
      tx = reduced ? 0 : x;
    },
    add(f) {
      const i = list.length;
      const g = new THREE.Group();
      const m = new THREE.Mesh(geos[i % 3], makeScoopMaterial(f));
      m.castShadow = m.receiveShadow = true;
      m.rotation.y = i * 2.1;
      const inc = makeInclusions(f.id, i + 3);
      if (inc) m.add(inc);
      m.material.userData.u.uMelt.value = 0.15;
      g.add(m);
      (i ? list[i - 1].g : root).add(g);
      list.push({ g, m, off: reduced ? 0 : 5, v: 0, sq: 0, sqv: 0, landed: reduced });
    },
    clear() {
      list[0]?.g.removeFromParent();
      list.forEach((s) => s.m.material.dispose());
      list.length = 0;
    },
    frame(dt) {
      dt = Math.min(dt, 0.033);
      time += dt;
      list.forEach((s, i) => {
        if (!s.landed) {
          s.v += 30 * dt;
          s.off -= s.v * dt;
          if (s.off <= 0) {
            s.off = 0;
            s.landed = true;
            s.sqv = -3.4;
            list.forEach((o, j) => j < i && (o.sqv -= 1.4 / (i - j)));
            swayV += (i % 2 ? 1 : -1) * (0.14 + i * 0.07);
          }
        }
        s.sqv += (-s.sq * 210 - s.sqv * 8) * dt;
        s.sq += s.sqv * dt;
        s.g.position.y = (i ? 0.99 + list[i - 1].sq * 0.6 : 0.02) + s.off;
        s.m.scale.set(1 - s.sq * 0.5, 1 + s.sq, 1 - s.sq * 0.5);
      });
      if (touch && !reduced) tx = Math.sin(time * 0.6) * 0.7;
      swayV += ((tx * 0.05 - sway) * 26 - swayV * 2.6) * dt;
      sway += swayV * dt;
      const idle = reduced ? 0 : Math.sin(time * 1.1) * 0.008;
      list.forEach((s, i) => (s.g.rotation.z = i ? -(sway + idle) * (0.6 + i * 0.35) : 0));
      if (!reduced) rot += dt * 0.18;
      root.rotation.set(0.06, 0, -sway * 0.4);
      root.children.forEach((c) => c.isMesh && (c.rotation.y = rot));
      list.forEach((s, i) => (s.m.rotation.y = i * 2.1 + rot));
      const topY = 1.05 + (Math.max(1, list.length) - 1);
      const want = Math.min((hh * 1.62) / (topY + 3.15), hw / 1.5);
      const k = reduced ? 1 : 1 - Math.exp(-dt * 4);
      vs += (want - vs) * k;
      vy += (-((topY - 3.15) / 2) * want - hh * 0.06 - vy) * k;
      root.scale.setScalar(vs);
      root.position.y = vy;
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
