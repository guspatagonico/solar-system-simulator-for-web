import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  texture: THREE.Texture;
  color: string;
}

const RingMaterial: React.FC<Props> = ({ texture, color }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
  }), [texture, color]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      // vUv.x is angular (0 to 1), vUv.y is radial (0 to 1)
      
      // Sample the ring texture
      // The texture is a horizontal strip where x is radius.
      // In RingGeometry, vUv.y is the radius.
      vec4 texColor = texture2D(uTexture, vec2(vUv.y, 0.5));
      
      // Add procedural fine-grained "dust" and "streaks"
      // Angular noise for streaks
      float angularNoise = sin(vUv.x * 500.0 + vUv.y * 100.0 + uTime * 0.2) * 0.02;
      
      // Radial bands for extra detail
      float radialBands = sin(vUv.y * 1500.0) * 0.03;
      
      // Shimmering effect based on angle and time
      float shimmer = sin(vUv.x * 20.0 - uTime * 1.5) * 0.05;
      
      vec3 finalColor = texColor.rgb * uColor;
      finalColor += angularNoise + radialBands + shimmer;
      
      // Transparency from texture alpha
      float alpha = texColor.a;
      
      // Fade edges slightly for a smoother look
      alpha *= smoothstep(0.0, 0.02, vUv.y);
      alpha *= smoothstep(1.0, 0.98, vUv.y);
      
      // Lighting
      // Rings are influenced by the sun at (0,0,0)
      vec3 lightDir = normalize(-vWorldPosition);
      
      // Diffuse lighting (double sided)
      float diff = max(abs(dot(vNormal, lightDir)), 0.3);
      
      // Backscatter effect (glow when looking towards the sun through the rings)
      float backscatter = pow(1.0 - abs(dot(vNormal, lightDir)), 4.0) * 0.4;
      
      // Specular-like shimmer
      float specular = pow(max(dot(vNormal, lightDir), 0.0), 32.0) * 0.2;
      
      gl_FragColor = vec4(finalColor * diff + backscatter + specular, alpha * 0.9);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
};

export default RingMaterial;
