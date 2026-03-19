import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';

const Starfield: React.FC = () => {
  return (
    <Stars
      radius={100000}
      depth={50000}
      count={20000}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
};

export default Starfield;
