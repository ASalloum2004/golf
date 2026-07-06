

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../store/usePhysicsStore';
import { physicsStep, createInitialState, getReynoldsNumber } from './PhysicsEngine';
import type { BallSimState } from './PhysicsEngine';


const FIXED_DT = 1 / 240;
const MAX_FRAME_DT = 0.05;
const MAX_STEPS_PER_FRAME = 24;

export function usePhysicsLoop(): void {



  const snapRef = useRef(usePhysicsStore.getState());
  useEffect(() => {
    const unsub = usePhysicsStore.subscribe(s => { snapRef.current = s; });
    return unsub;
  }, []);


  const simRef     = useRef<BallSimState | null>(null);
  const wasActive  = useRef(false);
  const accumulatorRef = useRef(0);


  useFrame((_, delta) => {
    const snap = snapRef.current;


    if (snap.simActive && !wasActive.current) {
      simRef.current = createInitialState(snap, snap.shotStartPosition);
      accumulatorRef.current = 0;
    }
    wasActive.current = snap.simActive;

    if (!snap.simActive || !simRef.current) return;


    if (simRef.current.phase === 'stopped') {
      const { x, y, z } = simRef.current.position;
      usePhysicsStore.getState().completeShot([x, y, z], simRef.current.inCup, simRef.current.inWater);
      return;
    }



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



    const { x, y, z } = cur.position;
    usePhysicsStore.getState().updateBallPosition([x, y, z]);


    const Re = getReynoldsNumber(cur.velocity, snap);


    const carry = cur.landingPos
      ? Math.sqrt(cur.landingPos.x ** 2 + cur.landingPos.z ** 2)
      : 0;


    const total = Math.sqrt(x ** 2 + z ** 2);


    const side = x;


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


    if (cur.phase === 'stopped') {
      usePhysicsStore.getState().completeShot([x, y, z], cur.inCup, cur.inWater);
    }
  });
}
