import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { CONFIG, rand } from '../config.js';

const FLOWER_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/models/gltf/Flower/Flower.glb';

const BLOSSOM_PALETTE = [
  0xf2d479, 0xf2c879, 0xf2b077,
  0xe89898, 0xb04848, 0x9a6ec0,
  0xe8d6cc, 0xffffff, 0xf2d479,
];

const COUNT = 900;

export async function createPlants(scene, terrainMesh) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(FLOWER_URL);

  const stemSrc = gltf.scene.getObjectByName('Stem');
  const blossomSrc = gltf.scene.getObjectByName('Blossom');
  gltf.scene.updateMatrixWorld(true);

  const stemGeo = stemSrc.geometry.clone();
  const blossomGeo = blossomSrc.geometry.clone();
  stemGeo.applyMatrix4(stemSrc.matrixWorld);
  blossomGeo.applyMatrix4(blossomSrc.matrixWorld);

  stemGeo.computeBoundingBox();
  const bb = stemGeo.boundingBox;
  const dx = bb.max.x - bb.min.x;
  const dy = bb.max.y - bb.min.y;
  const dz = bb.max.z - bb.min.z;
  const orient = new THREE.Matrix4();
  if (dx > dy && dx > dz) {
    orient.makeRotationZ(Math.PI / 2);
  } else if (dz > dy && dz > dx) {
    orient.makeRotationX(-Math.PI / 2);
  }
  stemGeo.applyMatrix4(orient);
  blossomGeo.applyMatrix4(orient);

  const scaleM = new THREE.Matrix4().makeScale(5, 5, 5);
  stemGeo.applyMatrix4(scaleM);
  blossomGeo.applyMatrix4(scaleM);

  stemGeo.computeBoundingBox();
  blossomGeo.computeBoundingBox();
  const box = new THREE.Box3().copy(stemGeo.boundingBox).union(blossomGeo.boundingBox);
  const feetOffset = box.min.y;
  stemGeo.translate(0, -feetOffset, 0);
  blossomGeo.translate(0, -feetOffset, 0);

  const stemMat = stemSrc.material;
  const blossomMat = blossomSrc.material;
  stemMat.side = THREE.DoubleSide;
  blossomMat.side = THREE.DoubleSide;

  const stems = new THREE.InstancedMesh(stemGeo, stemMat, COUNT);
  const blossoms = new THREE.InstancedMesh(blossomGeo, blossomMat, COUNT);
  stems.castShadow = true; stems.receiveShadow = true;
  blossoms.castShadow = true; blossoms.receiveShadow = true;
  stems.name = 'PlantStems';
  blossoms.name = 'PlantBlossoms';

  const color = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    color.setHex(BLOSSOM_PALETTE[Math.floor(rand() * BLOSSOM_PALETTE.length)]);
    blossoms.setColorAt(i, color);
  }

  terrainMesh.updateMatrixWorld(true);
  const worldGeo = terrainMesh.geometry.clone();
  worldGeo.applyMatrix4(terrainMesh.matrixWorld);
  const samplerMesh = new THREE.Mesh(worldGeo);
  const sampler = new MeshSurfaceSampler(samplerMesh).build();

  const basin = CONFIG.terrain.basinCenter;
  const lakeKeepOut = CONFIG.terrain.basinRadius + CONFIG.terrain.bankWidth - 1;
  const half = CONFIG.mapRadius;
  const R2 = CONFIG.mapRadius * CONFIG.mapRadius;
  const waterFloor = CONFIG.terrain.waterLevel + 0.15;

  const dummy = new THREE.Object3D();
  const pos = new THREE.Vector3();
  const nrm = new THREE.Vector3();

  let placed = 0;
  let tries = 0;
  const maxTries = COUNT * 20;
  while (placed < COUNT && tries < maxTries) {
    tries++;
    sampler.sample(pos, nrm);
    if (pos.x * pos.x + pos.z * pos.z > R2) continue;
    if (Math.hypot(pos.x - basin.x, pos.z - basin.z) < lakeKeepOut) continue;
    if (pos.y < waterFloor) continue;

    const scl = 0.6 + rand() * 0.9;
    dummy.position.copy(pos);
    dummy.position.y -= 0.05 * scl;
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(scl, scl, scl);
    dummy.updateMatrix();

    stems.setMatrixAt(placed, dummy.matrix);
    blossoms.setMatrixAt(placed, dummy.matrix);
    placed++;
  }

  stems.count = placed;
  blossoms.count = placed;
  stems.instanceMatrix.needsUpdate = true;
  blossoms.instanceMatrix.needsUpdate = true;
  if (blossoms.instanceColor) blossoms.instanceColor.needsUpdate = true;

  worldGeo.dispose();

  const group = new THREE.Group();
  group.name = 'Plants';
  group.add(stems);
  group.add(blossoms);
  scene.add(group);
  return group;
}
