import * as THREE from 'three';
import { MAX_STEP_DT } from './constants';

export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export const safeDt = (dt: number): number => clamp(dt, 0, MAX_STEP_DT);

export function horizontal(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(v.x, 0, v.z);
}

export function sanitizeVector(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    Number.isFinite(v.x) ? v.x : 0,
    Number.isFinite(v.y) ? v.y : 0,
    Number.isFinite(v.z) ? v.z : 0,
  );
}
