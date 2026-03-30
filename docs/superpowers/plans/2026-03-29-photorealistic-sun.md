# Photorealistic Animated Sun Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Sun's simple hash-noise shader with a photorealistic hybrid: real NASA SDO texture + procedural granulation, sunspots, faculae, and a dynamic wispy corona.

**Architecture:** Two shader components extracted from Sun.tsx — SunSurfaceMaterial (texture + procedural surface features) and SunCoronaMaterial (animated wispy corona). Sun.tsx orchestrates them, keeping lights and labels.

**Tech Stack:** React 19, Three.js (GLSL shaders), @react-three/fiber

**Note:** This project has no test framework. Verification uses `pnpm run lint` (TypeScript type checking) instead of unit tests.

---

## File Structure

| File                                    | Purpose                                          |
| --------------------------------------- | ------------------------------------------------ |
| `src/components/SunSurfaceMaterial.tsx` | Surface shader: base texture + granulation/sunspots/faculae |
| `src/components/SunCoronaMaterial.tsx`  | Corona shader: Fresnel glow + domain-warped wispy tendrils  |
| `src/components/Sun.tsx`                | Orchestrator: meshes, lighting, labels, animation loop      |

---

### Task 1: Create `SunSurfaceMaterial.tsx`

**Files:**
- Create: `src/components/SunSurfaceMaterial.tsx`

- [ ] **Step 1: Create the surface shader component**

The component follows the `GasGiantMaterial.tsx` pattern: `React.FC<Props>` with a `shaderMaterial` ref, `useMemo` for uniforms, `useFrame` to update `uTime`. The shader receives a texture and produces a photorealistic surface with animated granulation, sunspots, and faculae.

```tsx
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

    // --- Noise functions (same hash/noise/fbm pattern as GasGiantMaterial) ---
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
      // 1. Base texture
      vec3 baseColor = texture2D(uTexture, vUv).rgb;

      // 2. Granulation - animated boiling convection cells
      float granScale = 30.0;
      float granSpeed = 0.3;
      vec2 granUv = vUv * granScale + vec2(uTime * granSpeed * 0.1, uTime * granSpeed * 0.05);
      float gran = fbm(granUv);
      // Bright granules with darker intergranular lanes
      float granIntensity = smoothstep(0.35, 0.65, gran) * 0.35;
      baseColor += vec3(1.0, 0.9, 0.6) * granIntensity;

      // 3. Sunspots - low frequency dark patches
      float spotScale = 4.0;
      float spotNoise = fbm(vUv * spotScale + vec2(uTime * 0.01, 0.0));
      float spotMask = smoothstep(0.55, 0.45, spotNoise);
      // Cooler tint for sunspots
      vec3 spotColor = baseColor * vec3(0.6, 0.4, 0.2);
      baseColor = mix(baseColor, spotColor, spotMask * 0.7);

      // 4. Faculae - bright spots near sunspot edges
      float faculaeNoise = fbm(vUv * 20.0 + vec2(uTime * 0.02, uTime * 0.01));
      float spotEdge = smoothstep(0.5, 0.55, spotNoise) * smoothstep(0.6, 0.55, spotNoise);
      float faculaeMask = faculaeNoise * spotEdge;
      baseColor += vec3(1.0, 0.85, 0.5) * faculaeMask * 0.5;

      // 5. Subtle overall pulsation
      float pulse = sin(uTime * 0.3) * 0.05 + 1.0;
      baseColor *= pulse;

      gl_FragColor = vec4(baseColor, 1.0);
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
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/SunSurfaceMaterial.tsx
git commit -m "feat: add SunSurfaceMaterial shader with granulation, sunspots, and faculae"
```

---

### Task 2: Create `SunCoronaMaterial.tsx`

**Files:**
- Create: `src/components/SunCoronaMaterial.tsx`

- [ ] **Step 1: Create the corona shader component**

The corona uses `AdditiveBlending`, `depthWrite: false`, and `THREE.BackSide` to wrap around the surface mesh. Domain-warped fBm creates wispy tendrils. View-dependent Fresnel brightens the edges.

```tsx
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

    // Domain warping for organic tendrils
    float warpedFbm(vec2 p, float t) {
      vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t * 0.1),
                    fbm(p + vec2(5.2, 1.3) + t * 0.12));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.08),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.1));
      return fbm(p + 4.0 * r);
    }

    void main() {
      // Fresnel: brighter at edges, dim at center (BackSide inverts this)
      float fresnel = 1.0 - dot(vNormal, vViewDir);
      fresnel = pow(fresnel, 2.0);

      // Wispy tendrils via domain-warped noise
      float t = uTime * 0.15;
      float wisps = warpedFbm(vUv * 6.0, t);
      wisps = pow(wisps, 1.5);

      // Second layer of slower wisps
      float wisps2 = warpedFbm(vUv * 4.0 + 10.0, t * 0.7);
      wisps2 = pow(wisps2, 2.0);

      // Combine
      float intensity = fresnel * 0.6 + wisps * 0.3 + wisps2 * 0.15;

      // Color gradient: white-yellow inner to orange-red outer
      vec3 innerColor = vec3(1.0, 0.95, 0.7);
      vec3 outerColor = vec3(1.0, 0.4, 0.1);
      vec3 color = mix(innerColor, outerColor, fresnel);

      // Subtle color variation from wisps
      color += vec3(0.1, 0.05, 0.0) * wisps;

      gl_FragColor = vec4(color * intensity, intensity * 0.8);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
      side={THREE.BackSide}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
};

export default SunCoronaMaterial;
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/SunCoronaMaterial.tsx
git commit -m "feat: add SunCoronaMaterial shader with domain-warped wispy tendrils"
```

---

### Task 3: Refactor `Sun.tsx` to use new shader components

**Files:**
- Modify: `src/components/Sun.tsx`

- [ ] **Step 1: Replace the inline shader with the new components**

The current `Sun.tsx` has an inline `useMemo` shader block (lines 22-58) and a plain `meshBasicMaterial` corona (lines 93-101). Replace both with the new components. Keep the lighting (lines 104-112), label (lines 114-135), and animation loop structure.

```tsx
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SCALE_FACTORS } from '../constants';
import { SimulationState } from '../types';
import SunSurfaceMaterial from './SunSurfaceMaterial';
import SunCoronaMaterial from './SunCoronaMaterial';

interface Props {
  radius: number;
  state: SimulationState;
}

const Sun: React.FC<Props> = ({ radius, state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const visualRadius = radius * SCALE_FACTORS.PLANET_SIZE;
  const timeRef = useRef(0);

  // Load the Sun texture
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texture = useMemo(
    () => textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/9/99/Map_of_the_full_sun.jpg'),
    [textureLoader]
  );

  useFrame((threeState, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }

    const time = timeRef.current;
    if (meshRef.current) {
      const rotationSpeed = (delta * state.timeScale * Math.PI * 2) / (25.4 * SCALE_FACTORS.TIME);
      meshRef.current.rotation.y += rotationSpeed;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002 * state.timeScale;
      glowRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.02);
    }
  });

  return (
    <group>
      {/* Sun Core */}
      <mesh ref={meshRef} renderOrder={-1}>
        <sphereGeometry args={[visualRadius, 64, 64]} />
        <SunSurfaceMaterial texture={texture} />
      </mesh>

      {/* Sun Corona */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[visualRadius * 1.15, 64, 64]} />
        <SunCoronaMaterial />
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

      {/* Floating Label */}
      {state.showLabels && (
        <Html
          position={[0, visualRadius + 5, 0]}
          center
          occlude
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="flex flex-col items-center">
            <div className="px-3 py-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/40 rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <span className="text-xs font-bold text-yellow-100 uppercase tracking-[0.2em]">
                SUN
              </span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-yellow-500/60 to-transparent" />
          </div>
        </Html>
      )}
    </group>
  );
};

export default Sun;
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Sun.tsx
git commit -m "refactor: integrate SunSurfaceMaterial and SunCoronaMaterial into Sun"
```

---

### Task 4: Visual verification and polish

- [ ] **Step 1: Start the dev server and visually inspect**

Run: `pnpm run dev`
Open: `http://localhost:3000`

Check:
- Granulation visible as boiling convection cells on the surface
- Sunspots appear as darker rotating patches
- Bright faculae near sunspot edges
- Corona has animated wispy tendrils with additive blending
- Pause/play respects animation state
- Time scale slider affects animation speed

- [ ] **Step 2: Adjust shader parameters if needed**

Based on visual inspection, tweak noise scales, intensities, or animation speeds in `SunSurfaceMaterial.tsx` and `SunCoronaMaterial.tsx`. Typical adjustments:
- Granulation scale (`granScale`) — increase for larger cells, decrease for finer detail
- Granulation intensity — adjust `0.35` threshold or `0.35` intensity multiplier
- Sunspot frequency — adjust `spotScale` (4.0) or threshold (0.55/0.45)
- Corona tendril speed — adjust `t * 0.15` multiplier

- [ ] **Step 3: Final lint check and commit any adjustments**

Run: `pnpm run lint`
```bash
git add src/components/SunSurfaceMaterial.tsx src/components/SunCoronaMaterial.tsx
git commit -m "tweak: fine-tune sun shader parameters for visual quality"
```
