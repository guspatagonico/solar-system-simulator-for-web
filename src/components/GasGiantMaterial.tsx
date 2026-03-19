import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  texture: THREE.Texture;
  color: string;
  id: string;
}

const GasGiantMaterial: React.FC<Props> = ({ texture, color, id }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIsJupiter: { value: id === 'jupiter' ? 1.0 : 0.0 },
  }), [texture, color, id]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIsJupiter;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Base texture with some horizontal movement for cloud bands
      float bandSpeed = 0.02;
      vec2 movingUv = vUv;
      
      // Different bands move at different speeds
      float band = floor(vUv.y * 10.0);
      movingUv.x += uTime * bandSpeed * (sin(band * 1.5) * 0.5 + 0.5);

      vec4 texColor = texture2D(uTexture, movingUv);
      
      // Mix with base color
      vec3 finalColor = mix(texColor.rgb, uColor, 0.2);

      // Add Great Red Spot for Jupiter
      if (uIsJupiter > 0.5) {
        // Spot position (approximate)
        vec2 spotPos = vec2(0.7, 0.35); 
        // Move spot with rotation
        spotPos.x = mod(spotPos.x - uTime * 0.01, 1.0);
        
        // Elliptical shape for the spot
        vec2 diff = vUv - spotPos;
        // Handle wrapping for x
        if (diff.x > 0.5) diff.x -= 1.0;
        if (diff.x < -0.5) diff.x += 1.0;
        
        float ellipseDist = length(diff * vec2(1.0, 2.0));
        
        if (ellipseDist < 0.04) {
          float spotIntensity = smoothstep(0.04, 0.02, ellipseDist);
          finalColor = mix(finalColor, vec3(0.6, 0.1, 0.1), spotIntensity * 0.8);
        }
      }

      // Dynamic lighting relative to Sun at (0,0,0)
      // vViewPosition is the position in view space. 
      // We need the light direction in view space.
      // Since the Sun is at world (0,0,0), its view space position is (viewMatrix * vec4(0,0,0,1)).xyz
      
      // For simplicity, we can just use the normal in view space and assume light comes from the origin
      // But a better way is to pass the light direction or use a standard material.
      // However, since we are in a shader, let's just use a reasonable approximation for now
      // or pass the sun position.
      
      vec3 lightDir = normalize(vViewPosition); // Towards the origin in view space
      float diff = max(dot(vNormal, lightDir), 0.05);
      
      gl_FragColor = vec4(finalColor * diff, 1.0);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  );
};

export default GasGiantMaterial;
