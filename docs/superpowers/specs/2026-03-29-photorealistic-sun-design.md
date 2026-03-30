# Photorealistic Animated Sun — Design Spec

## Overview

Replace the Sun's simple hash-noise shader with a photorealistic hybrid approach: real NASA SDO texture as base + procedural GLSL layers for granulation, sunspots, faculae, and a dynamic wispy corona.

## Approach

Approach 1: Surface shader + separate corona shader. Two meshes, two shader components.

## Surface Shader (`SunSurfaceMaterial.tsx`)

**Vertex shader:** Passes `vUv`, `vNormal`, `vWorldPosition` to fragment.

**Fragment shader layers:**
1. **Base texture** — Sample existing NASA SDO texture from `constants.ts` `textureUrl`
2. **Granulation** — 5-octave fBm noise, animated by `uTime`. Bright granules with darker intergranular lanes. ~0.3 intensity additive
3. **Sunspots** — Low-frequency noise thresholded to 2-3 dark patches. Cooler orange tint. Rotate with mesh
4. **Faculae** — High-frequency bright spots near sunspot edges

**Uniforms:** `uTexture`, `uTime`, `uColor`

**Animation:** `uTime` drives granulation boiling and sunspot drift. External `mesh.rotation.y` for rotation.

## Corona Shader (`SunCoronaMaterial.tsx`)

**Fragment shader:**
1. **Fresnel edge glow** — Brighter at sphere edges, dim at center
2. **Wispy tendrils** — Double domain-warped fBm noise, animated by `uTime`. Organic plasma flow
3. **Color gradient** — White-yellow inner → orange-red outer edge

**Properties:** `AdditiveBlending`, `depthWrite: false`, `THREE.BackSide`

**Animation:** `uTime` drives tendril flow. Subtle breathing scale oscillation on outer mesh.

## File Changes

| File                                  | Action                                             |
| ------------------------------------- | -------------------------------------------------- |
| `src/components/SunSurfaceMaterial.tsx` | **New** — surface shader component                 |
| `src/components/SunCoronaMaterial.tsx`  | **New** — corona shader component                  |
| `src/components/Sun.tsx`                | **Modify** — replace inline shader with new components |

No changes to `constants.ts`, `types.ts`, `App.tsx`, or other files.

## Constraints

- Balanced performance: ~5 noise octaves, 2 meshes
- Must respect `isPaused` and `timeScale` from `SimulationState`
- Texture URL already in constants — no new assets needed
- Follow existing code conventions (named imports, `React.FC<Props>`, default export)

## Acceptance Criteria

- [ ] Sun shows visible granulation (boiling convection cells)
- [ ] Sunspots appear as dark rotating patches
- [ ] Bright faculae visible near sunspot regions
- [ ] Corona has animated wispy tendrils with additive blending
- [ ] All animations respect pause state and time scale
- [ ] `pnpm run lint` passes clean
