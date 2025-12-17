import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SessionState } from '../types';

// --- SHADERS ---

const GLITCH_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLITCH_FRAGMENT = `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = vUv;
    
    // Glitch Displacement
    float wave = sin(uv.y * 10.0 + uTime * 20.0) * 0.02 * uIntensity;
    float noiseVal = random(vec2(uTime, uv.y));
    
    if (noiseVal < 0.2 * uIntensity) {
        uv.x += wave * 5.0;
    }
    
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    
    // Chromatic Aberration
    float r = 0.01 * uIntensity;
    float g = 0.005 * uIntensity;
    
    // Simple grid pattern background
    float grid = step(0.98, fract(uv.x * 20.0)) + step(0.98, fract(uv.y * 20.0));
    vec3 baseColor = vec3(grid * 0.1);

    if (uIntensity > 0.0) {
         // Red/Blue shift
        baseColor.r += step(0.5, random(vec2(uv.y, uTime))) * uIntensity; 
        baseColor.g *= 1.0 - uIntensity;
        baseColor.b *= 1.0 - uIntensity;
    }

    gl_FragColor = vec4(baseColor, 1.0);
}
`;

const AURA_FRAGMENT = `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    
    // Pulsing gold ring
    float pulse = sin(uTime * 3.0) * 0.1 + 0.5;
    float ring = smoothstep(0.4, 0.38, dist) - smoothstep(0.3, 0.28, dist);
    
    vec3 gold = vec3(1.0, 0.84, 0.0);
    vec3 color = gold * ring * pulse * uIntensity;
    
    // Ambient particles (simulated via noise)
    float particle = step(0.98, fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453));
    color += gold * particle * uIntensity;

    gl_FragColor = vec4(color, 1.0); // Additive blending handled by Threejs props if needed
}
`;

// --- COMPONENTS ---

interface EnvironmentProps {
  state: SessionState;
}

const BackgroundPlane: React.FC<{ state: SessionState }> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((stateContext) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = stateContext.clock.elapsedTime;
      
      // Lerp intensity based on state
      const targetIntensity = state === SessionState.REINFORCING_NEG ? 1.0 : 0.0;
      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIntensity.value,
        targetIntensity,
        0.1
      );
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0 }
  }), []);

  return (
    <mesh ref={meshRef} scale={[20, 12, 1]} position={[0, 0, -5]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={GLITCH_VERTEX}
        fragmentShader={GLITCH_FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const PositiveParticles: React.FC<{ active: boolean }> = ({ active }) => {
    const count = 100;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 5,
                speed: Math.random() * 0.05 + 0.02
            })
        }
        return temp;
    }, []);

    useFrame(() => {
        if (!meshRef.current || !active) return;
        
        particles.forEach((p, i) => {
            p.y += p.speed;
            if(p.y > 5) p.y = -5;
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.x += 0.01;
            dummy.rotation.z += 0.01;
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={2} toneMapped={false} />
        </instancedMesh>
    );
};


export const Visuals: React.FC<EnvironmentProps> = ({ state }) => {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <BackgroundPlane state={state} />
        <PositiveParticles active={state === SessionState.REINFORCING_POS} />
      </Canvas>
    </div>
  );
};