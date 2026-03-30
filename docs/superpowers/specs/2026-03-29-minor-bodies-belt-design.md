# Minor Bodies & Belt — Design Spec

## Overview

Add minor solar system bodies: 10+ dwarf planets/KBOs, an asteroid belt particle cloud, and comets with shader-based tails. Extend the existing rendering system with new components and add a separate HUD navigation section.

## Scope

- **Dwarf Planets/KBOs**: Pluto, Ceres, Eris, Haumea, Makemake, Sedna, Quaoar, Orcus, Gonggong, Salacia
- **Asteroid Belt**: ~5000 particle cloud between Mars and Jupiter (2.2–3.3 AU)
- **Comets**: Halley, Hale-Bopp, Hyakutake with animated tails

## Types

Extend `CelestialBodyData.type` union in `src/types.ts`:
```
'star' | 'planet' | 'moon' | 'dwarf-planet' | 'asteroid-belt' | 'comet' | 'kbo'
```

Add to `CelestialBodyData`:
```typescript
tailColor?: string; // Comets only — color of the tail
```

## Data

New `MINOR_BODIES_DATA` array in `src/constants.ts`:
- All dwarf planets and KBOs with real orbital data (radius, distance, period, eccentricity)
- One `asteroid-belt` entry (special: `type: 'asteroid-belt'`, no textureUrl, no orbit)
- 3 comets with `tailColor` property

Combined export: `ALL_BODIES = [...SOLAR_SYSTEM_DATA, ...MINOR_BODIES_DATA]`

## File Changes

| File                          | Action                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| `src/types.ts`                | **Modify** — extend type union, add `tailColor`               |
| `src/constants.ts`            | **Modify** — add `MINOR_BODIES_DATA`, `ALL_BODIES` export     |
| `src/components/AsteroidBelt.tsx`   | **New** — particle cloud using `THREE.Points`           |
| `src/components/Comet.tsx`          | **New** — comet with shader tail pointing from Sun      |
| `src/components/MinorBodyRenderer.tsx` | **New** — orchestrator for all minor bodies           |
| `src/App.tsx`                 | **Modify** — render `MinorBodyRenderer`, pass all bodies to HUD |
| `src/components/HUD.tsx`      | **Modify** — add collapsible "Minor Bodies" section           |

## Rendering

### Dwarf Planets / KBOs
- Use existing `CelestialBody` component (spheres with orbit lines)
- Material: `meshPhongMaterial` (same as small planets)
- Show labels and orbits

### Asteroid Belt
- `THREE.Points` with ~5000 particles
- Distribution: Gaussian ring between 2.2–3.3 AU, slight vertical spread
- Small random variation in size/color
- No labels, no click interaction
- Animated subtle rotation

### Comets
- Extend `CelestialBody` for the head (small sphere)
- Additional tail mesh: custom shader
  - Tail direction: vector from Sun to comet, extending away
  - Tail shape: cone/fan geometry with noise-driven flow
  - Animation: flowing noise along tail, wind-like motion
  - Color: `tailColor` from data, with fade to transparent at tip
- Show labels, no orbit line (orbits are very eccentric)

## UI (HUD)

Navigation panel gets a new collapsible section:
- Header: "Minor Bodies" with collapse toggle
- Lists: dwarf planets, KBOs, comets individually
- Asteroid belt excluded from click list
- Clicking navigates camera via existing `onJumpTo` mechanism
- Same styling as planet list items

## Constraints

- No new dependencies needed
- Must respect `isPaused`, `timeScale`, `showOrbits`, `showLabels`
- Follow AGENTS.md conventions
- Performance: asteroid belt must not degrade FPS (Points is lightweight)
- Texture URLs: reuse existing free sources (three.js repo, Wikipedia)

## Acceptance Criteria

- [ ] 10+ dwarf planets/KBOs visible with orbits and labels
- [ ] Asteroid belt renders as a particle cloud between Mars and Jupiter
- [ ] 3 comets visible with animated tails pointing away from Sun
- [ ] Tails animate with flowing noise effect
- [ ] HUD shows separate "Minor Bodies" section
- [ ] All animations respect pause and time scale
- [ ] `pnpm run lint` passes clean
