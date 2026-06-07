import * as THREE from 'three';
import { EPS } from '../constants';
import type { GroundBounceResult, SafePhysicsParams } from '../types';
import { horizontal } from '../utils';

export function groundBounce(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  p: SafePhysicsParams,
): GroundBounceResult {
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
