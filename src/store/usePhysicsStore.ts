import { create } from 'zustand';

export type SurfaceType = 'Green' | 'Fairway' | 'Rough' | 'Sand';
export type CameraMode = 'Follow' | 'TopDown' | 'Free';
export type BallPosition = [number, number, number];

export interface Obstacle {
  id: string;
  type: 'Tree' | 'Wall';
  position: [number, number, number];
}

export interface PhysicsState {
  loftAngle: number;
  clubFriction: number;
  initialVelocity: number;
  verticalAngle: number;
  horizontalAngle: number;
  spinSpeed: number;
  spinAxis: number;
  mass: number;
  radius: number;
  inertiaConstant: number;
  gravity: number;
  airDensity: number;
  windSpeed: number;
  windDirection: number;
  buoyancy: boolean;
  dragCoeff: number;
  liftCoeff: number;
  sideForceCoeff: number;
  spinDamping: number;
  surface: SurfaceType;
  restitution: number;
  surfaceFriction: number;
  rollingResistance: number;
  obstacleRestitution: number;
  obstacleFriction: number;
  vegDamping: number;
  cupRestitution: number;
  flagstickRestitution: number;
  flagstickFriction: number;
  dynamicViscosity: number;
}

export const surfacePresets: Record<SurfaceType, { restitution: number; surfaceFriction: number; rollingResistance: number }> = {
  Green: { restitution: 0.3, surfaceFriction: 0.3, rollingResistance: 0.05 },
  Fairway: { restitution: 0.5, surfaceFriction: 0.4, rollingResistance: 0.1 },
  Rough: { restitution: 0.2, surfaceFriction: 0.6, rollingResistance: 0.25 },
  Sand: { restitution: 0.05, surfaceFriction: 0.8, rollingResistance: 0.4 },
};

const paramLimits: Partial<Record<keyof PhysicsState, [number, number]>> = {
  loftAngle: [0, 64],
  clubFriction: [0, 1],
  initialVelocity: [0, 100],
  verticalAngle: [-20, 90],
  horizontalAngle: [-45, 45],
  spinSpeed: [0, 1000],
  spinAxis: [-90, 90],
  mass: [1, 1000],
  radius: [0.001, 0.1],
  inertiaConstant: [0.01, 1],
  gravity: [0, 50],
  airDensity: [0, 3],
  windSpeed: [0, 100],
  windDirection: [0, 359],
  dragCoeff: [0, 2],
  liftCoeff: [0, 2],
  sideForceCoeff: [0, 2],
  spinDamping: [0, 5],
  restitution: [0, 1],
  surfaceFriction: [0, 1],
  rollingResistance: [0, 2],
  obstacleRestitution: [0, 1],
  obstacleFriction: [0, 1],
  vegDamping: [0, 1],
  cupRestitution: [0, 1],
  flagstickRestitution: [0, 1],
  flagstickFriction: [0, 1],
  dynamicViscosity: [1e-8, 1e-3],
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const next = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function sanitizeParam<K extends keyof PhysicsState>(
  key: K,
  value: unknown,
  fallback: PhysicsState[K],
): PhysicsState[K] {
  if (key === 'buoyancy') return Boolean(value) as PhysicsState[K];
  if (key === 'surface') {
    const surface = String(value) as SurfaceType;
    return (surface in surfacePresets ? surface : fallback) as PhysicsState[K];
  }

  const limits = paramLimits[key];
  if (!limits) return fallback;

  const [min, max] = limits;
  const clamped = clampNumber(value, fallback as number, min, max);
  if (key === 'windDirection') return (((clamped % 360) + 360) % 360) as PhysicsState[K];
  return clamped as PhysicsState[K];
}

function nextObstacleId(obstacles: Obstacle[], type: Obstacle['type']): string {
  const prefix = type.toLowerCase();
  const maxId = obstacles.reduce((max, obstacle) => {
    const match = obstacle.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${maxId + 1}`;
}

function nextObstaclePosition(obstacles: Obstacle[], type: Obstacle['type']): [number, number, number] {
  const count = obstacles.filter(obstacle => obstacle.type === type).length;
  const lane = [0, -5, 5, -10, 10, -15, 15][count % 7];
  const distance = type === 'Tree' ? -18 - count * 9 : -26 - count * 11;
  return [lane, 0, distance];
}

const initialPhysicsState: PhysicsState = {
  loftAngle: 45, clubFriction: 0.8,
  initialVelocity: 25, verticalAngle: 24, horizontalAngle: 0, spinSpeed: 500, spinAxis: 0,
  mass: 45.93, radius: 0.02135, inertiaConstant: 0.4,
  gravity: 9.81, airDensity: 1.225, windSpeed: 0, windDirection: 0, buoyancy: true,
  dragCoeff: 0.24, liftCoeff: 0.15, sideForceCoeff: 0, spinDamping: 0.05,
  surface: 'Fairway', restitution: 0.5, surfaceFriction: 0.4, rollingResistance: 0.1,
  obstacleRestitution: 0.3, obstacleFriction: 0.3, vegDamping: 0.8,
  cupRestitution: 0.1, flagstickRestitution: 0.2, flagstickFriction: 0.5,
  dynamicViscosity: 0.0000181
};

const MAX_SHOTS = 3;
const createStartBallPosition = (radius: number): BallPosition => [0, radius, 0];

interface PhysicsStore extends PhysicsState {
  // Dynamic Scene State
  cameraMode: CameraMode;
  ballPosition: BallPosition;
  shotStartPosition: BallPosition;
  obstacles: Obstacle[];
  selectedObstacle: string | null;

  // Gameplay State
  currentShot: number;
  maxShots: number;
  isBallMoving: boolean;
  canShoot: boolean;
  gameWon: boolean;
  gameLost: boolean;
  stoppedPositions: BallPosition[];
  
  // Real-time Metrics (updated by Physics loop)
  metrics: {
    status: string;
    flightTime: number;
    maxHeight: number;
    carryDistance: number;
    totalDistance: number;
    sideDeviation: number;
    landingSpeed: number;
    landingAngle: number;
    reynoldsNumber: number;
  };

  // Actions
  updateParam: (key: keyof PhysicsState, value: unknown) => void;
  setSurface: (surface: SurfaceType) => void;
  resetParams: () => void;
  restartAttempt: () => void;
  
  setCameraMode: (mode: CameraMode) => void;
  updateBallPosition: (pos: BallPosition) => void;
  
  // Simulation control
  simActive: boolean;
  hitBall: () => void;
  stopSim: () => void;
  completeShot: (finalPosition: BallPosition, inCup: boolean) => void;
  updateMetrics: (patch: Partial<PhysicsStore['metrics']>) => void;

  addObstacle: (type: 'Tree' | 'Wall') => void;
  shiftSelectedObstacle: (dx: number) => void;
  shiftObstacleZ: (dz: number) => void;
  removeSelectedObstacle: () => void;
  setSelectedObstacle: (id: string | null) => void;
}

const emptyMetrics = {
  status: 'Stopped',
  flightTime: 0, maxHeight: 0, carryDistance: 0,
  totalDistance: 0, sideDeviation: 0,
  landingSpeed: 0, landingAngle: 0, reynoldsNumber: 0,
} as const;

export const usePhysicsStore = create<PhysicsStore>((set) => ({
  ...initialPhysicsState,

  cameraMode: 'Follow',
  ballPosition: createStartBallPosition(initialPhysicsState.radius),
  shotStartPosition: createStartBallPosition(initialPhysicsState.radius),
  obstacles: [],
  selectedObstacle: null,
  simActive: false,
  currentShot: 0,
  maxShots: MAX_SHOTS,
  isBallMoving: false,
  canShoot: true,
  gameWon: false,
  gameLost: false,
  stoppedPositions: [],

  metrics: { ...emptyMetrics },

  updateParam: (key, value) => set((state) => {
    const nextValue = sanitizeParam(key, value, state[key]);
    const patch: Partial<PhysicsStore> = { [key]: nextValue } as Partial<PhysicsStore>;

    if (key === 'radius' && !state.isBallMoving) {
      const adjustedPosition = [state.ballPosition[0], nextValue as number, state.ballPosition[2]] as BallPosition;
      patch.ballPosition = adjustedPosition;
      patch.shotStartPosition = adjustedPosition;
    }

    return patch;
  }),
  setSurface: (surface) => set((state) => {
    const safeSurface = surface in surfacePresets ? surface : state.surface;
    return { surface: safeSurface, ...surfacePresets[safeSurface] };
  }),

  resetParams: () => set((state) => {
    const patch: Partial<PhysicsStore> = {
      ...initialPhysicsState,
      obstacles: state.obstacles,
      selectedObstacle: state.selectedObstacle,
      cameraMode: state.cameraMode,
      ballPosition: state.isBallMoving
        ? state.ballPosition
        : [state.ballPosition[0], initialPhysicsState.radius, state.ballPosition[2]],
      shotStartPosition: state.isBallMoving
        ? state.shotStartPosition
        : [state.ballPosition[0], initialPhysicsState.radius, state.ballPosition[2]],
      simActive: state.simActive,
      currentShot: state.currentShot,
      maxShots: state.maxShots,
      isBallMoving: state.isBallMoving,
      canShoot: state.canShoot,
      gameWon: state.gameWon,
      gameLost: state.gameLost,
      stoppedPositions: state.stoppedPositions,
      metrics: state.metrics,
    };

    return patch;
  }),

  restartAttempt: () => set((state) => ({
    simActive: false,
    isBallMoving: false,
    canShoot: true,
    gameWon: false,
    gameLost: false,
    currentShot: 0,
    maxShots: MAX_SHOTS,
    ballPosition: createStartBallPosition(state.radius),
    shotStartPosition: createStartBallPosition(state.radius),
    stoppedPositions: [],
    metrics: { ...emptyMetrics },
    // keep obstacles & camera as they are
    obstacles: state.obstacles,
    cameraMode: state.cameraMode,
  })),

  hitBall: () => set((state) => {
    if (!state.canShoot || state.isBallMoving || state.gameWon || state.gameLost || state.currentShot >= state.maxShots) {
      return {};
    }

    const launchPosition: BallPosition = [
      state.ballPosition[0],
      state.ballPosition[1],
      state.ballPosition[2],
    ];

    return {
      simActive: true,
      isBallMoving: true,
      canShoot: false,
      currentShot: state.currentShot + 1,
      shotStartPosition: launchPosition,
      metrics: { ...emptyMetrics, status: 'Flying' },
    };
  }),

  stopSim: () => set((state) => ({
    simActive: false,
    isBallMoving: false,
    canShoot: !state.gameWon && !state.gameLost && state.currentShot < state.maxShots,
  })),

  completeShot: (finalPosition, inCup) => set((state) => {
    const stoppedPosition: BallPosition = [
      finalPosition[0],
      finalPosition[1],
      finalPosition[2],
    ];
    const gameWon = state.gameWon || inCup;
    const gameLost = !gameWon && state.currentShot >= state.maxShots;

    return {
      simActive: false,
      isBallMoving: false,
      canShoot: !gameWon && !gameLost && state.currentShot < state.maxShots,
      gameWon,
      gameLost,
      ballPosition: stoppedPosition,
      stoppedPositions: [...state.stoppedPositions, stoppedPosition],
      metrics: {
        ...state.metrics,
        status: gameWon ? 'You Win' : gameLost ? 'You Lose' : 'Stopped',
      },
    };
  }),

  updateMetrics: (patch) => set((state) => ({
    metrics: { ...state.metrics, ...patch },
  })),
  
  setCameraMode: (mode) => set({ cameraMode: mode }),
  updateBallPosition: (pos) => set({ ballPosition: pos }),
  
  addObstacle: (type) => set((state) => {
    const safeType = type === 'Wall' ? 'Wall' : 'Tree';
    const newObs: Obstacle = {
      id: nextObstacleId(state.obstacles, safeType),
      type: safeType,
      position: nextObstaclePosition(state.obstacles, safeType)
    };
    return { obstacles: [...state.obstacles, newObs], selectedObstacle: newObs.id };
  }),
  
  shiftSelectedObstacle: (dx) => set((state) => ({
    obstacles: state.obstacles.map(o => 
      o.id === state.selectedObstacle 
        ? { ...o, position: [o.position[0] + dx, o.position[1], o.position[2]] } 
        : o
    )
  })),

  shiftObstacleZ: (dz) => set((state) => ({
    obstacles: state.obstacles.map(o =>
      o.id === state.selectedObstacle
        ? { ...o, position: [o.position[0], o.position[1], o.position[2] + dz] }
        : o
    )
  })),
  
  removeSelectedObstacle: () => set((state) => ({
    obstacles: state.obstacles.filter(o => o.id !== state.selectedObstacle),
    selectedObstacle: null
  })),
  
  setSelectedObstacle: (id) => set({ selectedObstacle: id })
}));
