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

  // Club impact (loft + face friction). Loft tilts the launch upward (added on
  // top of the aim angle) and, together with how much the club face grips the
  // ball, sets the backspin imparted at contact. Backspin follows the
  // tangential-grip relation: the face-tangential contact speed (v0·sinL) is
  // turned into spin over the ball radius, scaled by clubFriction. Energy that
  // goes into that spin slightly lowers the forward launch speed. With loft 0
  // (and/or friction 0) these terms vanish and the launch is unchanged.
  const loftRad = p.loftAngle * DEG2RAD;
  const launchAngle = Math.min(vertical + loftRad * 0.5, Math.PI / 2);
  const impactSpin = (p.clubFriction * v0 * Math.sin(loftRad)) / p.radius;
  const launchSpin = p.spinSpeed + impactSpin;
  const launchSpeed = v0 * (1 - 0.25 * p.clubFriction * Math.sin(loftRad));

  return {
    position: new THREE.Vector3(
      Number.isFinite(launchX) ? launchX : 0,
      Number.isFinite(launchY) ? launchY : p.radius,
      Number.isFinite(launchZ) ? launchZ : 0,
    ),
    velocity: new THREE.Vector3(
      launchSpeed * Math.sin(horizontal) * Math.cos(launchAngle),
      launchSpeed * Math.sin(launchAngle),
      -launchSpeed * Math.cos(horizontal) * Math.cos(launchAngle),
    ),
    // spinAxis=0 means backspin around +x; +/-90 means side spin around y.
    omega: new THREE.Vector3(
      launchSpin * Math.cos(spinAxis),
      launchSpin * Math.sin(spinAxis),
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
