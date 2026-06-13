/**
 * usePhysicsLoop — React Three Fiber integration hook
 *
 * Must be called from a component mounted inside an R3F <Canvas>.
 * Uses useFrame for the physics tick (no React state updates inside the loop).
 *
 * Design principles:
 *  • All mutable sim state lives in refs  →  zero React re-renders from physics math
 *  • useFrame drives the loop             →  perfectly synced with GPU render
 *  • Zustand store is read via subscription ref (no React dependency on params)
 *  • Only ballPosition + metrics are written to the store (observed by UI + camera)
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../store/usePhysicsStore';
import { physicsStep, createInitialState, getReynoldsNumber } from './PhysicsEngine';
import type { BallSimState } from './PhysicsEngine';

// Max size of one Euler sub-step (≈62 sub-steps/s at 60 fps render rate)
const FIXED_DT = 1 / 240;
const MAX_FRAME_DT = 0.05;
const MAX_STEPS_PER_FRAME = 24;

export function usePhysicsLoop(): void {
  // ── Non-reactive store snapshot ──────────────────────────────────────────
  // Subscribe to the whole store but only store the reference in a ref,
  // so we never trigger a re-render from reading params.
  const snapRef = useRef(usePhysicsStore.getState());
  useEffect(() => {
    const unsub = usePhysicsStore.subscribe(s => { snapRef.current = s; });
    return unsub;
  }, []);

  // ── Simulation state (pure refs, never touches React) ────────────────────
  const simRef     = useRef<BallSimState | null>(null);
  const wasActive  = useRef(false);
  const accumulatorRef = useRef(0);

  // ── Physics tick ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const snap = snapRef.current;

    // Detect fresh launch (simActive flipped from false → true)
    if (snap.simActive && !wasActive.current) {
      simRef.current = createInitialState(snap, snap.shotStartPosition);
      accumulatorRef.current = 0;
    }
    wasActive.current = snap.simActive;

    if (!snap.simActive || !simRef.current) return;

    // If already stopped (e.g. set by a previous frame), signal the store
    if (simRef.current.phase === 'stopped') {
      const { x, y, z } = simRef.current.position;
      usePhysicsStore.getState().completeShot([x, y, z], simRef.current.inCup, simRef.current.inWater);
      return;
    }

    // ── Sub-stepped integration ──────────────────────────────────────────
    // Fixed timestep keeps physics deterministic and avoids frame-rate-dependent collisions.
    accumulatorRef.current += Math.min(delta, MAX_FRAME_DT);

    let cur = simRef.current;
    let steps = 0;
    while (accumulatorRef.current >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      cur = physicsStep(cur, FIXED_DT, snap, snap.obstacles);
      accumulatorRef.current -= FIXED_DT;
      steps += 1;
      if (cur.phase === 'stopped') break;
    }
    if (steps >= MAX_STEPS_PER_FRAME) accumulatorRef.current = 0;
    simRef.current = cur;

    // ── Push ball position to store ──────────────────────────────────────
    // This updates the 3D mesh position + camera rig each frame.
    const { x, y, z } = cur.position;
    usePhysicsStore.getState().updateBallPosition([x, y, z]);

    // ── Compute & push metrics ───────────────────────────────────────────
    const Re = getReynoldsNumber(cur.velocity, snap);

    // Carry distance: horizontal distance from origin to first landing point
    const carry = cur.landingPos
      ? Math.sqrt(cur.landingPos.x ** 2 + cur.landingPos.z ** 2)
      : 0;

    // Total distance: horizontal distance to current (or final) ball position
    const total = Math.sqrt(x ** 2 + z ** 2);

    // Side deviation: lateral x-offset from straight-ahead line
    const side = x;

    // Landing speed & angle (from velocity at first ground contact)
    let landSpd = 0, landAng = 0;
    if (cur.landingVel) {
      const lv  = cur.landingVel;
      landSpd   = lv.length();
      const vxz = Math.sqrt(lv.x ** 2 + lv.z ** 2);
      landAng   = Math.abs(Math.atan2(Math.abs(lv.y), Math.max(vxz, 1e-3))) * (180 / Math.PI);
    }

    const status =
      cur.inCup              ? 'You Win' :
      cur.phase === 'flying' ? 'Flying' :
      cur.phase === 'rolling'? 'Rolling' :
      cur.inWater            ? 'You Lose' :
      snap.currentShot >= snap.maxShots ? 'You Lose' : 'Stopped';

    usePhysicsStore.getState().updateMetrics({
      status,
      flightTime:    cur.flightTime,
      maxHeight:     Math.max(0, cur.maxHeight - snap.radius),
      carryDistance: carry,
      totalDistance: total,
      sideDeviation: side,
      landingSpeed:  landSpd,
      landingAngle:  landAng,
      reynoldsNumber: Math.round(Re),
    });

    // Signal completion when ball has stopped
    if (cur.phase === 'stopped') {
      usePhysicsStore.getState().completeShot([x, y, z], cur.inCup, cur.inWater);
    }
  });
}
