'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

// 星のシェーダー
const STAR_VERTEX_SHADER = `
  attribute float size;
  attribute float twinkleOffset;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(uTime * 0.8 + twinkleOffset) * 0.5 + 0.5;
    vAlpha = twinkle * 0.7 + 0.3;
    gl_PointSize = size * (250.0 / -mvPosition.z) * (twinkle * 0.5 + 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  varying float vAlpha;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    // 淡い黄色〜白の星
    gl_FragColor = vec4(1.0, 0.98, 0.9, alpha);
  }
`;

// 流れ星のシェーダー
const SHOOTING_STAR_VERTEX_SHADER = `
  attribute float progress;
  uniform float uTime;
  varying float vProgress;
  varying float vAlpha;

  void main() {
    vProgress = progress;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vAlpha = 1.0 - progress;
    gl_PointSize = (1.0 - progress) * 4.0 * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SHOOTING_STAR_FRAGMENT_SHADER = `
  varying float vProgress;
  varying float vAlpha;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * 0.8;
    gl_FragColor = vec4(1.0, 0.95, 0.8, alpha);
  }
`;

function Stars() {
  const points = useRef<THREE.Points>(null);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  const count = 250;

  const { positions, sizes, twinkleOffsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleOffsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      sizes[i] = Math.random() * 2.5 + 0.8;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, twinkleOffsets };
  }, []);

  useFrame((state) => {
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
        <bufferAttribute attach="attributes-twinkleOffset" args={[twinkleOffsets, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={STAR_VERTEX_SHADER}
        fragmentShader={STAR_FRAGMENT_SHADER}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null);
  const shootingStarsRef = useRef<{ points: THREE.Points; startTime: number; startPos: THREE.Vector3; velocity: THREE.Vector3 }[]>([]);
  const lastSpawnRef = useRef(0);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 新しい流れ星を生成（平均5秒に1回）
    if (time - lastSpawnRef.current > 3 + Math.random() * 4) {
      lastSpawnRef.current = time;

      const trailLength = 20;
      const positions = new Float32Array(trailLength * 3);
      const progress = new Float32Array(trailLength);

      // 開始位置（画面上部右側から）
      const startX = (Math.random() - 0.3) * 8;
      const startY = 3 + Math.random() * 2;
      const startZ = (Math.random() - 0.5) * 3;

      for (let i = 0; i < trailLength; i++) {
        positions[i * 3] = startX;
        positions[i * 3 + 1] = startY;
        positions[i * 3 + 2] = startZ;
        progress[i] = i / trailLength;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));

      const material = new THREE.ShaderMaterial({
        vertexShader: SHOOTING_STAR_VERTEX_SHADER,
        fragmentShader: SHOOTING_STAR_FRAGMENT_SHADER,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      groupRef.current?.add(points);

      shootingStarsRef.current.push({
        points,
        startTime: time,
        startPos: new THREE.Vector3(startX, startY, startZ),
        velocity: new THREE.Vector3(-0.8 - Math.random() * 0.4, -0.6 - Math.random() * 0.3, 0),
      });
    }

    // 流れ星を更新
    shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
      const elapsed = time - star.startTime;
      const duration = 1.5;

      if (elapsed > duration) {
        groupRef.current?.remove(star.points);
        star.points.geometry.dispose();
        (star.points.material as THREE.Material).dispose();
        return false;
      }

      const positions = star.points.geometry.attributes.position.array as Float32Array;
      const trailLength = positions.length / 3;

      for (let i = 0; i < trailLength; i++) {
        const t = elapsed - i * 0.02;
        if (t > 0) {
          positions[i * 3] = star.startPos.x + star.velocity.x * t;
          positions[i * 3 + 1] = star.startPos.y + star.velocity.y * t;
          positions[i * 3 + 2] = star.startPos.z + star.velocity.z * t;
        }
      }

      star.points.geometry.attributes.position.needsUpdate = true;
      return true;
    });
  });

  return <group ref={groupRef} />;
}

function DreamySkyBackground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#0d1b2a') },
    uColor2: { value: new THREE.Color('#1b263b') },
    uColor3: { value: new THREE.Color('#2d1b4e') },
  });

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec2 vUv;

    void main() {
      // ゆっくり変化するグラデーション
      float t = sin(uTime * 0.1) * 0.5 + 0.5;
      vec3 color1 = mix(uColor1, uColor2, t);
      vec3 color2 = mix(uColor2, uColor3, t);

      // 上から下へのグラデーション
      float gradient = vUv.y;
      vec3 finalColor = mix(color1, color2, gradient);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} scale={[25, 25, 1]} position={[0, 0, -8]}>
      <planeGeometry />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
      />
    </mesh>
  );
}

export function DreamBackground() {
  const [isVisible, setIsVisible] = useState(true);

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
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5] }}
        frameloop={isVisible ? 'always' : 'never'}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <DreamySkyBackground />
        <Stars />
        <ShootingStars />
      </Canvas>
    </div>
  );
}
