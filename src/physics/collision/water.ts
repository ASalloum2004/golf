import * as THREE from 'three';
import { EPS, WATER_POND } from '../constants';
import { clamp } from '../utils';

interface WaterHit {
  hit: boolean;
  point: THREE.Vector3;
}

function toPondLocal(point: THREE.Vector3): { x: number; z: number } {
  const dx = point.x - WATER_POND.center.x;
  const dz = point.z - WATER_POND.center.z;
  const cos = Math.cos(-WATER_POND.rotationY);
  const sin = Math.sin(-WATER_POND.rotationY);

  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos,
  };
}

function isBelowWaterCatchHeight(point: THREE.Vector3, radius: number): boolean {
  return point.y - radius <= WATER_POND.surfaceY + WATER_POND.catchHeight;
}

function isInsidePond(point: THREE.Vector3, radius: number): boolean {
  if (!isBelowWaterCatchHeight(point, radius)) return false;

  const local = toPondLocal(point);
  const x = local.x / (WATER_POND.radiusX + radius);
  const z = local.z / (WATER_POND.radiusZ + radius);
  return x * x + z * z <= 1;
}

export function checkWaterAlongSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
): WaterHit {
  if (isInsidePond(from, radius)) return { hit: true, point: from.clone() };
  if (isInsidePond(to, radius)) return { hit: true, point: to.clone() };

  const localFrom = toPondLocal(from);
  const localTo = toPondLocal(to);
  const rx = WATER_POND.radiusX + radius;
  const rz = WATER_POND.radiusZ + radius;
  const dx = localTo.x - localFrom.x;
  const dz = localTo.z - localFrom.z;

  const a = (dx * dx) / (rx * rx) + (dz * dz) / (rz * rz);
  const b = 2 * ((localFrom.x * dx) / (rx * rx) + (localFrom.z * dz) / (rz * rz));
  const c = (localFrom.x * localFrom.x) / (rx * rx) + (localFrom.z * localFrom.z) / (rz * rz) - 1;
  const discriminant = b * b - 4 * a * c;

  if (a < EPS || discriminant < 0) return { hit: false, point: to.clone() };

  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);
  const t = [t1, t2].filter((value) => value >= 0 && value <= 1).sort((x, y) => x - y)[0];

  if (t === undefined) return { hit: false, point: to.clone() };

  const point = from.clone().lerp(to, clamp(t, 0, 1));
  return isBelowWaterCatchHeight(point, radius)
    ? { hit: true, point }
    : { hit: false, point: to.clone() };
}
