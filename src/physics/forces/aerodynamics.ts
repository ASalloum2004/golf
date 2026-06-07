import * as THREE from 'three';
import { EPS } from '../constants';
import type { SafePhysicsParams } from '../types';
import { horizontal } from '../utils';
import { windVelocity } from './wind';

export function aerodynamicAcceleration(
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
