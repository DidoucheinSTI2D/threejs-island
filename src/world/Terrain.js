import * as THREE from 'three';
import { CONFIG, sampleTerrainHeight } from '../config.js';

const CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/textures/terrain/';
const COLOR_URL = CDN + 'grasslight-big.jpg';
const NORMAL_URL = CDN + 'grasslight-big-nm.jpg';

export function createTerrain(scene) {
  const t = CONFIG.terrain;
  const geometry = new THREE.PlaneGeometry(t.size, t.size, t.segments, t.segments);

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const h = sampleTerrainHeight(x, y);
    pos.setZ(i, h);
  }
  geometry.computeVertexNormals();

  geometry.setAttribute('uv2', geometry.attributes.uv);

  const loader = new THREE.TextureLoader();
  const colorMap = loader.load(COLOR_URL);
  const normalMap = loader.load(NORMAL_URL);
  const roughnessMap = loader.load(COLOR_URL);

  [colorMap, normalMap, roughnessMap].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    tex.anisotropy = 8;
  });
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    roughness: 0.95,
    metalness: 0,
    color: 0x8aa06a,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = 'Terrain';

  scene.add(mesh);
  return mesh;
}
