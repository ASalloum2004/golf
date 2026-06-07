import * as THREE from 'three';
import type { Obstacle } from '../../store/usePhysicsStore';
import { EPS } from '../constants';
import type { CollisionResult, SafePhysicsParams } from '../types';
import { clamp, horizontal } from '../utils';

const WALL_HALF = new THREE.Vector3(1.25, 0.6, 0.2);
const COLLISION_SLOP = 0.002;
type WallAxis = 'x' | 'y' | 'z';

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

function wallCenter(wallBase: THREE.Vector3): THREE.Vector3 {
  return wallBase.clone().setY(wallBase.y + 0.6);
}

function isInsideBox(point: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3): boolean {
  return point.x >= min.x && point.x <= max.x
    && point.y >= min.y && point.y <= max.y
    && point.z >= min.z && point.z <= max.z;
}

function wallInsideNormal(ball: THREE.Vector3, center: THREE.Vector3): { normal: THREE.Vector3; depth: number } {
  const offsets = {
    x: ball.x - center.x,
    y: ball.y - center.y,
    z: ball.z - center.z,
  };

  const candidates: Array<{ axis: WallAxis; clearance: number; sign: number }> = [
    { axis: 'x', clearance: WALL_HALF.x - Math.abs(offsets.x), sign: offsets.x >= 0 ? 1 : -1 },
    { axis: 'z', clearance: WALL_HALF.z - Math.abs(offsets.z), sign: offsets.z >= 0 ? 1 : -1 },
  ];
  candidates.sort((a, b) => a.clearance - b.clearance);

  if (ball.y > center.y + WALL_HALF.y) {
    candidates.unshift({ axis: 'y', clearance: 0, sign: 1 });
  }

  const nearest = candidates[0];
  const normal = new THREE.Vector3();
  normal[nearest.axis] = nearest.sign;
  return { normal, depth: Math.max(0, nearest.clearance) };
}

function checkWall(ball: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollisionResult {
  const center = wallCenter(wallBase);
  const closest = new THREE.Vector3(
    clamp(ball.x, center.x - WALL_HALF.x, center.x + WALL_HALF.x),
    clamp(ball.y, center.y - WALL_HALF.y, center.y + WALL_HALF.y),
    clamp(ball.z, center.z - WALL_HALF.z, center.z + WALL_HALF.z),
  );
  const diff = ball.clone().sub(closest);
  const dist = diff.length();

  if (dist < br) {
    if (dist <= EPS) {
      const inside = wallInsideNormal(ball, center);
      return { kind: 'hard', normal: inside.normal, depth: br + inside.depth, point: ball.clone() };
    }

    const normal = diff.divideScalar(dist);
    return { kind: 'hard', normal, depth: br - dist, point: ball.clone() };
  }

  return { kind: 'none', normal: new THREE.Vector3(), depth: 0 };
}

function checkWallAlongSegment(from: THREE.Vector3, to: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollisionResult {
  const center = wallCenter(wallBase);
  const half = new THREE.Vector3(WALL_HALF.x + br, WALL_HALF.y + br, WALL_HALF.z + br);
  const min = center.clone().sub(half);
  const max = center.clone().add(half);
  const delta = to.clone().sub(from);
  let tMin = 0;
  let tMax = 1;
  const hitNormal = new THREE.Vector3();

  if (isInsideBox(from, min, max)) {
    const currentCollision = checkWall(from, br, wallBase);
    if (currentCollision.kind !== 'none') return currentCollision;
  }

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
    if (hitNormal.lengthSq() <= EPS) return checkWall(to, br, wallBase);
    return { kind: 'hard', normal: hitNormal, depth: COLLISION_SLOP, point };
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
  const collisionNormal = normal.lengthSq() > EPS ? normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const newPos = pos.clone().addScaledVector(collisionNormal, Math.max(0, depth) + COLLISION_SLOP);
  const vn = vel.dot(collisionNormal);
  if (vn >= 0) return { pos: newPos, vel: vel.clone(), omega: omega.clone() };

  const normalDelta = -(1 + p.obstacleRestitution) * vn;
  const newVel = vel.clone().addScaledVector(collisionNormal, normalDelta);
  const tangent = newVel.clone().sub(collisionNormal.clone().multiplyScalar(newVel.dot(collisionNormal)));
  const tangentSpeed = tangent.length();

  if (tangentSpeed > EPS && p.obstacleFriction > 0) {
    const frictionDelta = Math.min(tangentSpeed, p.obstacleFriction * normalDelta);
    newVel.addScaledVector(tangent.normalize(), -frictionDelta);
  }

  return { pos: newPos, vel: newVel, omega: omega.clone().multiplyScalar(1 - 0.25 * p.obstacleFriction) };
}
