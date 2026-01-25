'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function GradientParticles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 50;

  const { positions, sizes, speeds, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const colorPalette = [
      [0.95, 0.88, 0.78],
      [0.92, 0.82, 0.72],
      [0.98, 0.92, 0.85],
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sizes[i] = Math.random() * 30 + 15;
      speeds[i] = Math.random() * 0.3 + 0.1;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    return { positions, sizes, speeds, colors };
  }, []);

  useFrame((state) => {
    if (points.current) {
      const material = points.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    attribute float size;
    attribute float speed;
    attribute vec3 color;
    uniform float uTime;
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      vec3 pos = position;
      pos.y += sin(uTime * speed + position.x) * 0.5;
      pos.x += cos(uTime * speed * 0.7 + position.y) * 0.3;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float pulse = sin(uTime * speed + position.z) * 0.2 + 0.8;
      vAlpha = pulse * 0.25;
      vColor = color;
      gl_PointSize = size * (200.0 / -mvPosition.z) * pulse;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function WarmBackground() {
  return (
    <mesh scale={[20, 20, 1]} position={[0, 0, -5]}>
      <planeGeometry />
      <meshBasicMaterial color="#faf6f0" />
    </mesh>
  );
}

export function GradientBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <WarmBackground />
      <GradientParticles />
    </Canvas>
  );
}
