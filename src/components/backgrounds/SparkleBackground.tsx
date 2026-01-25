'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function Sparkles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 200;

  useEffect(() => {
    if (!points.current) return;

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      sizes[i] = Math.random() * 4 + 1;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    points.current.geometry = geometry;
  }, []);

  useFrame((state) => {
    if (points.current) {
      const material = points.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    attribute float size;
    attribute float phase;
    uniform float uTime;
    varying float vAlpha;
    varying float vPhase;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // Complex sparkle pattern - multiple sine waves
      float sparkle1 = sin(uTime * 3.0 + phase) * 0.5 + 0.5;
      float sparkle2 = sin(uTime * 5.0 + phase * 2.0) * 0.5 + 0.5;
      float sparkle = sparkle1 * sparkle2;

      vAlpha = sparkle * 0.7 + 0.2;
      vPhase = phase;

      gl_PointSize = size * (200.0 / -mvPosition.z) * (sparkle * 0.5 + 0.5);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    varying float vPhase;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;

      // Simple soft circle
      float core = smoothstep(0.5, 0.0, dist);

      // Golden warm color
      vec3 color = mix(
        vec3(1.0, 0.85, 0.6),
        vec3(1.0, 0.95, 0.8),
        vPhase / 6.28
      );

      float alpha = core * vAlpha * 0.6;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  return (
    <points ref={points}>
      <bufferGeometry />
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
      <meshBasicMaterial color="#fdf8f3" />
    </mesh>
  );
}

export function SparkleBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <WarmBackground />
      <Sparkles />
    </Canvas>
  );
}
