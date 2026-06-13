import * as THREE from 'three';
import type { BallPosition, PhysicsState } from '../store/usePhysicsStore';
import { CUP_CENTER, DEG2RAD, EPS } from './constants';
import { sanitizeParams } from './params';
import type { BallSimState } from './types';

export function getShotReferenceAngle(launchPosition: BallPosition): number {
  const [x, , z] = launchPosition;
  const dx = CUP_CENTER.x - (Number.isFinite(x) ? x : 0);
  const dz = CUP_CENTER.z - (Number.isFinite(z) ? z : 0);

  if (Math.hypot(dx, dz) < EPS) return 0;
  return Math.atan2(dx, -dz);
}

export function createInitialState(
  params: PhysicsState,
  launchPosition: BallPosition = [0, params.radius, 0],
): BallSimState {
  const p = sanitizeParams(params);
  const v0 = p.initialVelocity;
  const vertical = p.verticalAngle * DEG2RAD;
  const horizontal = getShotReferenceAngle(launchPosition) + p.horizontalAngle * DEG2RAD;
  const spinAxis = p.spinAxis * DEG2RAD;
  const [launchX, launchY, launchZ] = launchPosition;

  return {
    position: new THREE.Vector3(
      Number.isFinite(launchX) ? launchX : 0,
      Number.isFinite(launchY) ? launchY : p.radius,
      Number.isFinite(launchZ) ? launchZ : 0,
    ),
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
    inWater: false,
    flightTime: 0,
    maxHeight: p.radius,
    landingPos: null,
    landingVel: null,
  };
}
