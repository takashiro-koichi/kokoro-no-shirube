'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function GeometricPattern() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef({
    uTime: { value: 0 },
  });

  useFrame((state) => {
    uniformsRef.current.uTime.value = state.clock.elapsedTime * 0.3;
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;

    // Hexagon distance function
    float hexDist(vec2 p) {
      p = abs(p);
      return max(p.x * 0.866025 + p.y * 0.5, p.y);
    }

    vec4 hexCoords(vec2 uv) {
      vec2 r = vec2(1.0, 1.732);
      vec2 h = r * 0.5;
      vec2 a = mod(uv, r) - h;
      vec2 b = mod(uv - h, r) - h;
      vec2 gv = length(a) < length(b) ? a : b;
      float x = atan(gv.x, gv.y);
      float y = 0.5 - hexDist(gv);
      vec2 id = uv - gv;
      return vec4(x, y, id.x, id.y);
    }

    void main() {
      vec2 uv = vUv * 12.0;
      uv.y += uTime * 0.5;

      vec4 hex = hexCoords(uv);

      // Animate based on position and time
      float wave = sin(hex.z * 0.5 + hex.w * 0.5 + uTime) * 0.5 + 0.5;

      // Edge glow
      float edge = smoothstep(0.0, 0.1, hex.y) * smoothstep(0.15, 0.05, hex.y);
      edge *= wave * 0.4 + 0.1;

      // Background color
      vec3 bgColor = vec3(0.98, 0.96, 0.93);
      vec3 lineColor = vec3(0.85, 0.78, 0.68);

      vec3 color = mix(bgColor, lineColor, edge);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return (
    <mesh ref={mesh} scale={[10, 10, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
      />
    </mesh>
  );
}

export function TimelineBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 1] }}>
      <GeometricPattern />
    </Canvas>
  );
}
