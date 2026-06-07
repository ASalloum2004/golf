/**
 * Golf ball physics engine.
 *
 * Units:
 * - distance: metres
 * - time: seconds
 * - mass from UI: grams, converted to kg internally
 * - angles from UI: degrees, converted to radians internally
 * - spin: rad/s
 *
 * Coordinates follow the existing scene: +y is up, -z is straight downrange,
 * +x is right. The UI remains the owner of controls; this file owns only the
 * physical interpretation and time integration.
 */

import * as THREE from 'three';
import type { PhysicsState, Obstacle } from '../store/usePhysicsStore';

const DEG2RAD = Math.PI / 180;
const EPS = 1e-8;
const CUP_CENTER = new THREE.Vector3(0, 0, -30);
const CUP_R = 0.054;
const MAX_STEP_DT = 0.05;

export type SimPhase = 'flying' | 'rolling' | 'stopped';

export interface BallSimState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  omega: THREE.Vector3;
  phase: SimPhase;
  inCup: boolean;
  flightTime: number;
  maxHeight: number;
  landingPos: THREE.Vector3 | null;
  landingVel: THREE.Vector3 | null;
}

type SafePhysicsParams = PhysicsState & { massKg: number };

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const safeDt = (dt: number): number => clamp(dt, 0, MAX_STEP_DT);

function sanitizeParams(p: PhysicsState): SafePhysicsParams {
  const safe = {
    ...p,
    loftAngle: clamp(p.loftAngle, 0, 64),
    clubFriction: clamp(p.clubFriction, 0, 1),
    initialVelocity: clamp(p.initialVelocity, 0, 100),
    verticalAngle: clamp(p.verticalAngle, -20, 90),
    horizontalAngle: clamp(p.horizontalAngle, -45, 45),
    spinSpeed: clamp(p.spinSpeed, 0, 1000),
    spinAxis: clamp(p.spinAxis, -90, 90),
    mass: clamp(p.mass, 1, 1000),
    radius: clamp(p.radius, 0.001, 0.1),
    inertiaConstant: clamp(p.inertiaConstant, 0.01, 1),
    gravity: clamp(p.gravity, 0, 50),
    airDensity: clamp(p.airDensity, 0, 3),
    windSpeed: clamp(p.windSpeed, 0, 100),
    windDirection: ((Number.isFinite(p.windDirection) ? p.windDirection : 0) % 360 + 360) % 360,
    buoyancy: Boolean(p.buoyancy),
    dragCoeff: clamp(p.dragCoeff, 0, 2),
    liftCoeff: clamp(p.liftCoeff, 0, 2),
    sideForceCoeff: clamp(p.sideForceCoeff, 0, 2),
    spinDamping: clamp(p.spinDamping, 0, 5),
    restitution: clamp(p.restitution, 0, 1),
    surfaceFriction: clamp(p.surfaceFriction, 0, 1),
    rollingResistance: clamp(p.rollingResistance, 0, 2),
    obstacleRestitution: clamp(p.obstacleRestitution, 0, 1),
    obstacleFriction: clamp(p.obstacleFriction, 0, 1),
    vegDamping: clamp(p.vegDamping, 0, 1),
    cupRestitution: clamp(p.cupRestitution, 0, 1),
    flagstickRestitution: clamp(p.flagstickRestitution, 0, 1),
    flagstickFriction: clamp(p.flagstickFriction, 0, 1),
    dynamicViscosity: clamp(p.dynamicViscosity, 1e-8, 1e-3),
  };

  return { ...safe, massKg: safe.mass * 1e-3 };
}

export function createInitialState(params: PhysicsState): BallSimState {
  const p = sanitizeParams(params);
  const v0 = p.initialVelocity;
  const vertical = p.verticalAngle * DEG2RAD;
  const horizontal = p.horizontalAngle * DEG2RAD;
  const spinAxis = p.spinAxis * DEG2RAD;

  return {
    position: new THREE.Vector3(0, p.radius, 0),
    velocity: new THREE.Vector3(
      v0 * Math.sin(horizontal) * Math.cos(vertical),
      v0 * Math.sin(vertical),
      -v0 * Math.cos(horizontal) * Math.cos(vertical),
    ),
    // spinAxis=0 means backspin around +x; +/-90 means side spin around y.
    omega: new THREE.Vector3(
      p.spinSpeed * Math.cos(spinAxis),
      p.spinSpeed * Math.sin(spinAxis),
      0,
    ),
    phase: 'flying',
    inCup: false,
    flightTime: 0,
    maxHeight: p.radius,
    landingPos: null,
    landingVel: null,
  };
}

function windVelocity(p: SafePhysicsParams): THREE.Vector3 {
  const a = p.windDirection * DEG2RAD;

  // 0 degrees is a headwind relative to the default shot direction (-z).
  return new THREE.Vector3(
    p.windSpeed * Math.sin(a),
    0,
    p.windSpeed * Math.cos(a),
  );
}

function horizontal(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(v.x, 0, v.z);
}

function aerodynamicAcceleration(
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  p: SafePhysicsParams,
): THREE.Vector3 {
  const area = Math.PI * p.radius * p.radius;
  const rel = vel.clone().sub(windVelocity(p));
  const relSpeed = rel.length();
  const acc = new THREE.Vector3(0, -p.gravity, 0);

  // Buoyancy: Fb = rho_air * V_ball * g, applied upward.
  if (p.buoyancy && p.airDensity > 0) {
    const ballVolume = (4 / 3) * Math.PI * p.radius ** 3;
    acc.y += (p.airDensity * ballVolume * p.gravity) / p.massKg;
  }

  if (relSpeed < EPS || p.airDensity <= 0) return acc;

  // Drag: Fd = -0.5 * rho * Cd * A * |v_rel|^2 * v_rel_hat.
  const q = 0.5 * p.airDensity * relSpeed * relSpeed;
  acc.addScaledVector(rel.clone().normalize(), -(q * p.dragCoeff * area) / p.massKg);

  // Magnus/lift: coefficient controls magnitude; omega x v_rel controls direction.
  const magnusDir = new THREE.Vector3().crossVectors(omega, rel);
  if (p.liftCoeff > 0 && magnusDir.lengthSq() > EPS) {
    acc.addScaledVector(magnusDir.normalize(), (q * p.liftCoeff * area) / p.massKg);
  }

  // Optional side force acts perpendicular to the horizontal relative airflow.
  const relH = horizontal(rel);
  const relHLen = relH.length();
  if (p.sideForceCoeff > 0 && relHLen > EPS) {
    const sideDir = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), relH).normalize();
    acc.addScaledVector(sideDir, (q * p.sideForceCoeff * area) / p.massKg);
  }

  return acc;
}

function rk4Step(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  dt: number,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3 } {
  const spinDerivative = (w: THREE.Vector3) => w.clone().multiplyScalar(-p.spinDamping);

  const a1 = aerodynamicAcceleration(vel, omega, p);
  const w1 = spinDerivative(omega);

  const v2 = vel.clone().addScaledVector(a1, dt / 2);
  const o2 = omega.clone().addScaledVector(w1, dt / 2);
  const a2 = aerodynamicAcceleration(v2, o2, p);
  const w2 = spinDerivative(o2);

  const v3 = vel.clone().addScaledVector(a2, dt / 2);
  const o3 = omega.clone().addScaledVector(w2, dt / 2);
  const a3 = aerodynamicAcceleration(v3, o3, p);
  const w3 = spinDerivative(o3);

  const v4 = vel.clone().addScaledVector(a3, dt);
  const o4 = omega.clone().addScaledVector(w3, dt);
  const a4 = aerodynamicAcceleration(v4, o4, p);
  const w4 = spinDerivative(o4);

  const dx = vel.clone()
    .addScaledVector(v2, 2)
    .addScaledVector(v3, 2)
    .add(v4)
    .multiplyScalar(dt / 6);

  return {
    pos: pos.clone().add(dx),
    vel: vel.clone()
      .addScaledVector(a1, dt / 6)
      .addScaledVector(a2, dt / 3)
      .addScaledVector(a3, dt / 3)
      .addScaledVector(a4, dt / 6),
    omega: omega.clone()
      .addScaledVector(w1, dt / 6)
      .addScaledVector(w2, dt / 3)
      .addScaledVector(w3, dt / 3)
      .addScaledVector(w4, dt / 6),
  };
}

function groundBounce(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3; nextPhase: 'flying' | 'rolling' } {
  const contactRadius = new THREE.Vector3(0, -p.radius, 0);
  const inertia = Math.max(EPS, p.inertiaConstant * p.massKg * p.radius * p.radius);
  const incomingVy = Math.min(0, vel.y);
  const normalImpulsePerMass = -(1 + p.restitution) * incomingVy;

  const newVel = vel.clone();
  newVel.y += normalImpulsePerMass;

  // Contact slip includes translation plus rotation at the ground contact point.
  const contactVelocity = newVel.clone().add(new THREE.Vector3().crossVectors(omega, contactRadius));
  const slip = horizontal(contactVelocity);
  const slipSpeed = slip.length();
  const newOmega = omega.clone();

  if (slipSpeed > EPS && p.surfaceFriction > 0) {
    const slipDir = slip.normalize();
    const effectiveMassInv = (1 / p.massKg) + (p.radius * p.radius / inertia);
    const desiredImpulse = slipSpeed / effectiveMassInv;
    const maxImpulse = p.surfaceFriction * normalImpulsePerMass * p.massKg;
    const impulseMag = Math.min(desiredImpulse, maxImpulse);
    const impulse = slipDir.multiplyScalar(-impulseMag);

    newVel.addScaledVector(impulse, 1 / p.massKg);
    const angularImpulse = new THREE.Vector3().crossVectors(contactRadius, impulse);
    newOmega.addScaledVector(angularImpulse, 1 / inertia);
  }

  newVel.y = Math.max(0, newVel.y);
  const newPos = pos.clone();
  newPos.y = p.radius;

  const horizontalSpeed = horizontal(newVel).length();
  const nextPhase = newVel.y < 0.3 || horizontalSpeed < 0.05 ? 'rolling' : 'flying';
  if (nextPhase === 'rolling') newVel.y = 0;

  return { pos: newPos, vel: newVel, omega: newOmega, nextPhase };
}

function rollingStep(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  dt: number,
  p: SafePhysicsParams,
): { pos: THREE.Vector3; vel: THREE.Vector3; omega: THREE.Vector3; stopped: boolean } {
  const STOP_SPEED = 0.04;
  const v = horizontal(vel);
  const speed = v.length();

  if (speed < STOP_SPEED) {
    return { pos: pos.clone().setY(p.radius), vel: new THREE.Vector3(), omega: new THREE.Vector3(), stopped: true };
  }

  const area = Math.PI * p.radius * p.radius;
  const acceleration = new THREE.Vector3();

  if (p.rollingResistance > 0) {
    acceleration.addScaledVector(v.clone().normalize(), -p.rollingResistance * p.gravity);
  }

  const rel = v.clone().sub(windVelocity(p));
  const relSpeed = rel.length();
  if (p.airDensity > 0 && p.dragCoeff > 0 && relSpeed > EPS) {
    const drag = (0.5 * p.airDensity * p.dragCoeff * area * relSpeed * relSpeed) / p.massKg;
    acceleration.addScaledVector(rel.normalize(), -drag);
  }

  const newVel = v.clone().addScaledVector(acceleration, dt);
  newVel.y = 0;

  // Frictional rolling resistance should stop the ball, not reverse it.
  if (newVel.dot(v) <= 0 && acceleration.dot(v) < 0) {
    return { pos: pos.clone().setY(p.radius), vel: new THREE.Vector3(), omega: new THREE.Vector3(), stopped: true };
  }

  const avgVel = v.clone().add(newVel).multiplyScalar(0.5);
  const newPos = pos.clone().addScaledVector(avgVel, dt);
  newPos.y = p.radius;

  // For rolling without slip, omega is roughly axis x velocity divided by radius.
  const rollOmega = new THREE.Vector3(newVel.z / p.radius, 0, -newVel.x / p.radius);
  const decay = Math.exp(-p.spinDamping * dt);
  const newOmega = omega.clone().multiplyScalar(decay).lerp(rollOmega, 0.25);

  return { pos: newPos, vel: newVel, omega: newOmega, stopped: false };
}

type CollKind = 'hard' | 'veg' | 'none';
interface CollResult { kind: CollKind; normal: THREE.Vector3; depth: number; point?: THREE.Vector3 }

function closestPointOnSegmentXZ(from: THREE.Vector3, to: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 {
  const sx = to.x - from.x;
  const sz = to.z - from.z;
  const lenSq = sx * sx + sz * sz;
  if (lenSq < EPS) return to.clone();

  const t = clamp(((target.x - from.x) * sx + (target.z - from.z) * sz) / lenSq, 0, 1);
  return from.clone().lerp(to, t);
}

function checkTree(ball: THREE.Vector3, br: number, tree: THREE.Vector3): CollResult {
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

function checkTreeAlongSegment(from: THREE.Vector3, to: THREE.Vector3, br: number, tree: THREE.Vector3): CollResult {
  const closest = closestPointOnSegmentXZ(from, to, tree);
  const collision = checkTree(closest, br, tree);
  if (collision.kind !== 'none') return collision;
  return checkTree(to, br, tree);
}

function checkWall(ball: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollResult {
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

function checkWallAlongSegment(from: THREE.Vector3, to: THREE.Vector3, br: number, wallBase: THREE.Vector3): CollResult {
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

function checkObstacleAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  obs: Obstacle,
): CollResult {
  const obstaclePos = new THREE.Vector3(...obs.position);
  return obs.type === 'Tree'
    ? checkTreeAlongSegment(from, to, radius, obstaclePos)
    : checkWallAlongSegment(from, to, radius, obstaclePos);
}

function applyVegetation(
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

function resolveHard(
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

function checkCup(
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

function checkFlagstick(
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

function sanitizeVector(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    Number.isFinite(v.x) ? v.x : 0,
    Number.isFinite(v.y) ? v.y : 0,
    Number.isFinite(v.z) ? v.z : 0,
  );
}

export function physicsStep(
  state: BallSimState,
  rawDt: number,
  params: PhysicsState,
  obstacles: Obstacle[],
): BallSimState {
  const dt = safeDt(rawDt);
  if (state.phase === 'stopped' || dt <= 0) return state;

  const p = sanitizeParams(params);
  let pos = sanitizeVector(state.position).clone();
  let vel = sanitizeVector(state.velocity).clone();
  let omega = sanitizeVector(state.omega).clone();
  let phase: SimPhase = state.phase;
  let inCup = state.inCup;
  let flightTime = state.flightTime;
  let maxHeight = state.maxHeight;
  let landingPos = state.landingPos;
  let landingVel = state.landingVel;

  if (phase === 'flying') {
    const previousPos = pos.clone();
    const previousVel = vel.clone();
    const next = rk4Step(pos, vel, omega, dt, p);
    pos = next.pos;
    vel = next.vel;
    omega = next.omega;
    flightTime += dt;
    maxHeight = Math.max(maxHeight, pos.y);

    if (pos.y - p.radius <= 0 && vel.y < 0) {
      const denom = Math.max(EPS, previousPos.y - pos.y);
      const impactT = clamp((previousPos.y - p.radius) / denom, 0, 1);
      const impactPos = previousPos.clone().lerp(pos, impactT).setY(p.radius);
      const impactVel = previousVel.clone().lerp(vel, impactT);

      if (!landingPos) {
        landingPos = impactPos.clone();
        landingVel = impactVel.clone();
      }

      const bounce = groundBounce(impactPos, impactVel, omega, p);
      pos = bounce.pos;
      vel = bounce.vel;
      omega = bounce.omega;
      phase = bounce.nextPhase;
    }

    for (const obs of obstacles) {
      const collision = checkObstacleAlongSegment(previousPos, pos, p.radius, obs);

      if (collision.kind === 'hard') {
        const collisionPos = collision.point ?? pos;
        const resolved = resolveHard(collisionPos, vel, omega, collision.normal, collision.depth, p);
        pos = resolved.pos;
        vel = resolved.vel;
        omega = resolved.omega;
      } else if (collision.kind === 'veg') {
        const softened = applyVegetation(vel, omega, collision.normal, p, dt);
        vel = softened.vel;
        omega = softened.omega;
      }
    }

    const cup = checkCup(pos, vel, p.radius, p);
    if (cup.inCup) {
      inCup = true;
      phase = 'stopped';
      pos.set(CUP_CENTER.x, p.radius, CUP_CENTER.z);
      vel.set(0, 0, 0);
      omega.set(0, 0, 0);
    } else {
      vel.copy(cup.newVel);
      const flag = checkFlagstick(pos, vel, p.radius, p);
      if (flag.hit) vel.copy(flag.newVel);
    }

    if (flightTime > 30) {
      phase = 'stopped';
      vel.set(0, 0, 0);
      omega.set(0, 0, 0);
    }
  } else if (phase === 'rolling') {
    const previousPos = pos.clone();
    const roll = rollingStep(pos, vel, omega, dt, p);
    pos = roll.pos;
    vel = roll.vel;
    omega = roll.omega;
    if (roll.stopped) phase = 'stopped';

    for (const obs of obstacles) {
      const collision = checkObstacleAlongSegment(previousPos, pos, p.radius, obs);

      if (collision.kind === 'hard') {
        const collisionPos = collision.point ?? pos;
        const resolved = resolveHard(collisionPos, vel, omega, collision.normal, collision.depth, p);
        pos = resolved.pos.setY(p.radius);
        vel = horizontal(resolved.vel);
        omega = resolved.omega;
      } else if (collision.kind === 'veg') {
        const softened = applyVegetation(vel, omega, collision.normal, p, dt);
        vel = horizontal(softened.vel);
        omega = softened.omega;
      }
    }

    const cup = checkCup(pos, vel, p.radius, p);
    if (cup.inCup) {
      inCup = true;
      phase = 'stopped';
      pos.set(CUP_CENTER.x, p.radius, CUP_CENTER.z);
      vel.set(0, 0, 0);
      omega.set(0, 0, 0);
    } else {
      vel.copy(cup.newVel);
    }
  }

  return {
    position: sanitizeVector(pos),
    velocity: sanitizeVector(vel),
    omega: sanitizeVector(omega),
    phase,
    inCup,
    flightTime,
    maxHeight,
    landingPos,
    landingVel,
  };
}

export function getReynoldsNumber(vel: THREE.Vector3, params: PhysicsState): number {
  const p = sanitizeParams(params);
  const rel = sanitizeVector(vel).sub(windVelocity(p));
  const diameter = 2 * p.radius;
  return (p.airDensity * rel.length() * diameter) / p.dynamicViscosity;
}
