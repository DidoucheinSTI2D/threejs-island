import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CONFIG } from '../config.js';

const VEGAS_URL = './models/ntgl_just_vegas_pod.glb';

export async function createIsland(scene) {
  const group = new THREE.Group();
  group.name = 'Island';

  const { radius, topHeight, vegasScale } = CONFIG.island;
  const waterY = CONFIG.terrain.waterLevel;
  const topY = waterY + topHeight;
  const bottomY = waterY - CONFIG.terrain.basinDepth - 0.5;
  const h = topY - bottomY;

  const geo = new THREE.CylinderGeometry(radius, radius * 1.25, h, 48, 1, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6a5338,
    roughness: 1,
    metalness: 0,
  });
  const base = new THREE.Mesh(geo, mat);
  base.position.y = bottomY + h / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const grassTop = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.95, 32),
    new THREE.MeshStandardMaterial({ color: 0x7a8f54, roughness: 0.95, metalness: 0 }),
  );
  grassTop.rotation.x = -Math.PI / 2;
  grassTop.position.y = topY + 0.01;
  grassTop.receiveShadow = true;
  group.add(grassTop);

  const gltfLoader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.161.0/examples/jsm/libs/draco/gltf/');
  gltfLoader.setDRACOLoader(draco);

  try {
    const gltf = await gltfLoader.loadAsync(VEGAS_URL);
    const vegas = gltf.scene;
    vegas.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    vegas.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(vegas);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = (vegasScale * radius * 2) / maxDim;
    vegas.scale.setScalar(scale);

    vegas.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(vegas);
    vegas.position.set(0, topY - scaledBox.min.y + 0.05, 0);
    group.add(vegas);
  } catch (err) {
    console.warn('[Island] Vegas model failed to load:', err.message);
  }

  scene.add(group);
  return group;
}
