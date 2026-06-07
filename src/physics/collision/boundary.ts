import * as THREE from 'three';
import { EPS, PLAY_AREA } from '../constants';
import type { SafePhysicsParams } from '../types';
import { horizontal } from '../utils';

const BOUNDARY_SLOP = 0.004;

interface BoundaryHit {
  hit: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

function nearestBoundaryNormal(pos: THREE.Vector3): THREE.Vector3 {
  const distances = [
    { normal: new THREE.Vector3(1, 0, 0), value: Math.abs(pos.x - PLAY_AREA.minX) },
    { normal: new THREE.Vector3(-1, 0, 0), value: Math.abs(pos.x - PLAY_AREA.maxX) },
    { normal: new THREE.Vector3(0, 0, 1), value: Math.abs(pos.z - PLAY_AREA.minZ) },
    { normal: new THREE.Vector3(0, 0, -1), value: Math.abs(pos.z - PLAY_AREA.maxZ) },
  ].sort((a, b) => a.value - b.value);

  return distances[0].normal;
}

export function checkBoundaryAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
): BoundaryHit {
  const limits = {
    minX: PLAY_AREA.minX + radius,
    maxX: PLAY_AREA.maxX - radius,
    minZ: PLAY_AREA.minZ + radius,
    maxZ: PLAY_AREA.maxZ - radius,
  };

  const candidates: Array<{ t: number; normal: THREE.Vector3 }> = [];

  if (from.x <= limits.maxX && to.x > limits.maxX) {
    candidates.push({ t: (limits.maxX - from.x) / Math.max(EPS, to.x - from.x), normal: new THREE.Vector3(-1, 0, 0) });
  }
  if (from.x >= limits.minX && to.x < limits.minX) {
    candidates.push({ t: (from.x - limits.minX) / Math.max(EPS, from.x - to.x), normal: new THREE.Vector3(1, 0, 0) });
  }
  if (from.z <= limits.maxZ && to.z > limits.maxZ) {
    candidates.push({ t: (limits.maxZ - from.z) / Math.max(EPS, to.z - from.z), normal: new THREE.Vector3(0, 0, -1) });
  }
  if (from.z >= limits.minZ && to.z < limits.minZ) {
    candidates.push({ t: (from.z - limits.minZ) / Math.max(EPS, from.z - to.z), normal: new THREE.Vector3(0, 0, 1) });
  }

  const validHit = candidates
    .filter((candidate) => candidate.t >= 0 && candidate.t <= 1)
    .sort((a, b) => a.t - b.t)[0];

  if (validHit) {
    const point = from.clone().lerp(to, validHit.t);
    return { hit: true, point, normal: validHit.normal };
  }

  const clamped = new THREE.Vector3(
    Math.min(limits.maxX, Math.max(limits.minX, to.x)),
    to.y,
    Math.min(limits.maxZ, Math.max(limits.minZ, to.z)),
  );

  if (clamped.distanceToSquared(to) > EPS) {
    return { hit: true, point: clamped, normal: nearestBoundaryNormal(to) };
  }

  return { hit: false, point: to.clone(), normal: new THREE.Vector3() };
}

export function resolveBoundaryHit(
  hit: BoundaryHit,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3 } {
  const normal = hit.normal.lengthSq() > EPS ? hit.normal.clone().normalize() : nearestBoundaryNormal(hit.point);
  const pos = hit.point.clone().addScaledVector(normal, BOUNDARY_SLOP);
  const vn = vel.dot(normal);

  if (vn >= 0) return { pos, vel: vel.clone(), omega: omega.clone() };

  const restitution = Math.max(0.35, p.obstacleRestitution);
  const newVel = vel.clone().addScaledVector(normal, -(1 + restitution) * vn);
  const tangent = horizontal(newVel);
  const tangentSpeed = tangent.length();

  if (tangentSpeed > EPS && p.obstacleFriction > 0) {
    newVel.addScaledVector(tangent.normalize(), -Math.min(tangentSpeed, p.obstacleFriction * Math.abs(vn)));
  }

  return { pos, vel: newVel, omega: omega.clone().multiplyScalar(1 - 0.2 * p.obstacleFriction) };
}
