import * as THREE from 'three';
import { CUP_CENTER, CUP_R, EPS } from '../constants';
import type { SafePhysicsParams } from '../types';
import { horizontal } from '../utils';

export function checkCup(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  br: number,
  p: SafePhysicsParams,
): { inCup: boolean; newVel: THREE.Vector3 } {
  const offset = new THREE.Vector3(pos.x - CUP_CENTER.x, 0, pos.z - CUP_CENTER.z);
  const distance = offset.length();

  if (distance < CUP_R + br * 0.35 && pos.y <= br + 0.15) {
    const horizontalSpeed = horizontal(vel).length();
    if (horizontalSpeed < 3 || distance < CUP_R * 0.5) {
      return { inCup: true, newVel: new THREE.Vector3() };
    }

    const normal = distance > EPS ? offset.divideScalar(distance) : new THREE.Vector3(1, 0, 0);
    const vn = vel.dot(normal);
    if (vn < 0) {
      return { inCup: false, newVel: vel.clone().addScaledVector(normal, -(1 + p.cupRestitution) * vn) };
    }
  }

  return { inCup: false, newVel: vel.clone() };
}
