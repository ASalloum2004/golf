import * as THREE from 'three';
import { DEG2RAD } from '../constants';
import type { SafePhysicsParams } from '../types';

export function windVelocity(p: SafePhysicsParams): THREE.Vector3 {
  const a = p.windDirection * DEG2RAD;

  // 0 degrees is a headwind relative to the default shot direction (-z).
  return new THREE.Vector3(
    p.windSpeed * Math.sin(a),
    0,
    p.windSpeed * Math.cos(a),
  );
}
