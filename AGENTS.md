# AGENTS.md - Solar System Simulator

## Project Overview
Interactive 3D solar system simulator built with React 19, Three.js (@react-three/fiber, @react-three/drei), TypeScript, and Tailwind CSS v4. Uses Vite as the build tool.

## Build, Lint & Test Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Start dev server (port 3000, host 0.0.0.0) |
| `pnpm run build` | Production build |
| `pnpm run preview` | Preview production build |
| `pnpm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `pnpm run clean` | Remove `dist/` folder |

**No test framework is configured.** There are no test scripts or testing libraries in the project. Always run `pnpm run lint` after making changes to verify type safety.

## Environment Setup
- Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`
- The app requires Node.js

## Project Structure
```
src/
├── main.tsx           # Entry point, renders <App />
├── App.tsx            # Root component, Canvas setup, state management
├── types.ts           # TypeScript interfaces (CelestialBodyData, SimulationState)
├── constants.ts       # Solar system data and scale factors
├── index.css          # Tailwind import only
└── components/
    ├── CelestialBody.tsx    # Planet/moon rendering with orbits
    ├── Sun.tsx              # Sun with custom shader
    ├── HUD.tsx              # UI overlay (controls, info panels)
    ├── CameraManager.tsx    # Smooth camera transitions
    ├── GasGiantMaterial.tsx # Custom shader for gas giants
    ├── RingMaterial.tsx     # Custom shader for planetary rings
    └── Starfield.tsx        # Background stars
```

## Code Style Guidelines

### Imports
Order: React → external libraries → types → local modules. Use named imports where possible.
```typescript
import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBodyData, SimulationState } from '../types';
import { SOLAR_SYSTEM_DATA } from '../constants';
```

### Components
- Use `React.FC<Props>` with explicit Props interfaces
- Define Props interface directly above the component
- Export as default at bottom of file
- Functional components only, no class components

```typescript
interface Props {
  data: CelestialBodyData;
  state: SimulationState;
  onSelect: (id: string) => void;
}

const MyComponent: React.FC<Props> = ({ data, state, onSelect }) => {
  return <div>...</div>;
};

export default MyComponent;
```

### TypeScript
- Strict mode is **not** enabled in tsconfig
- Use explicit types for state and refs: `useRef<THREE.Mesh>(null)`
- Interfaces for data structures, not type aliases
- Union types for constrained values: `type: 'star' | 'planet' | 'moon'`
- Optional properties with `?:` syntax

### Path Aliases
`@/*` maps to project root. Use relative imports within `src/` for sibling/nested modules.

### Styling
- Tailwind CSS v4 (imported via `@import "tailwindcss"`)
- Utility-first classes directly in JSX
- Inline `style` objects for Three.js-specific styles only
- Dark theme: black backgrounds, white/semi-transparent text

### Three.js / React Three Fiber
- Hooks: `useFrame` for animation loops, `useThree` for scene access
- Refs for Three.js objects: `useRef<THREE.Mesh>(null)`
- Custom shaders as inline template literals with `useMemo`
- Use `THREE.BackSide`, `THREE.DoubleSide` for material rendering
- `useMemo` for expensive computations (textures, geometry, uniforms)

### Naming Conventions
- Components: PascalCase (`CelestialBody`, `GasGiantMaterial`)
- Interfaces: PascalCase (`CelestialBodyData`, `SimulationState`)
- Constants: UPPER_SNAKE_CASE (`SOLAR_SYSTEM_DATA`, `SCALE_FACTORS`)
- Variables/functions: camelCase (`visualRadius`, `handleJumpTo`)
- Refs: descriptive with `Ref` suffix (`meshRef`, `cloudRef`)
- Shader uniforms: `u` prefix (`uTexture`, `uTime`, `uColor`)

### State Management
- React `useState` for component state
- Lift state to common ancestor, pass via props
- Functional state updates: `setState(s => ({ ...s, prop: value }))`
- `useMemo` for derived state

### Error Handling
- No explicit error boundaries configured
- Use optional chaining (`data.atmosphere?.cloudsUrl`)
- Fallback values with `||` or `??` operators
- Guard clauses in `useFrame`: `if (!body) return`

## Key Dependencies
- **react** ^19.0.0 / **react-dom** ^19.0.0
- **@react-three/fiber** ^9.5.0 - React renderer for Three.js
- **@react-three/drei** ^10.7.7 - Useful helpers for R3F
- **three** ^0.183.2 - 3D graphics library
- **tailwindcss** ^4.1.14 - Utility CSS
- **motion** ^12.23.24 - Animations (via `motion/react`)
- **lucide-react** ^0.546.0 - Icon components
- **@google/genai** ^1.29.0 - Gemini AI API

## Common Patterns
- Animation loop: `useFrame((state, delta) => { ... })`
- Texture loading: `useMemo(() => textureLoader.load(url), [url])`
- Conditional rendering: `{condition && <Component />}`
- List rendering: `{data.map(item => <Component key={item.id} />)}`
