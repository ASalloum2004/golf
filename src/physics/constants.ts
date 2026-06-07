import * as THREE from 'three';

export const DEG2RAD = Math.PI / 180;
export const EPS = 1e-8;
export const CUP_CENTER = new THREE.Vector3(0, 0, -72);
export const CUP_R = 0.054;
export const MAX_STEP_DT = 0.05;

export const PLAY_AREA = {
  minX: -36,
  maxX: 36,
  minZ: -104,
  maxZ: 16,
} as const;

export const WATER_POND = {
  center: new THREE.Vector3(-18, 0, -48),
  radiusX: 6.5,
  radiusZ: 3,
  rotationY: -0.22,
  surfaceY: 0.02,
  catchHeight: 0.3,
} as const;
