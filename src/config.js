export const CONFIG = {
  terrain: {
    size: 200,
    segments: 256,
    heightAmplitude: 1.0,
    waterLevel: -0.4,
    basinDepth: 2.4,
    basinRadius: 22,
    basinCenter: { x: 0, z: 0 },
    bankWidth: 4,
  },

  mapRadius: 96,

  island: {
    radius: 5,
    topHeight: 0.9,
    vegasScale: 1.4,
  },

  grass: {
    count: 5200,
    minScale: 0.6,
    maxScale: 1.2,
  },

  bushes: {
    count: 200,
    minScale: 0.6,
    maxScale: 1.4,
  },

  plants: {
    perVariant: 60,
    variants: 5,
  },

  trees: {
    count: 100,
    minScale: 0.8,
    maxScale: 1.3,
    lodDistances: { mid: 30, far: 80 },
  },

  particles: {
    count: 2000,
    bounds: { x: 110, y: 30, z: 110 },
    fallSpeed: 1.4,
  },

  camera: {
    fov: 55,
    near: 0.1,
    far: 1000,
    start: { x: 30, y: 18, z: 42 },
    target: { x: 0, y: 2, z: 0 },
  },

  sun: {
    elevation: 8,
    azimuth: 150,
  },

  fog: {
    color: 0xd5a878,
    density: 0.012,
  },

  maxFps: 60,
};

let _seed = 42;
export function rand() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
export function resetSeed(s = 42) { _seed = s; }

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function sampleTerrainHeight(x, z) {
  const t = CONFIG.terrain;

  const dx = x - t.basinCenter.x;
  const dz = z - t.basinCenter.z;
  const d = Math.sqrt(dx * dx + dz * dz);

  const lakeEdge = t.basinRadius;
  const plainStart = t.basinRadius + t.bankWidth;
  const terrainMask = smoothstep(lakeEdge, plainStart, d);

  const baseHeight =
    Math.sin(x * 0.1) * 1.5 * t.heightAmplitude +
    Math.cos(z * 0.15) * 1.2 * t.heightAmplitude +
    Math.sin((x + z) * 0.25) * 0.6 * t.heightAmplitude;

  if (d >= plainStart) return baseHeight;

  if (d >= lakeEdge) {
    const bankT = 1 - smoothstep(lakeEdge, plainStart, d);
    const bankHeight = baseHeight * terrainMask + (t.waterLevel + 0.05) * bankT;
    return bankHeight;
  }

  const depthT = 1 - smoothstep(lakeEdge * 0.35, lakeEdge, d);
  return t.waterLevel - 0.2 - t.basinDepth * depthT;
}
