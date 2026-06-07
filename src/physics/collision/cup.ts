import * as THREE from 'three';
import { CUP_CENTER, CUP_R, EPS } from '../constants';
import type { SafePhysicsParams } from '../types';
import { clamp, horizontal } from '../utils';

function closestPointOnCupPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < EPS) return to.clone();

  const t = clamp(((CUP_CENTER.x - from.x) * dx + (CUP_CENTER.z - from.z) * dz) / lenSq, 0, 1);
  return from.clone().lerp(to, t);
}

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

export function checkCupAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  vel: THREE.Vector3,
  br: number,
  p: SafePhysicsParams,
): { inCup: boolean; newVel: THREE.Vector3 } {
  const closest = closestPointOnCupPath(from, to);
  const segmentCup = checkCup(closest, vel, br, p);
  if (segmentCup.inCup || !segmentCup.newVel.equals(vel)) return segmentCup;
  return checkCup(to, vel, br, p);
}
