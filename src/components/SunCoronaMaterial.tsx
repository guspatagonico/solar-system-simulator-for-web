import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SunCoronaMaterial: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

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

    float warpedFbm(vec2 p, float t) {
      vec2 q = vec2(fbm(p + t * 0.1), fbm(p + vec2(5.2, 1.3) + t * 0.12));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.08),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.1));
      return fbm(p + 4.0 * r);
    }

    void main() {
      // Fresnel edge glow: brighter at sphere edges, dim at center
      float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
      fresnel = pow(fresnel, 1.5);

      // Domain-warped fBm wispy tendrils
      vec2 coronaUv = vUv * 4.0;
      float wisps = warpedFbm(coronaUv, uTime);

      // Color gradient: white-yellow inner to orange-red outer (based on Fresnel)
      vec3 innerColor = vec3(1.0, 0.95, 0.7);
      vec3 outerColor = vec3(1.0, 0.35, 0.05);
      vec3 baseColor = mix(innerColor, outerColor, fresnel);

      // Subtle color variation from wisps
      float wispColorShift = warpedFbm(coronaUv + vec2(3.7, 1.9), uTime * 0.8);
      baseColor = mix(baseColor, baseColor * (0.8 + wispColorShift * 0.4), 0.3);

      // Combine: intensity driven by fresnel, modulated by wisps
      float intensity = fresnel * (0.5 + wisps * 0.8);

      gl_FragColor = vec4(baseColor * intensity, intensity);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      side={THREE.BackSide}
      transparent
    />
  );
};

export default SunCoronaMaterial;
