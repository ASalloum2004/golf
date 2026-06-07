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
const MAX_SUB_DT = 0.016;

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

  // ── Physics tick ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const snap = snapRef.current;

    // Detect fresh launch (simActive flipped from false → true)
    if (snap.simActive && !wasActive.current) {
      simRef.current = createInitialState(snap);
    }
    wasActive.current = snap.simActive;

    if (!snap.simActive || !simRef.current) return;

    // If already stopped (e.g. set by a previous frame), signal the store
    if (simRef.current.phase === 'stopped') {
      usePhysicsStore.getState().stopSim();
      return;
    }

    // ── Sub-stepped integration ──────────────────────────────────────────
    // Cap delta to 50 ms to prevent spiral-of-death after tab background pause
    const capped = Math.min(delta, 0.05);
    const steps  = Math.ceil(capped / MAX_SUB_DT);
    const dt     = capped / steps;

    let cur = simRef.current;
    for (let i = 0; i < steps; i++) {
      cur = physicsStep(cur, dt, snap, snap.obstacles);
      if (cur.phase === 'stopped') break;
    }
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
      cur.inCup              ? 'You Win'  :
      cur.phase === 'flying' ? 'Flying'   :
      cur.phase === 'rolling'? 'Rolling'  : 'You Lose';

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
      usePhysicsStore.getState().stopSim();
    }
  });
}
