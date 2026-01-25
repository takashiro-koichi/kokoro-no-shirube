'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function GradientMesh() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#fef9f3') },
    uColor2: { value: new THREE.Color('#e8e4f0') },
    uColor3: { value: new THREE.Color('#f0e8ef') },
  });

  useFrame((state) => {
    uniformsRef.current.uTime.value = state.clock.elapsedTime * 0.1;
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
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec2 vUv;

    void main() {
      float t = sin(uTime) * 0.5 + 0.5;
      vec3 color = mix(
        mix(uColor1, uColor2, vUv.y + sin(uTime * 0.5) * 0.1),
        uColor3,
        sin(vUv.x * 3.14159 + uTime) * 0.2 + 0.3
      );
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

export function GradientBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 1] }}>
      <GradientMesh />
    </Canvas>
  );
}
