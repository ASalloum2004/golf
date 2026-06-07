import type { PhysicsState } from '../store/usePhysicsStore';
import type { SafePhysicsParams } from './types';
import { clamp } from './utils';

export function sanitizeParams(p: PhysicsState): SafePhysicsParams {
  const safe = {
    ...p,
    loftAngle: clamp(p.loftAngle, 0, 64),
    clubFriction: clamp(p.clubFriction, 0, 1),
    initialVelocity: clamp(p.initialVelocity, 0, 100),
    verticalAngle: clamp(p.verticalAngle, -20, 90),
    horizontalAngle: clamp(p.horizontalAngle, -45, 45),
    spinSpeed: clamp(p.spinSpeed, 0, 1000),
    spinAxis: clamp(p.spinAxis, -90, 90),
    mass: clamp(p.mass, 1, 1000),
    radius: clamp(p.radius, 0.001, 0.1),
    inertiaConstant: clamp(p.inertiaConstant, 0.01, 1),
    gravity: clamp(p.gravity, 0, 50),
    airDensity: clamp(p.airDensity, 0, 3),
    windSpeed: clamp(p.windSpeed, 0, 100),
    windDirection: ((Number.isFinite(p.windDirection) ? p.windDirection : 0) % 360 + 360) % 360,
    buoyancy: Boolean(p.buoyancy),
    dragCoeff: clamp(p.dragCoeff, 0, 2),
    liftCoeff: clamp(p.liftCoeff, 0, 2),
    sideForceCoeff: clamp(p.sideForceCoeff, 0, 2),
    spinDamping: clamp(p.spinDamping, 0, 5),
    restitution: clamp(p.restitution, 0, 1),
    surfaceFriction: clamp(p.surfaceFriction, 0, 1),
    rollingResistance: clamp(p.rollingResistance, 0, 2),
    obstacleRestitution: clamp(p.obstacleRestitution, 0, 1),
    obstacleFriction: clamp(p.obstacleFriction, 0, 1),
    vegDamping: clamp(p.vegDamping, 0, 1),
    cupRestitution: clamp(p.cupRestitution, 0, 1),
    flagstickRestitution: clamp(p.flagstickRestitution, 0, 1),
    flagstickFriction: clamp(p.flagstickFriction, 0, 1),
    dynamicViscosity: clamp(p.dynamicViscosity, 1e-8, 1e-3),
  };

  return { ...safe, massKg: safe.mass * 1e-3 };
}
