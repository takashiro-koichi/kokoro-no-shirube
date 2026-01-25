'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function SubtleParticles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 30;

  const { positions, sizes, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      sizes[i] = Math.random() * 15 + 8;
      speeds[i] = Math.random() * 0.2 + 0.05;
    }

    return { positions, sizes, speeds };
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
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      pos.y += sin(uTime * speed + position.x) * 0.2;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float pulse = sin(uTime * speed * 0.5 + position.z) * 0.15 + 0.85;
      vAlpha = pulse * 0.12;
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
      gl_FragColor = vec4(0.9, 0.85, 0.78, alpha);
    }
  `;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
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

function NeutralBackground() {
  return (
    <mesh scale={[20, 20, 1]} position={[0, 0, -5]}>
      <planeGeometry />
      <meshBasicMaterial color="#f8f5f0" />
    </mesh>
  );
}

export function SimpleGradientBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <NeutralBackground />
      <SubtleParticles />
    </Canvas>
  );
}
