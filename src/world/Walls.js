import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createWalls(scene) {
  const radius = CONFIG.mapRadius + 2;
  const height = 22;
  const segments = 96;

  const texLoader = new THREE.TextureLoader();
  const wallTex = texLoader.load('./textures/pocoloco.jpg');
  wallTex.colorSpace = THREE.SRGBColorSpace;
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set((2 * Math.PI * radius) / 18, height / 10);
  wallTex.anisotropy = 8;

  const mat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const geo = new THREE.CylinderGeometry(radius, radius, height, segments, 1, true);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2 - 2;
  mesh.receiveShadow = true;
  mesh.name = 'Walls';

  scene.add(mesh);
  return mesh;
}
