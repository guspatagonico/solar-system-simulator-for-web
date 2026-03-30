import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  texture: THREE.Texture;
}

const SunSurfaceMaterial: React.FC<Props> = ({ texture }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
  }), [texture]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

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
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Base texture
      vec4 texColor = texture2D(uTexture, vUv);
      vec3 baseColor = texColor.rgb;

      // Granulation: 5-octave fBm noise
      vec2 granUv = vUv * 30.0 + uTime * 0.02;
      float granulation = fbm(granUv);
      // Bright granules with darker intergranular lanes
      float granules = smoothstep(0.3, 0.7, granulation) * 0.3;
      vec3 granColor = baseColor + vec3(granules) * 0.3;

      // Sunspots: low-frequency noise thresholded
      vec2 spotUv = vUv * 3.0;
      float sunspotNoise = fbm(spotUv + uTime * 0.005);
      float sunspotMask = smoothstep(0.45, 0.35, sunspotNoise);
      // Cooler orange tint for sunspots
      vec3 sunspotColor = vec3(0.6, 0.25, 0.05) * sunspotMask;

      // Faculae: high-frequency bright spots near sunspot edges
      float faculaNoise = fbm(vUv * 80.0 + uTime * 0.05);
      float faculaMask = smoothstep(0.6, 0.8, faculaNoise);
      // Only show faculae near sunspot boundaries
      float edgeProximity = smoothstep(0.3, 0.5, sunspotNoise) * smoothstep(0.55, 0.4, sunspotNoise);
      vec3 faculaeColor = vec3(1.0, 0.95, 0.8) * faculaMask * edgeProximity * 0.4;

      // Combine layers
      vec3 finalColor = granColor - sunspotColor + faculaeColor;

      // Subtle overall pulsation
      float pulsation = sin(uTime * 2.0) * 0.02 + 1.0;
      finalColor *= pulsation;

      // Simple lighting
      float intensity = max(dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))), 0.5);
      
      gl_FragColor = vec4(finalColor * intensity, 1.0);
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

export default SunSurfaceMaterial;