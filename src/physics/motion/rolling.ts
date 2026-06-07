import * as THREE from 'three';
import { EPS } from '../constants';
import { windVelocity } from '../forces/wind';
import type { RollingStepResult, SafePhysicsParams } from '../types';
import { horizontal } from '../utils';

export function rollingStep(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  dt: number,
  p: SafePhysicsParams,
): RollingStepResult {
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
