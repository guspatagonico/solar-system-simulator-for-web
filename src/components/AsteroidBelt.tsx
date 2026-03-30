import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationState } from '../types';

interface Props {
  state: SimulationState;
}

const AsteroidBelt: React.FC<Props> = ({ state }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const minDist = Math.pow(227.9, 0.6) * 10;
      const maxDist = Math.pow(778.6, 0.6) * 10;

      const t = Math.random();
      const distFactor = minDist + (maxDist - minDist) * (0.3 + t * 0.4 + (Math.random() - 0.5) * 0.3);
      const angle = Math.random() * Math.PI * 2;

      const eccentricity = 0.05 + Math.random() * 0.15;
      const semiMajor = distFactor;
      const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);

      positions[i * 3] = semiMajor * Math.cos(angle) - semiMajor * eccentricity * Math.random();
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = semiMinor * Math.sin(angle);

      const brightness = 0.4 + Math.random() * 0.4;
      const warmth = Math.random() * 0.1;
      colors[i * 3] = brightness + warmth;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness * 0.75;
    }

    return { positions, colors };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * state.timeScale * 0.00001;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

export default AsteroidBelt;
