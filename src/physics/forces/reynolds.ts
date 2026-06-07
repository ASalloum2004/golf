import type * as THREE from 'three';
import type { PhysicsState } from '../../store/usePhysicsStore';
import { sanitizeParams } from '../params';
import { sanitizeVector } from '../utils';
import { windVelocity } from './wind';

export function getReynoldsNumber(vel: THREE.Vector3, params: PhysicsState): number {
  const p = sanitizeParams(params);
  const rel = sanitizeVector(vel).sub(windVelocity(p));
  const diameter = 2 * p.radius;
  return (p.airDensity * rel.length() * diameter) / p.dynamicViscosity;
}
