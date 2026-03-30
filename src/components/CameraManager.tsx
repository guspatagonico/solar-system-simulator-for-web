import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ALL_BODIES, SCALE_FACTORS } from '../constants';
import { CameraPOV } from './HUD';

interface Props {
  focusedBodyId: string | null;
  visualEnhancement: number;
  cameraPOV: CameraPOV | null;
}

const CameraManager: React.FC<Props> = ({ focusedBodyId, visualEnhancement, cameraPOV }) => {
  const { camera, scene } = useThree();
  const [lastPOVId, setLastPOVId] = useState<string | null>(null);
  const isPOVTransition = useRef(false);
  const povTransitionStartTime = useRef(0);
  const [lastId, setLastId] = useState<string | null>(null);
  const isTransitioning = useRef(false);
  const transitionStartTime = useRef(0);
  const transitionDuration = 1.5; // seconds
  
  const startCamPos = useRef(new THREE.Vector3());
  const startTargetPos = useRef(new THREE.Vector3());

  const lastWorldPos = useRef(new THREE.Vector3());

  // Handle target change
  useEffect(() => {
    if (focusedBodyId !== lastId) {
      setLastId(focusedBodyId);
      if (focusedBodyId) {
        isTransitioning.current = true;
        transitionStartTime.current = 0; // Reset in useFrame
        
        startCamPos.current.copy(camera.position);
        const controls = (camera as any).controls || (window as any).controls;
        if (controls) {
          startTargetPos.current.copy(controls.target);
        }

        // Initialize lastWorldPos for relative motion
        const body = scene.getObjectByName(focusedBodyId);
        if (body) {
          body.getWorldPosition(lastWorldPos.current);
        }
      }
    }
  }, [focusedBodyId, lastId, camera, scene]);

  // Handle POV preset change
  useEffect(() => {
    if (cameraPOV && cameraPOV.id !== lastPOVId) {
      setLastPOVId(cameraPOV.id);
      isPOVTransition.current = true;
      povTransitionStartTime.current = 0;
      
      startCamPos.current.copy(camera.position);
      const controls = (camera as any).controls || (window as any).controls;
      if (controls) {
        startTargetPos.current.copy(controls.target);
      }
    }
  }, [cameraPOV, lastPOVId, camera]);

  useFrame((state, delta) => {
    const controls = (state as any).controls;
    if (!controls) return;

    // Handle POV transition independently
    if (isPOVTransition.current && cameraPOV) {
      if (povTransitionStartTime.current === 0) {
        povTransitionStartTime.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - povTransitionStartTime.current;
      const t = Math.min(elapsed / transitionDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      const targetPos = new THREE.Vector3(...cameraPOV.target);
      const cameraPos = new THREE.Vector3(...cameraPOV.position);

      controls.target.lerpVectors(startTargetPos.current, targetPos, ease);
      camera.position.lerpVectors(startCamPos.current, cameraPos, ease);

      if (t >= 1) {
        isPOVTransition.current = false;
      }

      controls.minDistance = 1;
      controls.maxDistance = 500000;
      return;
    }

    // Skip body following if no focused body
    if (!focusedBodyId) return;

    const body = scene.getObjectByName(focusedBodyId);
    if (!body) return;

    const worldPos = new THREE.Vector3();
    body.getWorldPosition(worldPos);
    if (!controls) return;

    if (isTransitioning.current) {
      if (transitionStartTime.current === 0) {
        transitionStartTime.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - transitionStartTime.current;
      const t = Math.min(elapsed / transitionDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out

      // Calculate ideal distance for the transition
      const bodyData = ALL_BODIES.find(d => d.id === focusedBodyId);
      let targetDistance = 500;
      let visualRadius = 10;

      if (bodyData) {
        const baseRadius = bodyData.radius * SCALE_FACTORS.PLANET_SIZE;
        const distortionFactor = bodyData.type === 'star' ? 1 : Math.pow(6371 / bodyData.radius, 0.3);
        const enhancement = bodyData.type === 'star' ? 1 : visualEnhancement;
        visualRadius = baseRadius * enhancement * distortionFactor;
        targetDistance = visualRadius * 5;
      }

      // Interpolate target
      controls.target.lerpVectors(startTargetPos.current, worldPos, ease);

      // Interpolate camera position to a good viewing angle/distance
      const direction = camera.position.clone().sub(startTargetPos.current).normalize();
      if (direction.length() === 0) direction.set(0, 0, 1);
      
      const idealPos = worldPos.clone().add(direction.multiplyScalar(targetDistance));
      camera.position.lerpVectors(startCamPos.current, idealPos, ease);

      if (t >= 1) {
        isTransitioning.current = false;
      }
      
      // Update limits
      controls.minDistance = visualRadius * 1.5;
      controls.maxDistance = 500000;
      
      lastWorldPos.current.copy(worldPos);
    } else {
      // Relative motion follow:
      // Apply the planet's movement to the camera and target
      // This preserves user's pan, zoom, and rotation offsets
      const movement = worldPos.clone().sub(lastWorldPos.current);
      
      controls.target.add(movement);
      camera.position.add(movement);
      
      lastWorldPos.current.copy(worldPos);
    }
  });

  return null;
};

export default CameraManager;
