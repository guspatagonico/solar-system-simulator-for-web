import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  isPaused: boolean;
  timeScale: number;
  visualRadius: number;
}

const SunCoronaMaterial: React.FC<Props> = ({ isPaused, timeScale, visualRadius }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVisualRadius: { value: visualRadius },
  }), [visualRadius]);

  useFrame((state, delta) => {
    if (!isPaused) {
      timeRef.current += delta * timeScale;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  const vertexShader = `
    varying vec3 vViewPos;
    varying vec3 vNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPos = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uVisualRadius;
    varying vec3 vViewPos;
    varying vec3 vNormal;

    #define PI 3.14159265359

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

    // Domain-warped noise for turbulent plasma motion
    float warpedNoise(vec2 p, float t) {
      // First level of warp
      vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t * 0.03),
                    fbm(p + vec2(5.2, 1.3) + t * 0.04));
      // Second level of warp
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.02),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.03));
      return fbm(p + 4.0 * r);
    }

    // High-frequency noise for fine filaments
    float fineNoise(vec2 p) {
      return fbm(p) * 0.5 + fbm(p * 2.0) * 0.25 + fbm(p * 4.0) * 0.125;
    }

    void main() {
      // Screen-space distance from sun center (in units of sun radius)
      float screenDist = length(vViewPos.xy);
      float normalizedDist = screenDist / uVisualRadius;
      float limbDist = normalizedDist - 1.0; // 0 at sun's limb
      float coronaWidth = 0.2;

      // --- Base radial fade ---
      float radialFade = 1.0 - smoothstep(0.0, coronaWidth, limbDist);
      radialFade = pow(radialFade, 1.8);
      radialFade *= smoothstep(0.95, 1.05, normalizedDist);

      // --- Angle ---
      float angle = atan(vViewPos.y, vViewPos.x);
      float t = uTime * 0.008; // SLOW: majestic plasma motion

      // --- PLASMA TURBULENCE: warped noise for sizzling effect ---
      // Coordinates in angle-radial space
      vec2 plasmaCoord = vec2(angle * 8.0, limbDist * 30.0);
      float plasma = warpedNoise(plasmaCoord, t);
      float plasmaDetail = fineNoise(plasmaCoord * 2.0 + vec2(t * 0.5, 0.0));
      float plasmaPattern = plasma * 0.7 + plasmaDetail * 0.3;

      // Plasma is strongest near limb, fades outward
      float plasmaFade = pow(radialFade, 0.5);
      float sizzle = plasmaPattern * plasmaFade * 0.4;

      // --- FILAMENTS: fine radial lines ---
      // Multiple angular frequencies for natural variation
      float filamentBase = 0.0;

      // Low-freq: broad streamer foundations
      for (int i = 0; i < 6; i++) {
        float baseAngle = float(i) * PI * 0.33 + noise(vec2(float(i) * 7.3, 0.0)) * 0.8;
        float spread = 0.15 + noise(vec2(float(i) * 3.1, 1.0)) * 0.1;
        float dist = abs(angle - baseAngle);
        dist = min(dist, PI * 2.0 - dist); // wrap
        filamentBase += exp(-pow(dist / spread, 2.0)) * (0.3 + noise(vec2(float(i) * 2.3, t * 0.5)) * 0.2);
      }

      // High-freq: fine filament texture (the "hair" of the corona)
      float highFreqAngle = angle * 40.0 + warpedNoise(vec2(angle * 5.0, limbDist * 10.0), t) * 2.0;
      float fineFilaments = pow(abs(sin(highFreqAngle)), 8.0);
      fineFilaments *= 0.15 + plasmaPattern * 0.1;

      // Filament radial falloff: long streamers extend further
      float filamentRadial = pow(radialFade, 0.6);
      float filaments = (filamentBase * 0.6 + fineFilaments) * filamentRadial;

      // --- MAJOR STREAMERS: prominent spikes ---
      float majorStreamers = 0.0;
      // Predefined major streamer directions (asymmetric)
      float angles[6];
      angles[0] = 0.3; angles[1] = 1.2; angles[2] = 2.1;
      angles[3] = 3.5; angles[4] = 4.4; angles[5] = 5.5;
      float lengths[6];
      lengths[0] = 1.0; lengths[1] = 0.7; lengths[2] = 0.9;
      lengths[3] = 0.6; lengths[4] = 0.8; lengths[5] = 0.5;

      for (int i = 0; i < 6; i++) {
        float spread = 0.08 + noise(vec2(float(i), t)) * 0.03;
        float dist = abs(angle - angles[i]);
        dist = min(dist, PI * 2.0 - dist);
        float spike = exp(-pow(dist / spread, 2.0));
        // Animate spike length slowly
        float len = lengths[i] * (0.8 + noise(vec2(float(i) * 5.7, t * 0.3)) * 0.4);
        float spikeRadial = 1.0 - smoothstep(0.0, coronaWidth * len * 2.5, limbDist);
        majorStreamers += spike * spikeRadial * 0.8;
      }

      // --- INNER BRIGHT RING ---
      float innerRing = exp(-pow((normalizedDist - 1.0) * 20.0, 2.0));

      // --- Dynamic plasma pulses (very slow) ---
      float pulse1 = sin(t * 0.5 + angle * 2.0) * 0.1;
      float pulse2 = sin(t * 0.3 - angle * 3.0) * 0.08;
      float pulse3 = cos(t * 0.7 + limbDist * 5.0) * 0.05;
      float dynamics = 1.0 + pulse1 + pulse2 + pulse3;

      // --- Combine all layers ---
      float baseGlow = radialFade * 0.35;
      float plasmaLayer = sizzle * 1.5;
      float filamentLayer = filaments * 0.5;
      float streamerLayer = majorStreamers;
      float ringLayer = innerRing * 0.9;

      float intensity = (baseGlow + plasmaLayer + filamentLayer + streamerLayer + ringLayer) * dynamics;
      intensity = clamp(intensity, 0.0, 2.5);

      // --- Colors ---
      vec3 whiteHot = vec3(1.0, 1.0, 0.95);
      vec3 warmYellow = vec3(1.0, 0.88, 0.5);
      vec3 orange = vec3(1.0, 0.55, 0.15);
      vec3 deepOrange = vec3(0.9, 0.3, 0.05);

      // Color by distance from limb
      vec3 color = mix(whiteHot, warmYellow, smoothstep(0.0, 0.05, limbDist));
      color = mix(color, orange, smoothstep(0.05, 0.12, limbDist));
      color = mix(color, deepOrange, smoothstep(0.12, 0.2, limbDist));

      // Hotter plasma in turbulent regions
      color = mix(color, whiteHot, plasmaPattern * 0.2);

      gl_FragColor = vec4(color * intensity, intensity * 0.85);
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
