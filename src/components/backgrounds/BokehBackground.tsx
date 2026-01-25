'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function BokehParticles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 100;

  useEffect(() => {
    if (!points.current) return;

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sizes[i] = Math.random() * 8 + 3;
      speeds[i] = Math.random() * 0.5 + 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
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
    attribute float speed;
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      pos.y += sin(uTime * speed + position.x) * 0.3;
      pos.x += cos(uTime * speed * 0.5 + position.y) * 0.2;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float pulse = sin(uTime * speed * 2.0) * 0.3 + 0.7;
      vAlpha = pulse * 0.35;
      gl_PointSize = size * (200.0 / -mvPosition.z) * pulse;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
      gl_FragColor = vec4(0.9, 0.8, 0.65, alpha);
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
      <meshBasicMaterial color="#faf6f0" />
    </mesh>
  );
}

export function BokehBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <WarmBackground />
      <BokehParticles />
    </Canvas>
  );
}
