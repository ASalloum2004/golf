import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { CUP_CENTER, PLAY_AREA } from '../../physics/constants';
import { getShotReferenceAngle } from '../../physics/initialState';

const COURSE_VIEW_MARGIN = 0.45;
const FREECAM_MARGIN = 24;
const FREECAM_BOUNDS = {
  minX: PLAY_AREA.minX - FREECAM_MARGIN,
  maxX: PLAY_AREA.maxX + FREECAM_MARGIN,
  minY: 0.7,
  maxY: 140,
  minZ: PLAY_AREA.minZ - FREECAM_MARGIN,
  maxZ: PLAY_AREA.maxZ + FREECAM_MARGIN,
} as const;

function clampFreecamPosition(position: THREE.Vector3): void {
  position.set(
    THREE.MathUtils.clamp(position.x, FREECAM_BOUNDS.minX, FREECAM_BOUNDS.maxX),
    THREE.MathUtils.clamp(position.y, FREECAM_BOUNDS.minY, FREECAM_BOUNDS.maxY),
    THREE.MathUtils.clamp(position.z, FREECAM_BOUNDS.minZ, FREECAM_BOUNDS.maxZ),
  );
}

function FreeCameraControls() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const isPointerLocked = useRef(false);
  const isDragging = useRef(false);
  const rotation = useRef({ yaw: 0, pitch: -0.25 });
  const targetRotation = useRef({ yaw: 0, pitch: -0.25 });
  const moveVector = useMemo(() => new THREE.Vector3(), []);
  const viewForward = useMemo(() => new THREE.Vector3(), []);
  const viewRight = useMemo(() => new THREE.Vector3(), []);
  const worldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

  useEffect(() => {
    const initialEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotation.current = {
      yaw: initialEuler.y,
      pitch: THREE.MathUtils.clamp(initialEuler.x, -1.35, 1.2),
    };
    targetRotation.current = { ...rotation.current };
    camera.up.set(0, 1, 0);

    const canvas = gl.domElement;
    const pressedKeys = keys.current;

    const handlePointerDown = () => {
      isDragging.current = true;
      canvas.requestPointerLock?.();
    };
    const handlePointerUp = () => {
      isDragging.current = false;
    };
    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
      if (!isPointerLocked.current) isDragging.current = false;
    };
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current && !isDragging.current) return;
      const sensitivity = 0.0022;
      targetRotation.current.yaw -= event.movementX * sensitivity;
      targetRotation.current.pitch = THREE.MathUtils.clamp(
        targetRotation.current.pitch - event.movementY * sensitivity,
        -1.35,
        1.2,
      );
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
        pressedKeys.add(event.code);
        event.preventDefault();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      pressedKeys.clear();
      isDragging.current = false;
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    rotation.current.yaw = THREE.MathUtils.damp(rotation.current.yaw, targetRotation.current.yaw, 18, dt);
    rotation.current.pitch = THREE.MathUtils.damp(rotation.current.pitch, targetRotation.current.pitch, 18, dt);

    euler.set(rotation.current.pitch, rotation.current.yaw, 0);
    camera.quaternion.setFromEuler(euler);
    camera.up.set(0, 1, 0);
    camera.updateMatrixWorld();

    camera.getWorldDirection(viewForward).normalize();
    viewRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    moveVector.set(0, 0, 0);

    if (keys.current.has('KeyW')) moveVector.add(viewForward);
    if (keys.current.has('KeyS')) moveVector.sub(viewForward);
    if (keys.current.has('KeyD')) moveVector.add(viewRight);
    if (keys.current.has('KeyA')) moveVector.sub(viewRight);
    if (keys.current.has('Space')) moveVector.add(worldUp);
    if (keys.current.has('ShiftLeft') || keys.current.has('ShiftRight')) moveVector.sub(worldUp);

    if (moveVector.lengthSq() > 0) {
      const speed = 22;
      moveVector.normalize().multiplyScalar(speed * dt);
      camera.position.add(moveVector);
      clampFreecamPosition(camera.position);
    }
  });

  return null;
}

export function CameraRig() {
  const mode = usePhysicsStore((state) => state.cameraMode);
  const ballPosition = usePhysicsStore((state) => state.ballPosition);
  const shotStartPosition = usePhysicsStore((state) => state.shotStartPosition);
  const isBallMoving = usePhysicsStore((state) => state.isBallMoving);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (mode === 'Free') return;

    const smoothTime = 4 * delta;

    if (mode === 'Follow') {
      const referencePosition = isBallMoving ? shotStartPosition : ballPosition;
      const referenceAngle = getShotReferenceAngle(referencePosition);
      const forwardX = Math.sin(referenceAngle);
      const forwardZ = -Math.cos(referenceAngle);
      const distanceToCup = Math.hypot(CUP_CENTER.x - ballPosition[0], CUP_CENTER.z - ballPosition[2]);
      const lookAheadDistance = THREE.MathUtils.clamp(distanceToCup * 0.35, 2, 8);

      state.camera.position.lerp(
        vec.set(
          ballPosition[0] - forwardX * 4,
          ballPosition[1] + 1.5,
          ballPosition[2] - forwardZ * 4,
        ),
        smoothTime,
      );
      target.lerp(
        vec.set(
          ballPosition[0] + forwardX * lookAheadDistance,
          ballPosition[1],
          ballPosition[2] + forwardZ * lookAheadDistance,
        ),
        smoothTime,
      );
      state.camera.up.set(0, 1, 0);
      state.camera.lookAt(target);
    } else if (mode === 'TopDown') {
      const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX + COURSE_VIEW_MARGIN * 2;
      const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ + COURSE_VIEW_MARGIN * 2;
      const aspect = Math.max(0.1, state.size.width / Math.max(1, state.size.height));
      const fov = 'fov' in state.camera ? THREE.MathUtils.degToRad(state.camera.fov) : Math.PI / 4;
      const halfFovTan = Math.tan(fov / 2);
      const landscapeFramedSpan = Math.max(courseWidth, courseLength / aspect);
      const fitHeight = landscapeFramedSpan / (2 * halfFovTan);
      const overviewHeight = Math.max(88, fitHeight);
      const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
      const centerZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;

      state.camera.position.lerp(vec.set(centerX, overviewHeight, centerZ), smoothTime);
      target.lerp(vec.set(centerX, 0, centerZ), smoothTime);
      state.camera.up.set(1, 0, 0);
      state.camera.lookAt(target);
    }
  });

  return mode === 'Free' ? <FreeCameraControls /> : null;
}
