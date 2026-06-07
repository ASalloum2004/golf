import type * as THREE from 'three';
import type { PhysicsState } from '../store/usePhysicsStore';

export type SimPhase = 'flying' | 'rolling' | 'stopped';

export interface BallSimState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  omega: THREE.Vector3;
  phase: SimPhase;
  inCup: boolean;
  flightTime: number;
  maxHeight: number;
  landingPos: THREE.Vector3 | null;
  landingVel: THREE.Vector3 | null;
}

export type SafePhysicsParams = PhysicsState & { massKg: number };

export interface IntegrationState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  omega: THREE.Vector3;
}

export type GroundBounceResult = IntegrationState & {
  nextPhase: 'flying' | 'rolling';
};

export type RollingStepResult = IntegrationState & {
  stopped: boolean;
};

export type CollisionKind = 'hard' | 'veg' | 'none';

export interface CollisionResult {
  kind: CollisionKind;
  normal: THREE.Vector3;
  depth: number;
  point?: THREE.Vector3;
}
