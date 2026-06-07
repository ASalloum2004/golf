import * as THREE from 'three';
import type { Obstacle } from '../../store/usePhysicsStore';
import { EPS } from '../constants';
import type { CollisionResult, SafePhysicsParams } from '../types';
import { clamp, horizontal } from '../utils';

function closestPointOnSegmentXZ(from: THREE.Vector3, to: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 {
  const sx = to.x - from.x;
  const sz = to.z - from.z;
  const lenSq = sx * sx + sz * sz;
  if (lenSq < EPS) return to.clone();

  const t = clamp(((target.x - from.x) * sx + (target.z - from.z) * sz) / lenSq, 0, 1);
  return from.clone().lerp(to, t);
}

function checkTree(ball: THREE.Vector3, br: number, tree: THREE.Vector3): CollisionResult {
  const dx = ball.x - tree.x;
  const dz = ball.z - tree.z;
  const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
  const normal = horizontalDistance > EPS
    ? new THREE.Vector3(dx / horizontalDistance, 0, dz / horizontalDistance)
    : new THREE.Vector3(1, 0, 0);

  if (ball.y < 1) {
    const minDistance = br + 0.2;
    if (horizontalDistance < minDistance) {
      return { kind: 'hard', normal, depth: minDistance - horizontalDistance, point: ball.clone() };
    }
  } else if (ball.y < 3.3) {
    const foliageRadius = 1.2 * (3.3 - ball.y) / 2.3;
    if (horizontalDistance < foliageRadius + br) {
      return { kind: 'veg', normal, depth: 0, point: ball.clone() };
    }
  }

  return { kind: 'none', normal: new THREE.Vector3(), depth: 0 };
}

function checkTreeAlongSegment(from: THREE.Vector3, to: THREE.Vector3, br: number, tree: THREE.Vector3): CollisionResult {
  const closest = closestPointOnSegmentXZ(from, to, tree);
  const collision = checkTree(closest, br, tree);
  if (collision.kind !== 'none') return collision;
  return checkTree(to, br, tree);
}

function checkWall(ball: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollisionResult {
  const center = wallBase.clone().setY(wallBase.y + 0.6);
  const half = new THREE.Vector3(1.25, 0.6, 0.2);
  const closest = new THREE.Vector3(
    clamp(ball.x, center.x - half.x, center.x + half.x),
    clamp(ball.y, center.y - half.y, center.y + half.y),
    clamp(ball.z, center.z - half.z, center.z + half.z),
  );
  const diff = ball.clone().sub(closest);
  const dist = diff.length();

  if (dist < br) {
    const normal = dist > EPS ? diff.divideScalar(dist) : new THREE.Vector3(0, 1, 0);
    return { kind: 'hard', normal, depth: br - dist, point: ball.clone() };
  }

  return { kind: 'none', normal: new THREE.Vector3(), depth: 0 };
}

function checkWallAlongSegment(from: THREE.Vector3, to: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollisionResult {
  const center = wallBase.clone().setY(wallBase.y + 0.6);
  const half = new THREE.Vector3(1.25 + br, 0.6 + br, 0.2 + br);
  const min = center.clone().sub(half);
  const max = center.clone().add(half);
  const delta = to.clone().sub(from);
  let tMin = 0;
  let tMax = 1;
  const hitNormal = new THREE.Vector3();

  for (const axis of ['x', 'y', 'z'] as const) {
    const d = delta[axis];
    if (Math.abs(d) < EPS) {
      if (from[axis] < min[axis] || from[axis] > max[axis]) return checkWall(to, br, wallBase);
      continue;
    }

    const invD = 1 / d;
    let t1 = (min[axis] - from[axis]) * invD;
    let t2 = (max[axis] - from[axis]) * invD;
    let normalSign = -Math.sign(d);
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      normalSign = Math.sign(d);
    }

    if (t1 > tMin) {
      tMin = t1;
      hitNormal.set(0, 0, 0);
      hitNormal[axis] = normalSign;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return checkWall(to, br, wallBase);
  }

  if (tMin >= 0 && tMin <= 1) {
    const point = from.clone().addScaledVector(delta, tMin);
    return { kind: 'hard', normal: hitNormal, depth: 0, point };
  }

  return checkWall(to, br, wallBase);
}

export function checkObstacleAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  obs: Obstacle,
): CollisionResult {
  const obstaclePos = new THREE.Vector3(...obs.position);
  return obs.type === 'Tree'
    ? checkTreeAlongSegment(from, to, radius, obstaclePos)
    : checkWallAlongSegment(from, to, radius, obstaclePos);
}

export function applyVegetation(
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  normal: THREE.Vector3,
  p: SafePhysicsParams,
  dt: number,
): { vel: THREE.Vector3; omega: THREE.Vector3 } {
  const newVel = vel.clone().multiplyScalar(p.vegDamping);
  const horizontalSpeed = horizontal(vel).length();
  const n = horizontal(normal);

  if (horizontalSpeed > EPS && n.lengthSq() > EPS) {
    // Vegetation is a soft volume: it slows the ball and nudges it away from the branch volume.
    newVel.addScaledVector(n.normalize(), Math.min(1.5, horizontalSpeed * (1 - p.vegDamping) * 0.6));
  }

  return {
    vel: newVel,
    omega: omega.clone().multiplyScalar(Math.exp(-p.spinDamping * dt) * p.vegDamping),
  };
}

export function resolveHard(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  normal: THREE.Vector3,
  depth: number,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3 } {
  const newPos = pos.clone().addScaledVector(normal, Math.max(0, depth));
  const vn = vel.dot(normal);
  if (vn >= 0) return { pos: newPos, vel: vel.clone(), omega: omega.clone() };

  const normalDelta = -(1 + p.obstacleRestitution) * vn;
  const newVel = vel.clone().addScaledVector(normal, normalDelta);
  const tangent = newVel.clone().sub(normal.clone().multiplyScalar(newVel.dot(normal)));
  const tangentSpeed = tangent.length();

  if (tangentSpeed > EPS && p.obstacleFriction > 0) {
    const frictionDelta = Math.min(tangentSpeed, p.obstacleFriction * normalDelta);
    newVel.addScaledVector(tangent.normalize(), -frictionDelta);
  }

  return { pos: newPos, vel: newVel, omega: omega.clone().multiplyScalar(1 - 0.25 * p.obstacleFriction) };
}
