# Minor Bodies & Belt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add minor solar system bodies (10+ dwarf planets/KBOs, asteroid belt particle cloud, comets with shader tails) with HUD navigation section.

**Architecture:** Extend existing `CelestialBodyData` types, add `MINOR_BODIES_DATA` array, create specialized rendering components (AsteroidBelt, Comet), and integrate via MinorBodyRenderer orchestrator.

**Tech Stack:** React 19, Three.js (@react-three/fiber, @react-three/drei), TypeScript, Tailwind CSS v4

**Note:** No test framework — verification via `pnpm run lint` (TypeScript type checking).

---

## File Structure

| File                                    | Purpose                                          |
| --------------------------------------- | ------------------------------------------------ |
| `src/types.ts`                          | Extend type union, add `tailColor`               |
| `src/constants.ts`                      | Add `MINOR_BODIES_DATA`, `ALL_BODIES` export      |
| `src/components/AsteroidBelt.tsx`       | Particle cloud using THREE.Points                |
| `src/components/Comet.tsx`              | Comet head + shader tail pointing from Sun       |
| `src/components/MinorBodyRenderer.tsx`  | Orchestrates rendering of all minor bodies       |
| `src/App.tsx`                           | Render MinorBodyRenderer, pass all bodies to HUD |
| `src/components/HUD.tsx`                | Add collapsible Minor Bodies section             |

---

### Task 1: Extend types and add minor bodies data

**Files:**
- Modify: `src/types.ts`
- Modify: `src/constants.ts`

- [ ] **Step 1: Extend the type union in `src/types.ts`**

Replace the type line in `CelestialBodyData`:
```typescript
type: 'star' | 'planet' | 'moon' | 'dwarf-planet' | 'asteroid-belt' | 'comet' | 'kbo';
```

Add `tailColor` to the interface (after `specularUrl`):
```typescript
  tailColor?: string; // Comets only — color of the tail
```

- [ ] **Step 2: Add MINOR_BODIES_DATA to `src/constants.ts`**

Add after the existing `SOLAR_SYSTEM_DATA` array:

```typescript
export const MINOR_BODIES_DATA: CelestialBodyData[] = [
  // --- Dwarf Planets & KBOs ---
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf-planet',
    radius: 1188.3,
    distanceFromParent: 5906.4,
    orbitalPeriod: 90560,
    rotationPeriod: -153.3,
    eccentricity: 0.249,
    color: '#C4A882',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Nh-pluto-in-true-color_2x_JPEG-edit-frame.jpg',
    description: 'Pluto is a dwarf planet in the Kuiper belt. It was the first Kuiper belt object to be discovered and is the largest known dwarf planet.',
    moons: [
      {
        id: 'charon',
        name: 'Charon',
        type: 'moon',
        radius: 606,
        distanceFromParent: 19591,
        orbitalPeriod: 6.387,
        rotationPeriod: 153.3,
        color: '#8B8B8B',
        textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Charon_in_Color_%28HQ%29.jpg',
        description: 'Charon is the largest of the five known natural satellites of the Pluto and the largest known trans-Neptunian natural satellite.',
      }
    ]
  },
  {
    id: 'ceres',
    name: 'Ceres',
    type: 'dwarf-planet',
    radius: 473,
    distanceFromParent: 413.7,
    orbitalPeriod: 1682,
    rotationPeriod: 9.074,
    eccentricity: 0.076,
    color: '#8B7D6B',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/PIA20916-Ceres-DwarfPlanet-DawnSpacecraft-20160204.jpg',
    description: 'Ceres is the largest object in the asteroid belt and the only dwarf planet in the inner Solar System.',
  },
  {
    id: 'eris',
    name: 'Eris',
    type: 'dwarf-planet',
    radius: 1163,
    distanceFromParent: 10120,
    orbitalPeriod: 203830,
    rotationPeriod: 25.9,
    eccentricity: 0.436,
    color: '#D4C4B0',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Eris_and_dysnomia2.jpg',
    description: 'Eris is the most massive and second-largest known dwarf planet. It has one known moon, Dysnomia.',
  },
  {
    id: 'haumea',
    name: 'Haumea',
    type: 'dwarf-planet',
    radius: 816,
    distanceFromParent: 6452,
    orbitalPeriod: 103774,
    rotationPeriod: 3.915,
    eccentricity: 0.191,
    color: '#E8E0D0',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/2003EL61_Haumea_Cropped.jpg',
    description: 'Haumea is a dwarf planet beyond Neptune. It has a distinctive elongated shape and rapid rotation.',
    rings: {
      innerRadius: 2287,
      outerRadius: 2322,
      textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring_alpha.png',
    },
  },
  {
    id: 'makemake',
    name: 'Makemake',
    type: 'dwarf-planet',
    radius: 715,
    distanceFromParent: 6850,
    orbitalPeriod: 111845,
    rotationPeriod: 22.8,
    eccentricity: 0.159,
    color: '#D9C8A8',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Makemake_Hubble.jpg',
    description: 'Makemake is a dwarf planet and the second-brightest known object in the Kuiper belt after Pluto.',
  },
  {
    id: 'sedna',
    name: 'Sedna',
    type: 'kbo',
    radius: 497.5,
    distanceFromParent: 76000,
    orbitalPeriod: 4161000,
    rotationPeriod: 10.273,
    eccentricity: 0.855,
    color: '#C44E3A',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Sedna-2003VB12.jpg',
    description: 'Sedna is a large minor planet in the outer reaches of the Solar System. It has one of the longest and most eccentric orbits.',
  },
  {
    id: 'quaoar',
    name: 'Quaoar',
    type: 'kbo',
    radius: 555,
    distanceFromParent: 6520,
    orbitalPeriod: 105560,
    rotationPeriod: 17.678,
    eccentricity: 0.035,
    color: '#A8A8A8',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Quaoar-2002lm60.jpg',
    description: 'Quaoar is a large Kuiper belt object. It has one known moon, Weywot.',
  },
  {
    id: 'orcus',
    name: 'Orcus',
    type: 'kbo',
    radius: 458.5,
    distanceFromParent: 5872,
    orbitalPeriod: 89780,
    rotationPeriod: 13.188,
    eccentricity: 0.227,
    color: '#8B7D6B',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Orcus_art.jpg',
    description: 'Orcus is a large Kuiper belt object sometimes called the anti-Pluto due to its orbital resonance with Pluto.',
  },
  {
    id: 'gonggong',
    name: 'Gonggong',
    type: 'kbo',
    radius: 615,
    distanceFromParent: 10140,
    orbitalPeriod: 231000,
    rotationPeriod: 44.81,
    eccentricity: 0.501,
    color: '#C8B8A8',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Gonggong_and_Xiangliu.jpg',
    description: 'Gonggong is a large scattered disc object with a highly eccentric orbit. It has one known moon, Xiangliu.',
  },
  {
    id: 'salacia',
    name: 'Salacia',
    type: 'kbo',
    radius: 423,
    distanceFromParent: 6340,
    orbitalPeriod: 99200,
    rotationPeriod: 5.5,
    eccentricity: 0.106,
    color: '#8B7D6B',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Salacia_2003SB313.png',
    description: 'Salacia is a large trans-Neptunian object. It has one known moon, Actaea.',
  },
  // --- Comets ---
  {
    id: 'halley',
    name: "Halley's Comet",
    type: 'comet',
    radius: 11,
    distanceFromParent: 2670,
    orbitalPeriod: 27510,
    rotationPeriod: 171.6,
    eccentricity: 0.967,
    color: '#E8E0D0',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Halley%27s_Comet%2C_1910.jpg',
    description: "Halley's Comet is a short-period comet visible from Earth every 75-76 years. It is the only naked-eye comet that can appear twice in a human lifetime.",
    tailColor: '#88CCFF',
  },
  {
    id: 'halebopp',
    name: 'Hale-Bopp',
    type: 'comet',
    radius: 30,
    distanceFromParent: 3500,
    orbitalPeriod: 73120,
    rotationPeriod: 11.74,
    eccentricity: 0.995,
    color: '#F0E8D8',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Comet_Hale-Bopp_1995O1.jpg',
    description: 'Comet Hale-Bopp was one of the most widely observed comets of the 20th century. It had one of the longest tails ever recorded.",
    tailColor: '#AAEEFF',
  },
  {
    id: 'hyakutake',
    name: 'Hyakutake',
    type: 'comet',
    radius: 2,
    distanceFromParent: 2200,
    orbitalPeriod: 34830,
    rotationPeriod: 6.23,
    eccentricity: 0.999,
    color: '#D8D0C8',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Hyakutake-tsukuba.jpg',
    description: 'Comet Hyakutake was a spectacular comet in 1996 that passed very close to Earth, making it one of the closest cometary approaches.',
    tailColor: '#99DDEE',
  },
];

// --- Asteroid Belt ---
export const ASTEROID_BELT: CelestialBodyData = {
  id: 'asteroid-belt',
  name: 'Asteroid Belt',
  type: 'asteroid-belt',
  radius: 0,
  distanceFromParent: 400,
  orbitalPeriod: 0,
  rotationPeriod: 0,
  color: '#8B8070',
  textureUrl: '',
  description: 'The asteroid belt is a torus-shaped region in the Solar System, located roughly between the orbits of Mars and Jupiter.',
};

export const ALL_BODIES: CelestialBodyData[] = [
  ...SOLAR_SYSTEM_DATA,
  ...MINOR_BODIES_DATA,
  ASTEROID_BELT,
];
```

- [ ] **Step 3: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add minor bodies types, dwarf planets, KBOs, comets, and asteroid belt data"
```

---

### Task 2: Create AsteroidBelt component

**Files:**
- Create: `src/components/AsteroidBelt.tsx`

- [ ] **Step 1: Create the asteroid belt particle cloud**

```tsx
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SCALE_FACTORS } from '../constants';
import { SimulationState } from '../types';

interface Props {
  state: SimulationState;
}

const AsteroidBelt: React.FC<Props> = ({ state }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, sizes, colors } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Belt between Mars (227.9M km) and Jupiter (778.6M km)
      // Use power scale for compressed distances (same as CelestialBody)
      const minDist = Math.pow(227.9, 0.6) * 10;
      const maxDist = Math.pow(778.6, 0.6) * 10;

      // Gaussian-ish distribution (more asteroids in middle of belt)
      const t = Math.random();
      const distFactor = minDist + (maxDist - minDist) * (0.3 + t * 0.4 + (Math.random() - 0.5) * 0.3);
      const angle = Math.random() * Math.PI * 2;

      // Slight eccentricity and vertical spread
      const eccentricity = 0.05 + Math.random() * 0.15;
      const semiMajor = distFactor;
      const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);

      const x = semiMajor * Math.cos(angle) - semiMajor * eccentricity * Math.random();
      const z = semiMinor * Math.sin(angle);
      const y = (Math.random() - 0.5) * 2; // Vertical spread

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Varying sizes
      sizes[i] = 0.3 + Math.random() * 0.7;

      // Varying colors (gray to brownish)
      const brightness = 0.4 + Math.random() * 0.4;
      const warmth = Math.random() * 0.1;
      colors[i * 3] = brightness + warmth;     // R
      colors[i * 3 + 1] = brightness * 0.9;    // G
      colors[i * 3 + 2] = brightness * 0.75;   // B
    }

    return { positions, sizes, colors };
  }, []);

  useFrame((state, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * state.timeScale * 0.00001;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, sizes, colors]);

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
```

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/AsteroidBelt.tsx
git commit -m "feat: add AsteroidBelt component with 5000 particle cloud"
```

---

### Task 3: Create Comet component

**Files:**
- Create: `src/components/Comet.tsx`

- [ ] **Step 1: Create the comet with shader tail**

```tsx
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { CelestialBodyData, SimulationState } from '../types';
import { SCALE_FACTORS } from '../constants';

interface Props {
  data: CelestialBodyData;
  state: SimulationState;
  onSelect: (id: string) => void;
}

const Comet: React.FC<Props> = ({ data, state, onSelect }) => {
  const headRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Orbital parameters (same as CelestialBody)
  const baseRadius = Math.max(data.radius * SCALE_FACTORS.PLANET_SIZE, 0.3);
  const visualRadius = baseRadius * Math.min(state.visualEnhancement, 3);
  const a = Math.pow(data.distanceFromParent, 0.6) * 10 * SCALE_FACTORS.DISTANCE;
  const e = data.eccentricity || 0;
  const b = a * Math.sqrt(1 - e * e);
  const focusOffset = a * e;

  // Texture
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texture = useMemo(() => {
    if (data.textureUrl) return textureLoader.load(data.textureUrl);
    return null;
  }, [data.textureUrl, textureLoader]);

  // Tail shader
  const tailUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(data.tailColor || '#88CCFF') },
  }), [data.tailColor]);

  const tailVertexShader = `
    varying vec2 vUv;
    varying float vDist;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDist = length(mvPosition.xy);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const tailFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

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
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // vUv.x is along the tail (0=head, 1=tip), vUv.y is across
      float tailLength = vUv.x;

      // Fade from head to tip
      float fade = 1.0 - smoothstep(0.0, 1.0, tailLength);
      fade = pow(fade, 0.8);

      // Fan out at the tip
      float spread = 1.0 + tailLength * 2.0;
      float distFromCenter = abs(vUv.y - 0.5) * 2.0 * spread;
      float fan = 1.0 - smoothstep(0.0, 1.0, distFromCenter);

      // Flowing noise for organic tail motion
      float flow = fbm(vec2(tailLength * 5.0 - uTime * 0.3, vUv.y * 8.0 + uTime * 0.1));
      float detail = noise(vec2(tailLength * 15.0 - uTime * 0.5, vUv.y * 20.0));

      float intensity = fade * fan * (0.7 + flow * 0.3 + detail * 0.1);

      // Color: brighter near head, dimmer at tip
      vec3 headColor = uColor * 1.3;
      vec3 tipColor = uColor * 0.4;
      vec3 color = mix(headColor, tipColor, tailLength);

      gl_FragColor = vec4(color, intensity * 0.7);
    }
  `;

  // Animation
  useFrame((threeState, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }

    const time = timeRef.current;

    if (data.orbitalPeriod > 0 && groupRef.current) {
      const angle = (time / (data.orbitalPeriod * SCALE_FACTORS.TIME)) * Math.PI * 2;
      const x = a * Math.cos(angle) - focusOffset;
      const z = b * Math.sin(angle);
      groupRef.current.position.set(x, 0, z);
    }

    if (headRef.current && data.rotationPeriod !== 0) {
      const rotationSpeed = (delta * state.timeScale * Math.PI * 2) / ((data.rotationPeriod / 24) * SCALE_FACTORS.TIME);
      headRef.current.rotation.y += rotationSpeed;
    }

    // Update tail time uniform
    if (tailRef.current) {
      (tailRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }
  });

  // Orbit points
  const orbitPoints = useMemo(() => {
    if (data.orbitalPeriod <= 0) return [];
    const points = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      const x = a * Math.cos(angle) - focusOffset;
      const z = b * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
  }, [a, b, focusOffset, data.orbitalPeriod]);

  return (
    <group name={`${data.id}_container`}>
      {/* Orbit Path */}
      {state.showOrbits && data.orbitalPeriod > 0 && (
        <Line
          points={orbitPoints}
          color={data.tailColor || '#88CCFF'}
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      )}

      {/* Comet head + tail */}
      <group ref={groupRef} name={data.id}>
        {/* Head */}
        <mesh
          ref={headRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(data.id);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <sphereGeometry args={[visualRadius, 16, 16]} />
          <meshPhongMaterial
            map={texture}
            color={data.color}
            emissive={data.color}
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Tail */}
        <mesh ref={tailRef} position={[-visualRadius * 2, 0, 0]}>
          <planeGeometry args={[visualRadius * 20, visualRadius * 4, 64, 1]} />
          <shaderMaterial
            uniforms={tailUniforms}
            vertexShader={tailVertexShader}
            fragmentShader={tailFragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Label */}
        {state.showLabels && (
          <Html
            position={[0, visualRadius + 3, 0]}
            center
            occlude
            zIndexRange={[10, 0]}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-blue-400/30 rounded-full whitespace-nowrap">
                <span className="text-[10px] font-mono text-blue-300/90 uppercase tracking-wider">
                  {data.name}
                </span>
              </div>
              <div className="w-px h-2 bg-gradient-to-b from-blue-400/40 to-transparent" />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

export default Comet;
```

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Comet.tsx
git commit -m "feat: add Comet component with shader tail pointing from Sun"
```

---

### Task 4: Create MinorBodyRenderer orchestrator

**Files:**
- Create: `src/components/MinorBodyRenderer.tsx`

- [ ] **Step 1: Create the orchestrator component**

```tsx
import React from 'react';
import { MINOR_BODIES_DATA, ASTEROID_BELT } from '../constants';
import { SimulationState } from '../types';
import CelestialBody from './CelestialBody';
import AsteroidBelt from './AsteroidBelt';
import Comet from './Comet';

interface Props {
  state: SimulationState;
  onSelect: (id: string) => void;
}

const MinorBodyRenderer: React.FC<Props> = ({ state, onSelect }) => {
  return (
    <group>
      {/* Asteroid Belt */}
      <AsteroidBelt state={state} />

      {/* Individual minor bodies */}
      {MINOR_BODIES_DATA.map((body) => {
        if (body.type === 'comet') {
          return (
            <Comet
              key={body.id}
              data={body}
              state={state}
              onSelect={onSelect}
            />
          );
        }

        // Dwarf planets and KBOs use the existing CelestialBody component
        return (
          <CelestialBody
            key={body.id}
            data={body}
            state={state}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
};

export default MinorBodyRenderer;
```

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/MinorBodyRenderer.tsx
git commit -m "feat: add MinorBodyRenderer orchestrator for all minor bodies"
```

---

### Task 5: Update App.tsx to render minor bodies

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update imports and body lookup**

Replace the import section:
```typescript
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState, CelestialBodyData } from './types';
import { SOLAR_SYSTEM_DATA, ALL_BODIES, SCALE_FACTORS } from './constants';
import CelestialBody from './components/CelestialBody';
import Sun from './components/Sun';
import HUD from './components/HUD';
import Starfield from './components/Starfield';
import CameraManager from './components/CameraManager';
import MinorBodyRenderer from './components/MinorBodyRenderer';
```

Replace the `focusedBody` lookup:
```typescript
  const focusedBody = useMemo(() => 
    ALL_BODIES.find(b => b.id === state.focusedBodyId) || null
  , [state.focusedBodyId]);
```

- [ ] **Step 2: Add MinorBodyRenderer to the Canvas**

After the existing `{SOLAR_SYSTEM_DATA.map(...)}` group, add:
```tsx
        <MinorBodyRenderer state={state} onSelect={handleJumpTo} />
```

So the render section becomes:
```tsx
        <group>
          {SOLAR_SYSTEM_DATA.map((body) => {
            if (body.type === 'star') {
              return (
                <group key={body.id} name={body.id}>
                  <Sun radius={body.radius} state={state} />
                </group>
              );
            }
            return (
              <CelestialBody
                key={body.id}
                data={body}
                state={state}
                onSelect={handleJumpTo}
              />
            );
          })}
        </group>

        <MinorBodyRenderer state={state} onSelect={handleJumpTo} />
```

Also update the HUD prop to pass `ALL_BODIES`:
```tsx
      <HUD 
        state={state} 
        setState={setState} 
        focusedBody={focusedBody} 
        onJumpTo={handleJumpTo} 
      />
```

The HUD needs `allBodies` prop too — we'll add that in Task 6.

- [ ] **Step 3: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate MinorBodyRenderer into App and update focusedBody lookup"
```

---

### Task 6: Update HUD with minor bodies section

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: Add import for MINOR_BODIES_DATA**

Add to existing imports:
```typescript
import { SOLAR_SYSTEM_DATA, MINOR_BODIES_DATA } from '../constants';
```

- [ ] **Step 2: Add minor bodies section to the navigation panel**

After the planet list (`{SOLAR_SYSTEM_DATA.map(planet => ...)`), before the closing `</div>` of the nav panel, add:

```tsx
                <div className="border-t border-white/10 mt-3 pt-3">
                  <h4 className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2 px-2">Minor Bodies</h4>
                  {MINOR_BODIES_DATA.filter(b => b.type !== 'asteroid-belt').map(body => (
                    <button
                      key={body.id}
                      onClick={() => onJumpTo(body.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                        state.focusedBodyId === body.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: body.color }} />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{body.name}</span>
                          <span className="text-[8px] font-mono text-white/30 uppercase">{body.type}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
```

- [ ] **Step 3: Run lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat: add Minor Bodies navigation section to HUD panel"
```

---

### Task 7: Visual verification and polish

- [ ] **Step 1: Start dev server and inspect**

Run: `pnpm run dev`
Open: `http://localhost:3000`

Check:
- Dwarf planets visible with orbit lines and labels
- Comets visible with animated tails
- Asteroid belt particle cloud visible between Mars and Jupiter
- HUD navigation shows Minor Bodies section
- Clicking minor bodies navigates camera
- Pause/time scale controls work on all bodies

- [ ] **Step 2: Final lint check**

Run: `pnpm run lint`
Expected: PASS
