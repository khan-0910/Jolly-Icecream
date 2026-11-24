import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const perlin = new ImprovedNoise();
const noise = (x, y, z) => perlin.noise(x, y, z);

export function rng(seed) {
  let a = seed;
  return () => ((a = (a * 16807) % 2147483647), (a - 1) / 2147483646);
}

// Joins a grid of (rows+1) x (cols+1) points into a smooth surface and hides the seam.
function skin(pos, cols, rows) {
  const idx = [];
  const W = cols + 1;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = j * W + i;
      idx.push(a, a + 1, a + W, a + 1, a + W + 1, a + W);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nn = g.attributes.normal;
  const t = new THREE.Vector3();
  for (let j = 0; j <= rows; j++) {
    const a = j * W;
    const b = a + cols;
    t.set(nn.getX(a) + nn.getX(b), nn.getY(a) + nn.getY(b), nn.getZ(a) + nn.getZ(b)).normalize();
    nn.setXYZ(a, t.x, t.y, t.z);
    nn.setXYZ(b, t.x, t.y, t.z);
  }
  return g;
}

/* ---------- Scoop: a dome with a ruffled skirt and drips, all one skin ---------- */
export function makeScoopGeometry(seed = 1, segU = 200, segV = 130, dripScale = 1) {
  const r = rng(seed * 977 + 13);
  const drips = Array.from({ length: 12 }, (_, i) => ({
    a: ((i + r() * 0.7) / 12) * Math.PI * 2,
    w: 0.085 + r() * 0.055,
    l: (0.06 + Math.pow(r(), 1.6) * 0.62) * dripScale
  }));
  const skirt = new THREE.CatmullRomCurve3(
    [[0.989, -0.148], [1.06, -0.26], [1.1, -0.36], [1.04, -0.47], [0.93, -0.47], [0.7, -0.36]].map(([x, y]) => new THREE.Vector3(x, y, 0))
  );
  const pos = [];
  const drip = [];
  const tmp = new THREE.Vector3();
  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    for (let i = 0; i <= segU; i++) {
      const th = ((i % segU) / segU) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      let rad;
      let y;
      let d = 0;
      if (v < 0.58) {
        const phi = (v / 0.58) * 1.72;
        rad = Math.sin(phi);
        y = Math.cos(phi);
      } else {
        const t = (v - 0.58) / 0.42;
        skirt.getPoint(t, tmp);
        const bell = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 1.4);
        drips.forEach((k) => {
          const da = Math.atan2(Math.sin(th - k.a), Math.cos(th - k.a));
          d += k.l * Math.exp(-(da * da) / (2 * k.w * k.w));
        });
        d *= Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 1.15))), 1.25);
        rad = tmp.x + bell * 0.07 * noise(c * 3.2 + seed, s * 3.2, 4) - d * 0.2;
        y = tmp.y + bell * 0.09 * noise(c * 2.4, s * 2.4 + seed, 9) - d;
      }
      // craggy scooped surface
      const px = c * rad;
      const pz = s * rad;
      const q = seed * 3.1;
      const big = noise(px * 1.5 + q, y * 1.5, pz * 1.5) * 0.06;
      const ridge = (0.5 - Math.abs(noise(px * 3 + q, y * 6.5, pz * 3))) * 0.05;
      const fine = noise(px * 11 + q, y * 13, pz * 11) * 0.012;
      const k = 1 + (big + ridge + fine) * (d > 0.05 ? 0.35 : 1);
      pos.push(px * k, y * (v < 0.58 ? k : 1), pz * k);
      drip.push(d);
    }
  }
  const g = skin(pos, segU, segV);
  g.setAttribute('aDrip', new THREE.Float32BufferAttribute(drip, 1));
  return g;
}

const GLSL = /* glsl */ `
varying vec3 vP;
uniform vec3 uColA, uShadeA, uBitA, uColB, uShadeB, uBitB;
uniform float uTypeA, uTypeB, uPour, uHeat;
float h31(vec3 p){ p=fract(p*vec3(.1031,.11369,.13787)); p+=dot(p,p.yzx+19.19); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fb(vec3 p){ return vn(p)*.55+vn(p*2.1+3.)*.3+vn(p*4.3+7.)*.15; }
float speck(vec3 p, float size, float keep){ vec3 c=floor(p); vec3 f=fract(p)-.5;
  vec3 o=(vec3(h31(c),h31(c+17.),h31(c+41.))-.5)*.45;
  float on=step(h31(c+73.),keep); vec3 q=f-o; q.x*=.8+h31(c+5.)*1.4;
  return on*(1.-smoothstep(size*.75,size,length(q))); }
vec3 flav(float ty, vec3 col, vec3 shade, vec3 bit, vec3 p){
  vec3 c=mix(shade,col,smoothstep(.25,.62,fb(p*2.6)));
  if(ty<.5){ c=mix(c,bit,speck(p*13.,.17,.5)*.85); c=mix(c,bit,speck(p*21.+4.,.16,.35)*.7); }
  else if(ty<1.5){ c=mix(c,bit,speck(p*5.5+fb(p*7.)*.8,.34,.45)); c=mix(c,bit,speck(p*13.+2.,.3,.4)*.9); }
  else if(ty<2.5){ float b=abs(sin(p.y*4.2+fb(p*1.7)*9.+p.x*1.4)); c=mix(c,bit,(1.-smoothstep(.05,.3,b))*.62); c=mix(c,bit,speck(p*8.,.26,.3)*.75); }
  else if(ty<3.5){ float b=abs(sin(p.y*2.6+fb(p*1.2+2.)*8.-p.z*1.1)); c=mix(c,bit,(1.-smoothstep(.08,.3,b))*.9); }
  else { c=mix(c,col*1.06,fb(p*5.)*.5); c=mix(c,bit,speck(p*11.,.22,.22+uHeat*.75)); c=mix(c,bit,speck(p*18.+3.,.24,.22+uHeat*.75)); c=mix(c,vec3(.75,.06,.03),uHeat*.85*smoothstep(-.5,1.,p.y)); }
  return c; }
float pourEdge(vec3 p){ float a=atan(p.z,p.x);
  return p.y+.16*sin(a*5.+1.)+.12*sin(a*9.+2.4)+.1*sin(a*14.)-mix(1.5,-1.6,uPour); }
`;

export function makeScoopMaterial(a, b = a) {
  const C = (h) => new THREE.Color(h);
  const u = {
    uColA: { value: C(a.col) }, uShadeA: { value: C(a.shade) }, uBitA: { value: C(a.bit) }, uTypeA: { value: a.type },
    uColB: { value: C(b.col) }, uShadeB: { value: C(b.shade) }, uBitB: { value: C(b.bit) }, uTypeB: { value: b.type },
    uPour: { value: 0 }, uHeat: { value: 0 }, uMelt: { value: 0 }
  };
  const m = new THREE.MeshPhysicalMaterial({ roughness: 0.52, clearcoat: 0.28, clearcoatRoughness: 0.4, envMapIntensity: 0.75 });
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = 'attribute float aDrip; uniform float uMelt; varying vec3 vP;\n' + s.vertexShader.replace(
      '#include <begin_vertex>',
      'vP=position; vec3 transformed=position; transformed.y-=aDrip*uMelt; transformed.xz*=1.-aDrip*uMelt*.2;'
    );
    s.fragmentShader = GLSL + s.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float pe=pourEdge(vP); float pm=smoothstep(-.012,.012,pe);
        vec3 ic=vec3(0.);
        if(pm<1.) ic+=flav(uTypeA,uColA,uShadeA,uBitA,vP)*(1.-pm); // only pay for the flavour on show
        if(pm>0.) ic+=flav(uTypeB,uColB,uShadeB,uBitB,vP)*pm;
        ic*=1.-.28*(1.-pm)*smoothstep(-.16,0.,pe)*step(.001,uPour);
        diffuseColor.rgb=ic;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 q=vP*15.; float e=.35; float n0=fb(q);
          vec3 g=vec3(fb(q+vec3(e,0,0))-n0,fb(q+vec3(0,e,0))-n0,fb(q+vec3(0,0,e))-n0);
          float lip=smoothstep(.0,.05,pe)*(1.-smoothstep(.05,.13,pe))*step(.001,uPour)*step(uPour,.999);
          vec3 gv=(viewMatrix*vec4(g,0.)).xyz;
          normal=normalize(normal-gv*.85+vec3(0.,-.7,0.)*lip); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float fr=pow(1.-clamp(dot(normalize(vViewPosition),normal),0.,1.),2.); totalEmissiveRadiance+=diffuseColor.rgb*(.05+.22*fr); }`);
  };
  return m;
}

export function setPair(mat, a, b, pour) {
  const u = mat.userData.u;
  u.uColA.value.set(a.col); u.uShadeA.value.set(a.shade); u.uBitA.value.set(a.bit); u.uTypeA.value = a.type;
  u.uColB.value.set(b.col); u.uShadeB.value.set(b.shade); u.uBitB.value.set(b.bit); u.uTypeB.value = b.type;
  u.uPour.value = pour;
}

/* ---------- Waffle cone: real relief on the outline, per-pixel detail inside it ---------- */
export function makeCone(segU = 168, segV = 140) {
  const pos = [];
  const base = [];
  const top = -0.36;
  const tip = -3.15;
  const tri = (x) => Math.abs((((x % 1) + 1) % 1) - 0.5) * 2;
  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    const y = top + (tip - top) * v;
    const r0 = 0.9 * Math.pow(1 - v, 0.96) + 0.035;
    for (let i = 0; i <= segU; i++) {
      const th = ((i % segU) / segU) * Math.PI * 2;
      const a = (th / (Math.PI * 2)) * 14;
      const w = -Math.log(1.06 - v) * 4.2; // keeps the diamonds square as the cone narrows
      const r = r0 * (1 + 0.035 * Math.max(Math.pow(tri(a + w), 4), Math.pow(tri(a - w), 4)));
      base.push(Math.cos(th) * r0, y, Math.sin(th) * r0);
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
    }
  }
  const g = skin(base, segU, segV); // smooth normals; the shader adds the ridges
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide, envMapIntensity: 0.7 });
  mat.onBeforeCompile = (s) => {
    s.vertexShader = 'varying vec3 vP;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvP=position;');
    s.fragmentShader = `varying vec3 vP; uniform mat3 normalMatrix;
      float ch(vec3 p){ return fract(sin(dot(p,vec3(12.99,78.23,37.72)))*43758.5); }
      float cn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(ch(i),ch(i+vec3(1,0,0)),f.x),mix(ch(i+vec3(0,1,0)),ch(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(ch(i+vec3(0,0,1)),ch(i+vec3(1,0,1)),f.x),mix(ch(i+vec3(0,1,1)),ch(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float triw(float x){ return abs(fract(x)-.5)*2.; }
      float waf(vec3 p){ float v=clamp((p.y+.36)/(-2.79),0.,1.); float a=(atan(p.z,p.x)/6.2831853+1.)*14.; float w=-log(1.06-v)*4.2;
        return max(smoothstep(.45,.95,triw(a+w)),smoothstep(.45,.95,triw(a-w))); }
      ` + s.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float wr=waf(vP); float wn=cn(vP*9.)*.6+cn(vP*34.)*.4;
        diffuseColor.rgb=mix(vec3(.40,.155,.03),vec3(.90,.52,.17),.2+.8*wr)*(.82+.36*wn);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float e=.006; float h0=wr*.05+wn*.01;
          #define HG(o) (waf(vP+o)*.05+(cn((vP+o)*9.)*.6+cn((vP+o)*34.)*.4)*.01)
          vec3 g=vec3(HG(vec3(e,0,0))-h0,HG(vec3(0,e,0))-h0,HG(vec3(0,0,e))-h0)/e;
          vec3 gv=normalMatrix*g; gv-=normal*dot(gv,normal);
          normal=normalize(normal-gv*.9); }`);
  };
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* ---------- Bits pressed into the scoop ---------- */
const lump = (seed, flat) => {
  const g = flat ? new THREE.IcosahedronGeometry(1, 1) : new THREE.SphereGeometry(1, 18, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 + 0.5 * noise(p.getX(i) * 1.3 + seed, p.getY(i) * 1.3, p.getZ(i) * 1.3);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.75, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
};
const INCL = {
  cookies: { n: 24, s: [0.06, 0.15], color: '#21171A', rough: 0.85, flat: true, out: 1.01 },
  strawberry: { n: 13, s: [0.06, 0.12], color: '#D01745', rough: 0.25, flat: false, out: 1.0 },
  guava: { n: 60, s: [0.018, 0.034], color: '#C0180F', rough: 0.5, flat: true, out: 1.03 }
};
export function makeInclusions(id, seed = 5) {
  const k = INCL[id];
  if (!k) return null;
  const r = rng(seed * 331 + 7);
  const mat = new THREE.MeshStandardMaterial({ color: k.color, roughness: k.rough, flatShading: k.flat });
  const mesh = new THREE.InstancedMesh(lump(seed, k.flat), mat, k.n);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  const items = Array.from({ length: k.n }, (_, i) => {
    const y = 1 - ((i + 0.5) / k.n) * 1.08;
    const a = i * 2.39996 + r() * 0.5;
    const q = Math.sqrt(Math.max(0, 1 - y * y));
    return {
      p: new THREE.Vector3(Math.cos(a) * q, y, Math.sin(a) * q).multiplyScalar(k.out),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)),
      s: k.s[0] + r() * (k.s[1] - k.s[0])
    };
  });
  const M = new THREE.Matrix4();
  const S = new THREE.Vector3();
  // amount(y) returns 0..1: how far each bit has popped out of the scoop
  mesh.userData.reveal = (amount) => {
    let any = false;
    items.forEach((it, i) => {
      const v = amount(it.p.y);
      if (v > 0.01) any = true;
      M.compose(it.p, it.q, S.setScalar(Math.max(0.0001, it.s * v)));
      mesh.setMatrixAt(i, M);
    });
    mesh.visible = any;
    mesh.instanceMatrix.needsUpdate = true;
  };
  mesh.userData.reveal(() => 1);
  return mesh;
}

/* ---------- Renderer and light rig shared by both scenes ---------- */
export function makeRenderer(canvas, small) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.55;
  pm.dispose();
  const key = new THREE.DirectionalLight('#FFF3E0', 2.6);
  key.position.set(-4.5, 6, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 512 : 1024, small ? 512 : 1024);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 4.5, bottom: -4.5, near: 1, far: 18 });
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 5;
  const rim = new THREE.DirectionalLight('#ffffff', 2.2);
  rim.position.set(5, 2.5, -4);
  scene.add(key, rim, key.target);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.position.set(0, 0, 12);
  const resize = (w, h) => {
    // about a 1080p frame at most: what integrated graphics can draw at full speed
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75, Math.sqrt(1.8e6 / (w * h || 1))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  return { renderer, scene, camera, key, resize };
}
