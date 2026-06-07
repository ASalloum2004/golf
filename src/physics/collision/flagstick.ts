import * as THREE from 'three';
import { CUP_CENTER, EPS } from '../constants';
import type { SafePhysicsParams } from '../types';
import { clamp, horizontal } from '../utils';

function closestPointOnFlagPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < EPS) return to.clone();

  const t = clamp(((CUP_CENTER.x - from.x) * dx + (CUP_CENTER.z - from.z) * dz) / lenSq, 0, 1);
  return from.clone().lerp(to, t);
}

function flagstickCollision(
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
    const fallback = horizontal(vel);
    const normal = distance > EPS
      ? new THREE.Vector3(dx / distance, 0, dz / distance)
      : fallback.lengthSq() > EPS
        ? fallback.normalize().multiplyScalar(-1)
        : new THREE.Vector3(1, 0, 0);
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

export function checkFlagstickAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  vel: THREE.Vector3,
  br: number,
  p: SafePhysicsParams,
): { hit: boolean; newVel: THREE.Vector3 } {
  const closest = closestPointOnFlagPath(from, to);
  const sweptHit = flagstickCollision(closest, vel, br, p);
  if (sweptHit.hit) return sweptHit;
  return flagstickCollision(to, vel, br, p);
}
