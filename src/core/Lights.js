import * as THREE from 'three';

export function createLights(scene, sunPosition) {
  const hemi = new THREE.HemisphereLight(0xffc89a, 0x3a3020, 0.55);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe4c8, 1.0);
  sun.position.copy(sunPosition).multiplyScalar(80);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 3;
  const cam = sun.shadow.camera;
  cam.near = 1;
  cam.far = 260;
  cam.left = -110;
  cam.right = 110;
  cam.top = 110;
  cam.bottom = -110;
  cam.updateProjectionMatrix();

  scene.add(sun);
  scene.add(sun.target);

  const camp = new THREE.PointLight(0xff8030, 8, 22, 1.8);
  camp.position.set(-8, 2, 6);
  camp.castShadow = false;
  scene.add(camp);

  const spot = new THREE.SpotLight(0xfff0c8, 1.2, 60, Math.PI / 5, 0.6, 1.2);
  spot.position.set(10, 25, 10);
  spot.target.position.set(0, 0, 0);
  scene.add(spot);
  scene.add(spot.target);

  return { hemi, sun, camp, spot };
}
