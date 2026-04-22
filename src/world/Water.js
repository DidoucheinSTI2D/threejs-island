import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { CONFIG } from '../config.js';

const WATER_NORMALS_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/textures/waternormals.jpg';

export function createWater(scene, sunPosition) {
  const texLoader = new THREE.TextureLoader();
  const waterNormals = texLoader.load(WATER_NORMALS_URL, (t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  });
  waterNormals.wrapS = THREE.RepeatWrapping;
  waterNormals.wrapT = THREE.RepeatWrapping;

  const t = CONFIG.terrain;
  const geometry = new THREE.CircleGeometry(t.basinRadius, 96);

  const water = new Water(geometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals,
    sunDirection: sunPosition.clone().normalize(),
    sunColor: 0xfff0c8,
    waterColor: 0x0a3540,
    distortionScale: 3.2,
    fog: true,
  });

  water.rotation.x = -Math.PI / 2;
  water.position.set(t.basinCenter.x, t.waterLevel, t.basinCenter.z);
  water.name = 'Water';

  scene.add(water);
  return water;
}
