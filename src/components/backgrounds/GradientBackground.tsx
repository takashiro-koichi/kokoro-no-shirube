'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

// シェーダーをメモ化
const VERTEX_SHADER = `
  attribute float size;
  attribute float speed;
  attribute vec3 color;
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * speed + position.x) * 0.4;
    pos.x += cos(uTime * speed * 0.6 + position.y) * 0.25;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float pulse = sin(uTime * speed + position.z) * 0.15 + 0.85;
    vAlpha = pulse * 0.2;
    vColor = color;
    gl_PointSize = size * (200.0 / -mvPosition.z) * pulse;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function GradientParticles() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const frameCount = useRef(0);
  // パーティクル数を30に削減（50→30）
  const count = 30;

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
      speeds[i] = Math.random() * 0.25 + 0.08;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    return { positions, sizes, speeds, colors };
  }, []);

  // フレームスキップで30fps相当に
  useFrame((state) => {
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return;

    if (points.current) {
      const material = points.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
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
  const [isVisible, setIsVisible] = useState(true);

  // 可視性検出（タブ非表示時にアニメーション停止）
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      frameloop={isVisible ? 'always' : 'never'}
      dpr={[1, 1.5]} // 高DPIディスプレイでの負荷軽減
      gl={{ antialias: false, powerPreference: 'low-power' }}
    >
      <WarmBackground />
      <GradientParticles />
    </Canvas>
  );
}
