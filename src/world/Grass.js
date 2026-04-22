import * as THREE from 'three';
import { CONFIG, sampleTerrainHeight, rand } from '../config.js';

export function createGrass(scene) {
  const texLoader = new THREE.TextureLoader();

  const colorMap = texLoader.load('./textures/color.png');
  const rmaoMap = texLoader.load('./textures/rmao.png');

  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 4;
  rmaoMap.anisotropy = 4;

  const geo = new THREE.PlaneGeometry(1, 1.2);
  geo.translate(0, 0.6, 0);

  const mat = new THREE.MeshStandardMaterial({
    map: colorMap,
    alphaMap: colorMap,
    roughnessMap: rmaoMap,
    aoMap: rmaoMap,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
    roughness: 0.95,
    metalness: 0,
    color: 0xb6c170,
  });

  const userTime = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = userTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float sway = sin(uTime * 1.8 + position.x * 0.6 + position.z * 0.4) * 0.12;
         transformed.x += sway * uv.y;`,
      );
    mat.userData.shader = shader;
  };

  const count = CONFIG.grass.count;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 1, 0);
  const half = CONFIG.mapRadius;
  const R2 = CONFIG.mapRadius * CONFIG.mapRadius;
  const islandR = CONFIG.island.radius + 1;

  let placed = 0;
  let tries = 0;
  const maxTries = count * 5;
  while (placed < count && tries < maxTries) {
    tries++;
    const x = (rand() - 0.5) * half * 2;
    const z = (rand() - 0.5) * half * 2;
    if (x * x + z * z > R2) continue;
    if (x * x + z * z < islandR * islandR) continue;
    const y = sampleTerrainHeight(x, z);
    if (y < CONFIG.terrain.waterLevel) continue;

    p.set(x, y, z);
    q.setFromAxisAngle(axis, rand() * Math.PI * 2);
    const scl = CONFIG.grass.minScale + rand() * (CONFIG.grass.maxScale - CONFIG.grass.minScale);
    s.set(scl, scl, scl);
    m.compose(p, q, s);
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;

  scene.add(mesh);
  return { mesh, update: (t) => { userTime.value = t; } };
}
