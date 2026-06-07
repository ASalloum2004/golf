import * as THREE from 'three';
import { aerodynamicAcceleration } from '../forces/aerodynamics';
import type { IntegrationState, SafePhysicsParams } from '../types';

export function rk4Step(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  omega: THREE.Vector3,
  dt: number,
  p: SafePhysicsParams,
): IntegrationState {
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
