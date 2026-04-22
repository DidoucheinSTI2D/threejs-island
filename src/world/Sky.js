import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CONFIG } from '../config.js';

export function createSky(scene) {
  const sky = new Sky();
  sky.scale.setScalar(10000);

  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 6;
  uniforms.rayleigh.value = 2.4;
  uniforms.mieCoefficient.value = 0.005;
  uniforms.mieDirectionalG.value = 0.8;

  const phi = THREE.MathUtils.degToRad(90 - CONFIG.sun.elevation);
  const theta = THREE.MathUtils.degToRad(CONFIG.sun.azimuth);
  const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  uniforms.sunPosition.value.copy(sunPosition);

  scene.add(sky);
  return { sky, sunPosition };
}
