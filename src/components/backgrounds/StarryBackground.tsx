'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

// シェーダーをメモ化
const VERTEX_SHADER = `
  attribute float size;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(uTime * 1.5 + position.x * 8.0) * 0.5 + 0.5;
    vAlpha = twinkle * 0.6 + 0.4;
    gl_PointSize = size * (300.0 / -mvPosition.z) * vAlpha;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying float vAlpha;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(1.0, 0.95, 0.85, alpha);
  }
`;

function Stars() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const frameCount = useRef(0);
  // パーティクル数を300に削減（500→300）
  const count = 300;

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, sizes };
  }, []);

  // フレームスキップで30fps相当に（2フレームに1回更新）
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
      </bufferGeometry>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function NightSkyBackground() {
  return (
    <mesh scale={[20, 20, 1]} position={[0, 0, -5]}>
      <planeGeometry />
      <meshBasicMaterial color="#1a1412" />
    </mesh>
  );
}

export function StarryBackground() {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3] }}
        frameloop={isVisible ? 'always' : 'never'}
        dpr={[1, 1.5]} // 高DPIディスプレイでの負荷軽減
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <NightSkyBackground />
        <Stars />
      </Canvas>
    </div>
  );
}
