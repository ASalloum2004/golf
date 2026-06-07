import * as THREE from 'three';
import { EPS, PLAY_AREA } from '../constants';
import type { SafePhysicsParams } from '../types';
import { clamp } from '../utils';

const BOUNDARY_SLOP = 0.006;
const CORNER_EPS = 1e-5;

interface BoundaryHit {
  hit: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

interface BoundaryLimits {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function playableLimits(radius: number): BoundaryLimits {
  return {
    minX: PLAY_AREA.minX + radius,
    maxX: PLAY_AREA.maxX - radius,
    minZ: PLAY_AREA.minZ + radius,
    maxZ: PLAY_AREA.maxZ - radius,
  };
}

function clampPointToLimits(point: THREE.Vector3, limits: BoundaryLimits): THREE.Vector3 {
  return new THREE.Vector3(
    clamp(point.x, limits.minX, limits.maxX),
    point.y,
    clamp(point.z, limits.minZ, limits.maxZ),
  );
}

function isInsideLimits(point: THREE.Vector3, limits: BoundaryLimits): boolean {
  return point.x >= limits.minX && point.x <= limits.maxX
    && point.z >= limits.minZ && point.z <= limits.maxZ;
}

function nearestBoundaryNormal(pos: THREE.Vector3, limits: BoundaryLimits): THREE.Vector3 {
  const outside = new THREE.Vector3(
    pos.x < limits.minX ? 1 : pos.x > limits.maxX ? -1 : 0,
    0,
    pos.z < limits.minZ ? 1 : pos.z > limits.maxZ ? -1 : 0,
  );

  if (outside.lengthSq() > EPS) return outside.normalize();

  const distances = [
    { normal: new THREE.Vector3(1, 0, 0), value: Math.abs(pos.x - limits.minX) },
    { normal: new THREE.Vector3(-1, 0, 0), value: Math.abs(pos.x - limits.maxX) },
    { normal: new THREE.Vector3(0, 0, 1), value: Math.abs(pos.z - limits.minZ) },
    { normal: new THREE.Vector3(0, 0, -1), value: Math.abs(pos.z - limits.maxZ) },
  ].sort((a, b) => a.value - b.value);

  return distances[0].normal;
}

export function checkBoundaryAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
): BoundaryHit {
  const limits = playableLimits(radius);

  if (isInsideLimits(from, limits) && isInsideLimits(to, limits)) {
    return { hit: false, point: to.clone(), normal: new THREE.Vector3() };
  }

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
    const normal = candidates
      .filter((candidate) => Math.abs(candidate.t - validHit.t) <= CORNER_EPS)
      .reduce((combined, candidate) => combined.add(candidate.normal), new THREE.Vector3());
    const point = from.clone().lerp(to, validHit.t);
    return {
      hit: true,
      point: clampPointToLimits(point, limits),
      normal: normal.lengthSq() > EPS ? normal.normalize() : validHit.normal,
    };
  }

  const clamped = clampPointToLimits(to, limits);

  if (clamped.distanceToSquared(to) > EPS) {
    return {
      hit: true,
      point: clamped,
      normal: nearestBoundaryNormal(to, limits),
    };
  }

  return { hit: false, point: to.clone(), normal: new THREE.Vector3() };
}

export function resolveBoundaryHit(
  hit: BoundaryHit,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3 } {
  const limits = playableLimits(p.radius);
  const normal = hit.normal.lengthSq() > EPS
    ? hit.normal.clone().normalize()
    : nearestBoundaryNormal(hit.point, limits);
  const pos = clampPointToLimits(hit.point, limits).addScaledVector(normal, BOUNDARY_SLOP);
  pos.x = clamp(pos.x, limits.minX + BOUNDARY_SLOP, limits.maxX - BOUNDARY_SLOP);
  pos.z = clamp(pos.z, limits.minZ + BOUNDARY_SLOP, limits.maxZ - BOUNDARY_SLOP);

  const vn = vel.dot(normal);

  if (vn >= 0) return { pos, vel: vel.clone(), omega: omega.clone() };

  const normalDelta = -(1 + p.obstacleRestitution) * vn;
  const newVel = vel.clone().addScaledVector(normal, normalDelta);
  const tangent = newVel.clone().sub(normal.clone().multiplyScalar(newVel.dot(normal)));
  const tangentSpeed = tangent.length();

  if (tangentSpeed > EPS && p.obstacleFriction > 0) {
    const frictionDelta = Math.min(tangentSpeed, p.obstacleFriction * normalDelta);
    newVel.addScaledVector(tangent.normalize(), -frictionDelta);
  }

  return { pos, vel: newVel, omega: omega.clone().multiplyScalar(1 - 0.25 * p.obstacleFriction) };
}
