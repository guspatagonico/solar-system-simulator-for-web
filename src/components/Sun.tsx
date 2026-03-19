import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SCALE_FACTORS } from '../constants';
import { SimulationState } from '../types';

interface Props {
  radius: number;
  state: SimulationState;
}

const Sun: React.FC<Props> = ({ radius, state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const visualRadius = radius * SCALE_FACTORS.PLANET_SIZE;

  // Use a persistent time value to handle pausing and scaling
  const timeRef = useRef(0);

  // Custom shader for the sun's surface
  const sunShader = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('#ffcc33') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      // Simple noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        float n = noise(vUv * 10.0 + time * 0.1);
        float pulse = sin(time * 0.5) * 0.1 + 0.9;
        vec3 finalColor = color * (pulse + n * 0.2);
        
        // Fresnel effect for glow
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(finalColor + intensity * vec3(1.0, 0.5, 0.0), 1.0);
      }
    `
  }), []);

  useFrame((threeState, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }

    const time = timeRef.current;
    if (meshRef.current) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value = time;
      meshRef.current.rotation.y += 0.001 * state.timeScale;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002 * state.timeScale;
      glowRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.02);
    }
  });

  return (
    <group>
      {/* Sun Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[visualRadius, 64, 64]} />
        <shaderMaterial
          uniforms={sunShader.uniforms}
          vertexShader={sunShader.vertexShader}
          fragmentShader={sunShader.fragmentShader}
        />
      </mesh>

      {/* Sun Glow/Corona */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[visualRadius * 1.2, 64, 64]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point Light - The main light source for the solar system */}
      <pointLight 
        intensity={2 * (state.ambientIntensity * 2)} 
        distance={0} 
        decay={0} 
        color="#ffffff" 
      />
      <ambientLight intensity={state.ambientIntensity} />
      <directionalLight intensity={0.3 * (state.ambientIntensity * 2)} position={[5, 5, 5]} />
    </group>
  );
};

export default Sun;
