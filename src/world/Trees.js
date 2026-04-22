import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CONFIG, sampleTerrainHeight, rand } from '../config.js';

function loadGLTFTexture(loader, path, isColor, anisotropy) {
  const t = loader.load(path);
  t.flipY = false;
  t.minFilter = THREE.LinearMipMapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = anisotropy;
  if (isColor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createTrees(scene, renderer) {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://unpkg.com/three@0.161.0/examples/jsm/libs/draco/gltf/');
  gltfLoader.setDRACOLoader(dracoLoader);
  const texLoader = new THREE.TextureLoader();
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const colorHD = loadGLTFTexture(texLoader, './textures/color-512_1.jpg', true, anisotropy);
  const normalHD = loadGLTFTexture(texLoader, './textures/normal-512.jpg', false, anisotropy);
  const rmaoHD = loadGLTFTexture(texLoader, './textures/rmao-512.jpg', false, anisotropy);

  const matHD = new THREE.MeshStandardMaterial({
    map: colorHD,
    normalMap: normalHD,
    roughnessMap: rmaoHD,
    aoMap: rmaoHD,
    metalnessMap: rmaoHD,
    metalness: 0,
    roughness: 1,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
  });

  const colorMid = loadGLTFTexture(texLoader, './textures/color.jpg', true, anisotropy);
  const matMID = new THREE.MeshStandardMaterial({
    map: colorMid,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0,
  });

  const impostorTex = texLoader.load('./textures/impostor.png');
  impostorTex.colorSpace = THREE.SRGBColorSpace;
  impostorTex.anisotropy = anisotropy;

  const gltf = await gltfLoader.loadAsync('./models/tree.glb');
  const source = gltf.scene;
  source.traverse((obj) => {
    if (obj.isMesh) {
      if (obj.geometry && !obj.geometry.attributes.uv2 && obj.geometry.attributes.uv) {
        obj.geometry.setAttribute('uv2', obj.geometry.attributes.uv);
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  source.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(source);
  const feetOffset = bbox.min.y;
  source.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      obj.geometry.translate(0, -feetOffset, 0);
    }
  });
  source.updateMatrixWorld(true);

  function makeTreeLOD() {
    const lod = new THREE.LOD();

    const hd = source.clone(true);
    hd.traverse((o) => { if (o.isMesh) { o.material = matHD; o.castShadow = true; o.receiveShadow = true; } });
    lod.addLevel(hd, 0);

    const mid = source.clone(true);
    mid.traverse((o) => { if (o.isMesh) { o.material = matMID; o.castShadow = true; o.receiveShadow = true; } });
    lod.addLevel(mid, CONFIG.trees.lodDistances.mid);

    const impostorMat = new THREE.SpriteMaterial({
      map: impostorTex,
      alphaTest: 0.5,
      depthWrite: true,
    });
    const impostor = new THREE.Sprite(impostorMat);
    impostor.scale.set(5.5, 6.5, 1);
    impostor.position.y = 3;
    lod.addLevel(impostor, CONFIG.trees.lodDistances.far);

    return lod;
  }

  function groundY(x, z, scale) {
    const radius = 1.5 * scale;
    let minH = sampleTerrainHeight(x, z);
    const N = 8;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const sx = x + Math.cos(a) * radius;
      const sz = z + Math.sin(a) * radius;
      const h = sampleTerrainHeight(sx, sz);
      if (h < minH) minH = h;
    }
    return minH - 0.4 * scale;
  }

  const forest = new THREE.Group();
  forest.name = 'Forest';
  const half = CONFIG.mapRadius - 4;
  const R2 = half * half;
  const lakeKeepOut = CONFIG.terrain.basinRadius + CONFIG.terrain.bankWidth;
  let placed = 0;
  let tries = 0;
  const target = CONFIG.trees.count;
  while (placed < target && tries < target * 8) {
    tries++;
    const x = (rand() - 0.5) * half * 2;
    const z = (rand() - 0.5) * half * 2;
    if (x * x + z * z > R2) continue;
    const dLake = Math.hypot(x - CONFIG.terrain.basinCenter.x, z - CONFIG.terrain.basinCenter.z);
    if (dLake < lakeKeepOut) continue;
    const yCenter = sampleTerrainHeight(x, z);
    if (yCenter < CONFIG.terrain.waterLevel + 0.5) continue;

    const lod = makeTreeLOD();
    const scl = CONFIG.trees.minScale + rand() * (CONFIG.trees.maxScale - CONFIG.trees.minScale);
    lod.position.set(x, groundY(x, z, scl), z);
    lod.rotation.y = rand() * Math.PI * 2;
    lod.scale.setScalar(scl);
    forest.add(lod);
    placed++;
  }
  scene.add(forest);

  return { forest };
}
