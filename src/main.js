import * as THREE from 'three';

import { CONFIG } from './config.js';
import { createRenderer } from './core/Renderer.js';
import { createCamera } from './core/Camera.js';
import { createLights } from './core/Lights.js';
import { createPostFX } from './core/PostFX.js';

import { createSky } from './world/Sky.js';
import { createTerrain } from './world/Terrain.js';
import { createGrass } from './world/Grass.js';
import { createBushes } from './world/Bushes.js';
import { createPlants } from './world/Plants.js';
import { createTrees } from './world/Trees.js';
import { createWater } from './world/Water.js';
import { createWalls } from './world/Walls.js';
import { createIsland } from './world/Island.js';

import { createParticles } from './fx/Particles.js';

async function bootstrap() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CONFIG.fog.color, CONFIG.fog.density);

  const renderer = createRenderer();
  const { camera, controls, updateMovement } = createCamera(renderer);

  const { sunPosition } = createSky(scene);
  const { sun } = createLights(scene, sunPosition);

  const terrain = createTerrain(scene);

  const grass = createGrass(scene);
  const bushes = createBushes(scene);
  await createPlants(scene, terrain);

  await createTrees(scene, renderer);

  const water = createWater(scene, sunPosition);

  await createIsland(scene);

  createWalls(scene);

  const particles = createParticles(scene);

  const { composer, bloom } = createPostFX(renderer, scene, camera);

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  });

  const hud = document.getElementById('hud');
  let fps = 0, lastFpsUpdate = 0, frames = 0;

  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');

  const clock = new THREE.Clock();
  const targetFrameTime = CONFIG.maxFps > 0 ? 1000 / CONFIG.maxFps : 0;
  let lastRafMs = 0;
  let accumulator = 0;

  function tick(nowMs) {
    requestAnimationFrame(tick);

    if (targetFrameTime > 0) {
      if (lastRafMs === 0) lastRafMs = nowMs;
      accumulator += nowMs - lastRafMs;
      lastRafMs = nowMs;
      if (accumulator < targetFrameTime) return;
      accumulator -= targetFrameTime;
      if (accumulator > targetFrameTime) accumulator = targetFrameTime;
    }

    const delta = Math.min(clock.getDelta(), 0.1);
    const t = clock.getElapsedTime();

    updateMovement(delta);
    controls.update();
    grass.update(t);
    water.material.uniforms.time.value += delta;
    particles.update(delta, t);

    composer.render();

    frames++;
    const nowS = performance.now() / 1000;
    if (nowS - lastFpsUpdate >= 1) {
      fps = Math.round(frames / (nowS - lastFpsUpdate));
      frames = 0;
      lastFpsUpdate = nowS;
      if (hud) {
        const info = renderer.info.render;
        hud.textContent =
          `FPS: ${fps}\n` +
          `Triangles: ${info.triangles.toLocaleString()}\n` +
          `Drawcalls: ${info.calls}`;
      }
    }
  }
  lastFpsUpdate = performance.now() / 1000;
  requestAnimationFrame(tick);

  window.__scene = { scene, camera, renderer, composer, sun };
}

bootstrap().catch((err) => {
  console.error(err);
  const loader = document.getElementById('loader');
  if (loader) loader.textContent = 'Erreur : ' + err.message;
});
