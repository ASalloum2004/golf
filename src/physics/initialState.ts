import * as THREE from 'three';
import type { PhysicsState } from '../store/usePhysicsStore';
import { DEG2RAD } from './constants';
import { sanitizeParams } from './params';
import type { BallSimState } from './types';

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
