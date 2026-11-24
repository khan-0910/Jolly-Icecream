import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { rng } from './icecream.js';

const perlin = new ImprovedNoise();

const std = (color, roughness = 0.5, extra) => new THREE.MeshPhysicalMaterial({ color, roughness, envMapIntensity: 0.8, ...extra });
const mesh = (g, m) => new THREE.Mesh(g, m);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// A tube whose radius follows fn(t)
function taper(points, fn, seg = 40, rad = 14) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const p = g.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, c);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(fn(i / seg)).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

function strawberry() {
  const g = new THREE.Group();
  const prof = [[0, -1.05], [0.16, -1.0], [0.42, -0.72], [0.66, -0.25], [0.78, 0.2], [0.74, 0.48], [0.52, 0.66], [0.2, 0.68], [0, 0.64]];
  const curve = new THREE.CatmullRomCurve3(prof.map(([x, y]) => V(x, y)));
  const pts = curve.getPoints(48).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  g.add(mesh(new THREE.LatheGeometry(pts, 48), std('#DE1538', 0.28, { clearcoat: 0.7, clearcoatRoughness: 0.25 })));
  const seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), std('#FFD66E', 0.5), 90);
  const o = new THREE.Object3D();
  for (let i = 0; i < 90; i++) {
    const p = curve.getPoint(0.1 + (i / 90) * 0.66);
    const a = i * 2.39996;
    o.position.set(Math.cos(a) * p.x, p.y, Math.sin(a) * p.x);
    o.lookAt(0, p.y * 0.6, 0);
    o.scale.set(0.02, 0.042, 0.014);
    o.updateMatrix();
    seeds.setMatrixAt(i, o.matrix);
  }
  g.add(seeds);
  const leaf = std('#4F9A34', 0.6, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const l = mesh(new THREE.SphereGeometry(1, 14, 10), leaf);
    const a = (i / 7) * Math.PI * 2;
    l.scale.set(0.34, 0.035, 0.13);
    l.position.set(Math.cos(a) * 0.3, 0.71 + (i % 2) * 0.03, Math.sin(a) * 0.3);
    l.rotation.set(0, -a, -0.1 + (i % 3) * 0.16);
    g.add(l);
  }
  g.add(mesh(taper([V(0, 0.66), V(0.02, 0.85), V(0.1, 1.02)], () => 0.05, 12, 8), leaf));
  return g;
}

function berrySlice() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(0.5, -0.8, 0.85, 0, 0.75, 0.4);
  s.bezierCurveTo(0.6, 0.75, 0.2, 0.7, 0, 0.55);
  s.bezierCurveTo(-0.2, 0.7, -0.6, 0.75, -0.75, 0.4);
  s.bezierCurveTo(-0.85, 0, -0.5, -0.8, 0, -1);
  g.add(mesh(
    new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 24 }),
    std('#DE1538', 0.3, { clearcoat: 0.6 })
  ));
  [['#FF8FA0', 0.8, 0.235], ['#FFD9DC', 0.5, 0.245], ['#FF9FAC', 0.22, 0.255]].forEach(([c, k, z]) => {
    [z, 0.18 - z].forEach((zz) => {
      const m = mesh(new THREE.ShapeGeometry(s, 24), std(c, 0.35, { side: THREE.DoubleSide }));
      m.scale.set(k, k, 1);
      m.position.set(0, -0.02, zz);
      g.add(m);
    });
  });
  return g;
}

function cookie() {
  const g = new THREE.Group();
  const dark = std('#3A2523', 0.8);
  const prof = [[0, 0.1], [0.3, 0.1], [0.34, 0.14], [0.4, 0.14], [0.44, 0.1], [0.58, 0.1], [0.7, 0.1], [0.74, 0.14], [0.8, 0.14], [0.84, 0.1], [0.92, 0.1], [0.98, 0.06], [0.98, -0.06], [0.9, -0.1], [0, -0.1]];
  const wafer = new THREE.LatheGeometry(prof.reverse().map(([x, y]) => new THREE.Vector2(x, y)), 144);
  const p = wafer.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getZ(i));
    const a = Math.atan2(p.getZ(i), p.getX(i));
    if (p.getY(i) > 0.08) {
      const k = r > 0.82 ? Math.cos(a * 36) * 0.025 : r > 0.5 && r < 0.65 ? Math.max(0, Math.cos(a * 8)) * 0.06 : 0;
      p.setY(i, p.getY(i) + k);
    }
  }
  wafer.computeVertexNormals();
  const a = mesh(wafer, dark);
  a.position.y = 0.2;
  const b = mesh(wafer, dark);
  b.rotation.x = Math.PI;
  b.position.y = -0.2;
  g.add(a, b, mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.22, 56), std('#FFF7EC', 0.55)));
  return g;
}

function crumb(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    const k = 0.95 + 0.5 * perlin.noise(x * 1.4 + seed, y * 1.4, z * 1.4) + 0.16 * perlin.noise(x * 5, y * 5 + seed, z * 5);
    p.setXYZ(i, x * k, y * k * 0.72, z * k);
  }
  geo.computeVertexNormals();
  return mesh(geo, std('#3F2926', 0.9, { flatShading: true }));
}

function bean() {
  const geo = new THREE.SphereGeometry(1, 56, 40);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    let z = p.getZ(i);
    if (z > 0) {
      const gx = x - Math.sin(y * 2.4) * 0.1;
      z = z * 0.55 - 0.3 * Math.exp(-(gx * gx) / 0.008) * (1 - y * y * 0.6);
    } else z *= 0.8;
    p.setXYZ(i, x * 0.72, y, z);
  }
  geo.computeVertexNormals();
  return mesh(geo, std('#4A2410', 0.38, { clearcoat: 0.35, clearcoatRoughness: 0.4 }));
}

function caramel() {
  return mesh(new RoundedBoxGeometry(1.3, 1, 1.3, 5, 0.2), std('#C9742A', 0.22, { clearcoat: 0.9, clearcoatRoughness: 0.18 }));
}

function guava() {
  const g = new THREE.Group();
  const skin = mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), std('#93B83C', 0.5, { clearcoat: 0.2 }));
  skin.rotation.x = Math.PI;
  skin.scale.y = 0.95;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  const gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  [[0, '#FF7F7B'], [0.5, '#FF6E70'], [0.62, '#FF8E86'], [0.86, '#FFB5A3'], [0.93, '#F3E5B8'], [1, '#C5DB74']].forEach(([s, k]) => gr.addColorStop(s, k));
  c.fillStyle = gr;
  c.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = mesh(new THREE.CircleGeometry(1, 56), std('#ffffff', 0.35, { map: tex, clearcoat: 0.4 }));
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.004;
  const seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), std('#FFE3A8', 0.4), 46);
  const o = new THREE.Object3D();
  const r = rng(99);
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39996;
    const d = 0.1 + Math.sqrt(i / 46) * 0.48;
    o.position.set(Math.cos(a) * d, 0.015, Math.sin(a) * d);
    o.rotation.set(0, r() * 6, 0);
    o.scale.set(0.05, 0.028, 0.034);
    o.updateMatrix();
    seeds.setMatrixAt(i, o.matrix);
  }
  g.add(skin, face, seeds);
  return g;
}

function chilli() {
  const g = new THREE.Group();
  g.add(mesh(
    taper([V(-1.2, 0.3), V(-0.6, 0.36), V(0.1, 0.12), V(0.8, -0.3), V(1.35, -0.85)], (t) => 0.02 + 0.23 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, 0.22 + t * 0.78))), 0.8) * (1 - t * 0.35), 56, 20),
    std('#D5170E', 0.2, { clearcoat: 1, clearcoatRoughness: 0.12 })
  ));
  g.add(mesh(taper([V(-1.14, 0.3), V(-1.32, 0.3), V(-1.5, 0.4), V(-1.72, 0.62)], (t) => 0.17 - Math.min(0.11, t * 0.35), 20, 12), std('#4E8B2C', 0.5)));
  return g;
}

function pod() {
  return mesh(
    taper([V(-1.5, 0.35), V(-0.8, -0.12), V(0, -0.05), V(0.8, 0.22), V(1.5, 0.02), V(1.75, -0.2)], (t) => 0.025 + 0.095 * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.35), 70, 10),
    std('#2B160B', 0.45, { clearcoat: 0.4 })
  );
}

function blossom() {
  const g = new THREE.Group();
  const petal = std('#FFF7DC', 0.55, { side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.SphereGeometry(1, 24, 16);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      p.setXYZ(k, x, p.getY(k) * 0.05 + x * x * 0.22, p.getZ(k) * (1 - 0.35 * x));
    }
    geo.computeVertexNormals();
    const m = mesh(geo, petal);
    const a = (i / 6) * Math.PI * 2;
    m.scale.set(0.5, 1, 0.24);
    m.position.set(Math.cos(a) * 0.52, (i % 2) * 0.05, Math.sin(a) * 0.52);
    m.rotation.y = -a;
    g.add(m);
  }
  g.add(mesh(taper([V(0, 0), V(0, 0.25), V(0, 0.5)], (k) => 0.12 + k * k * 0.18, 16, 18), std('#FFB41F', 0.5, { side: THREE.DoubleSide })));
  return g;
}

const KIT = {
  vanilla: [blossom, pod],
  cookies: [cookie, crumb],
  strawberry: [strawberry, berrySlice],
  irish: [bean, caramel],
  guava: [guava, chilli]
};

// The angle that shows each prop at its best; they rock gently around it.
const FACE = {
  vanilla: [[1.0, 0, 0], [0.2, 0.2, 0]],
  cookies: [[1.0, 0, 0.3], [0, 0, 0]],
  strawberry: [[0.35, 0, 0.3], [0, 0.35, 0.2]],
  irish: [[0, 0.1, 0.5], [0.6, 0.7, 0.1]],
  guava: [[1.05, 0, 0.35], [0, 0, 0]]
};

// x, y are shares of the half-screen; z is depth; s is size; k picks the prop.
const SPOTS = [
  { x: -0.62, y: 0.3, z: 0.4, s: 0.42, k: 0 },
  { x: 0.63, y: 0.46, z: -1, s: 0.46, k: 1 },
  { x: -0.34, y: -0.36, z: -0.6, s: 0.28, k: 1 },
  { x: 0.4, y: -0.18, z: 1, s: 0.34, k: 0 },
  { x: -0.93, y: -0.1, z: 1.6, s: 0.4, k: 1 },
  { x: 0.95, y: 0.06, z: 1.2, s: 0.4, k: 0 },
  { x: -0.2, y: 0.72, z: -1.6, s: 0.26, k: 0 },
  { x: 0.28, y: 0.74, z: -1.2, s: 0.24, k: 1 }
];

export function makeFloaters(id) {
  const r = rng(id.length * 137 + id.charCodeAt(0));
  const group = new THREE.Group();
  const cache = {};
  SPOTS.forEach((sp, i) => {
    const proto = (cache[sp.k] ??= KIT[id][sp.k](i + 1));
    const o = proto.clone();
    const [fx, fy, fz] = FACE[id][sp.k];
    o.userData = { sp, rot: [fx + (r() - 0.5) * 0.7, fy + (r() - 0.5) * 0.8, fz + (r() - 0.5) * 1.6], sp1: 0.25 + r() * 0.3, ph: r() * 6, dir: r() > 0.5 ? 1 : -1 };
    group.add(o);
  });
  // vin: 0..1 arriving from below. out: 0..1 thrown upward.
  group.userData.place = (vin, out, time, hw, hh, small, mx, my, floor) => {
    group.visible = vin > 0.001 && out < 0.999;
    if (!group.visible) return;
    group.children.forEach((o, i) => {
      const { sp, rot, sp1, ph, dir } = o.userData;
      const stag = Math.min(1, Math.max(0, vin * 1.5 - i * 0.06));
      const e = 1 - Math.pow(1 - stag, 3);
      const near = (sp.z + 2) * 0.5;
      const size = sp.s * (small ? 0.5 : 1);
      // keep out of the copy: it sits bottom left, or across the bottom on tall screens
      const low = small || sp.x < -0.5 ? floor + size * 1.3 : sp.x < -0.25 ? floor + size * 0.2 : -hh;
      const py = Math.max((small ? sp.y * 0.62 + 0.12 : sp.y) * hh, low);
      o.position.set(
        sp.x * (small ? 0.92 : 1) * hw + mx * 0.14 * near,
        py + Math.sin(time * sp1 * 2 + ph) * 0.07 - (1 - e) * (hh * 2.1 + i * 0.3) + out * out * (hh * 2.4 + (i % 3) * 0.6) + my * 0.1 * near,
        sp.z
      );
      o.rotation.set(rot[0] + Math.sin(time * sp1 + ph) * 0.3 + (1 - e) * 4, rot[1] + Math.sin(time * sp1 * 0.8 + ph * 2) * 0.4 + out * 2, rot[2] + Math.sin(time * sp1 * 0.6 + ph) * 0.25 + out * 3 * dir);
      o.scale.setScalar(size * (0.3 + 0.7 * e));
    });
  };
  return group;
}
