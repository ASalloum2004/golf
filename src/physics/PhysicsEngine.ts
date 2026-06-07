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

import type { Obstacle, PhysicsState } from '../store/usePhysicsStore';
import { CUP_CENTER, EPS } from './constants';
import { checkCup } from './collision/cup';
import { checkFlagstick } from './collision/flagstick';
import { groundBounce } from './collision/ground';
import { applyVegetation, checkObstacleAlongSegment, resolveHard } from './collision/obstacles';
import { rk4Step } from './integration/rk4';
import { rollingStep } from './motion/rolling';
import { sanitizeParams } from './params';
import type { BallSimState, SimPhase } from './types';
import { clamp, horizontal, safeDt, sanitizeVector } from './utils';

export type { BallSimState, SimPhase } from './types';
export { createInitialState } from './initialState';
export { getReynoldsNumber } from './forces/reynolds';

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
