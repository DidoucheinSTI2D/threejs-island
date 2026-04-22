import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG, sampleTerrainHeight, rand } from '../config.js';

function groundMin(x, z, r) {
  let minH = sampleTerrainHeight(x, z);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = sampleTerrainHeight(x + Math.cos(a) * r, z + Math.sin(a) * r);
    if (h < minH) minH = h;
  }
  return minH;
}

export function createBushes(scene) {
  const texLoader = new THREE.TextureLoader();

  const baseColor = texLoader.load('./textures/BaseColor.png');
  const normalMap = texLoader.load('./textures/Normal.png');
  const orm = texLoader.load('./textures/OcclusionRoughnessMetallic.png');

  baseColor.colorSpace = THREE.SRGBColorSpace;
  [baseColor, normalMap, orm].forEach((t) => { t.anisotropy = 4; });

  const planeSize = 1.6;
  const a = new THREE.PlaneGeometry(planeSize, planeSize);
  a.translate(0, planeSize / 2, 0);

  const b = new THREE.PlaneGeometry(planeSize, planeSize);
  b.rotateY(Math.PI / 2);
  b.translate(0, planeSize / 2, 0);

  const crossGeo = BufferGeometryUtils.mergeGeometries([a, b]);
  crossGeo.setAttribute('uv2', crossGeo.attributes.uv);

  const material = new THREE.MeshStandardMaterial({
    map: baseColor,
    normalMap: normalMap,
    roughnessMap: orm,
    aoMap: orm,
    metalnessMap: orm,
    metalness: 0,
    roughness: 1,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
  });

  const count = CONFIG.bushes.count;
  const mesh = new THREE.InstancedMesh(crossGeo, material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'Bushes';

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const axisY = new THREE.Vector3(0, 1, 0);
  const half = CONFIG.mapRadius;
  const R2 = CONFIG.mapRadius * CONFIG.mapRadius;
  const basin = CONFIG.terrain.basinCenter;
  const lakeKeepOut = CONFIG.terrain.basinRadius + CONFIG.terrain.bankWidth - 1;

  let placed = 0;
  let tries = 0;
  const maxTries = count * 6;
  while (placed < count && tries < maxTries) {
    tries++;
    const x = (rand() - 0.5) * half * 2;
    const z = (rand() - 0.5) * half * 2;
    if (x * x + z * z > R2) continue;
    if (Math.hypot(x - basin.x, z - basin.z) < lakeKeepOut) continue;

    const scl = CONFIG.bushes.minScale + rand() * (CONFIG.bushes.maxScale - CONFIG.bushes.minScale);
    const footprint = planeSize * 0.45 * scl;
    const y = groundMin(x, z, footprint) - 0.1 * scl;
    if (y < CONFIG.terrain.waterLevel + 0.1) continue;

    p.set(x, y, z);
    q.setFromAxisAngle(axisY, rand() * Math.PI * 2);
    s.set(scl, scl, scl);
    m.compose(p, q, s);
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;

  scene.add(mesh);
  return mesh;
}
