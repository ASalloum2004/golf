import * as THREE from 'three';
import { CUP_CENTER, EPS } from '../constants';
import type { SafePhysicsParams } from '../types';

export function checkFlagstick(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  br: number,
  p: SafePhysicsParams,
): { hit: boolean; newVel: THREE.Vector3 } {
  const flagRadius = 0.01;
  const flagHeight = 2;
  const dx = pos.x - CUP_CENTER.x;
  const dz = pos.z - CUP_CENTER.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < br + flagRadius && pos.y < flagHeight) {
    const normal = distance > EPS ? new THREE.Vector3(dx / distance, 0, dz / distance) : new THREE.Vector3(1, 0, 0);
    const vn = vel.dot(normal);
    if (vn < 0) {
      const newVel = vel.clone().addScaledVector(normal, -(1 + p.flagstickRestitution) * vn);
      const tangent = newVel.clone().sub(normal.clone().multiplyScalar(newVel.dot(normal)));
      const tangentSpeed = tangent.length();
      if (tangentSpeed > EPS) {
        newVel.addScaledVector(tangent.normalize(), -Math.min(tangentSpeed, p.flagstickFriction * Math.abs(vn)));
      }
      return { hit: true, newVel };
    }
  }

  return { hit: false, newVel: vel.clone() };
}
