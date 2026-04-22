import * as THREE from 'three';
import { CONFIG, rand, sampleTerrainHeight } from '../config.js';

const LOGOS = [
  { url: './textures/Claude.png', size: 2.8, color: 0xffffff },
  { url: './textures/Hetic.png',  size: 2.8, color: 0xffffff },
];
const LOGO_COUNT_PER_GROUP = 250;

function createGroup(count, texUrl, size, color) {
  const bounds = CONFIG.particles.bounds;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const fallRates = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (rand() - 0.5) * bounds.x * 2;
    positions[i * 3 + 1] = rand() * bounds.y;
    positions[i * 3 + 2] = (rand() - 0.5) * bounds.z * 2;
    phases[i] = rand() * Math.PI * 2;
    fallRates[i] = 0.6 + rand() * 1.4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const texLoader = new THREE.TextureLoader();
  const tex = texLoader.load(texUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const material = new THREE.PointsMaterial({
    size,
    map: tex,
    alphaMap: tex,
    alphaTest: 0.25,
    transparent: true,
    depthWrite: false,
    color,
    sizeAttenuation: true,
    blending: THREE.NormalBlending,
    fog: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return { points, geometry, phases, fallRates };
}

export function createParticles(scene) {
  const bounds = CONFIG.particles.bounds;
  const baseFall = CONFIG.particles.fallSpeed;

  const groups = LOGOS.map((l) => createGroup(LOGO_COUNT_PER_GROUP, l.url, l.size, l.color));
  groups.forEach((g) => scene.add(g.points));

  function updateGroup(g, delta, t) {
    const arr = g.geometry.attributes.position.array;
    const n = arr.length / 3;
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      arr[i3 + 1] -= baseFall * g.fallRates[i] * delta;
      arr[i3 + 0] += Math.sin(t * 0.8 + g.phases[i]) * 0.35 * delta;
      arr[i3 + 2] += Math.cos(t * 0.6 + g.phases[i] * 1.3) * 0.25 * delta;

      const y = arr[i3 + 1];
      const gy = sampleTerrainHeight(arr[i3], arr[i3 + 2]);
      if (y < gy - 0.2) {
        arr[i3 + 0] = (rand() - 0.5) * bounds.x * 2;
        arr[i3 + 1] = bounds.y * (0.7 + rand() * 0.3);
        arr[i3 + 2] = (rand() - 0.5) * bounds.z * 2;
      }
    }
    g.geometry.attributes.position.needsUpdate = true;
  }

  function update(delta, t) {
    for (const g of groups) updateGroup(g, delta, t);
  }

  return { update };
}
