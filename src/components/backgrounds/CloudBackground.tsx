'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function CloudParticles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 60;

  useEffect(() => {
    if (!points.current) return;

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      sizes[i] = Math.random() * 80 + 40;
      speeds[i] = Math.random() * 0.3 + 0.1;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
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
    attribute float offset;
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      pos.x += uTime * speed * 0.5;
      pos.x = mod(pos.x + 6.0, 12.0) - 6.0;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vAlpha = 0.35 + sin(uTime * 0.5 + offset) * 0.1;
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
      gl_FragColor = vec4(0.85, 0.95, 1.0, alpha);
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
      />
    </points>
  );
}

function SkyBackground() {
  return (
    <mesh scale={[20, 20, 1]} position={[0, 0, -5]}>
      <planeGeometry />
      <meshBasicMaterial color="#e8f4f8" />
    </mesh>
  );
}

export function CloudBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <SkyBackground />
      <CloudParticles />
    </Canvas>
  );
}
