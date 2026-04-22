import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

export function createCamera(renderer) {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far,
  );
  camera.position.set(
    CONFIG.camera.start.x,
    CONFIG.camera.start.y,
    CONFIG.camera.start.z,
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(
    CONFIG.camera.target.x,
    CONFIG.camera.target.y,
    CONFIG.camera.target.z,
  );
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 160;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();

  const keys = Object.create(null);
  const arrows = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
  window.addEventListener('keydown', (e) => {
    if (arrows.has(e.code)) { keys[e.code] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (arrows.has(e.code)) { keys[e.code] = false; e.preventDefault(); }
  });

  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const move = new THREE.Vector3();
  const SPEED = 22;
  const HALF = CONFIG.terrain.size / 2 - 3;

  function updateMovement(delta) {
    let kz = 0, kx = 0;
    if (keys['ArrowUp']    || keys['KeyW']) kz += 1;
    if (keys['ArrowDown']  || keys['KeyS']) kz -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) kx += 1;
    if (keys['ArrowLeft']  || keys['KeyA']) kx -= 1;
    if (kz === 0 && kx === 0) return;

    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) return;
    fwd.normalize();
    right.crossVectors(fwd, up).normalize();

    move.set(0, 0, 0);
    move.addScaledVector(fwd, kz * SPEED * delta);
    move.addScaledVector(right, kx * SPEED * delta);

    const nextX = camera.position.x + move.x;
    const nextZ = camera.position.z + move.z;
    if (Math.abs(nextX) > HALF || Math.abs(nextZ) > HALF) return;

    camera.position.add(move);
    controls.target.add(move);
  }

  return { camera, controls, updateMovement };
}
