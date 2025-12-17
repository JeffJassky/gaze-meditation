<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineProps } from 'vue';
import * as THREE from 'three';
import { SessionState } from '../types';

interface VisualsProps {
  state: SessionState;
}

const props = defineProps<VisualsProps>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Three.js variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let backgroundMesh: THREE.Mesh;
let backgroundMaterial: THREE.ShaderMaterial;
let instancedParticlesMesh: THREE.InstancedMesh;
const dummy = new THREE.Object3D(); // For instanced mesh updates
const clock = new THREE.Clock();

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
    
    // Chromatic Aberration
    // float r = 0.01 * uIntensity;
    // float g = 0.005 * uIntensity;
    
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

const particlesData = Array.from({ length: 100 }).map(() => ({
  x: (Math.random() - 0.5) * 10,
  y: (Math.random() - 0.5) * 10,
  z: (Math.random() - 0.5) * 5,
  speed: Math.random() * 0.05 + 0.02
}));

const initThree = () => {
  if (!canvasRef.value) return;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true // Allow transparent background
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0); // Transparent background


  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Point Light
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Background Plane
  const planeGeometry = new THREE.PlaneGeometry(20, 12, 1); // Scaled for viewport
  backgroundMaterial = new THREE.ShaderMaterial({
    vertexShader: GLITCH_VERTEX,
    fragmentShader: GLITCH_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 }
    }
  });
  backgroundMesh = new THREE.Mesh(planeGeometry, backgroundMaterial);
  backgroundMesh.position.set(0, 0, -5);
  scene.add(backgroundMesh);

  // Instanced Particles for REINFORCING_POS
  const particleGeometry = new THREE.DodecahedronGeometry(0.2, 0);
  const particleMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFA500,
    emissiveIntensity: 2,
    toneMapped: false
  });
  instancedParticlesMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, particlesData.length);
  scene.add(instancedParticlesMesh);

  // Initial particle positions
  particlesData.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.updateMatrix();
    instancedParticlesMesh.setMatrixAt(i, dummy.matrix);
  });
  instancedParticlesMesh.instanceMatrix.needsUpdate = true;

  animate();
};

let animationFrameId: number;

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update Background Shader Uniforms
  if (backgroundMaterial) {
    backgroundMaterial.uniforms.uTime.value = elapsedTime;
    const targetIntensity = props.state === SessionState.REINFORCING_NEG ? 1.0 : 0.0;
    backgroundMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      backgroundMaterial.uniforms.uIntensity.value,
      targetIntensity,
      0.1
    );
  }

  // Update Particles for REINFORCING_POS
  if (props.state === SessionState.REINFORCING_POS) {
    instancedParticlesMesh.visible = true;
    particlesData.forEach((p, i) => {
      p.y += p.speed;
      if (p.y > 5) p.y = -5; // Reset particle position when it goes off screen

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.x += 0.01;
      dummy.rotation.z += 0.01;
      dummy.updateMatrix();
      instancedParticlesMesh.setMatrixAt(i, dummy.matrix);
    });
    instancedParticlesMesh.instanceMatrix.needsUpdate = true;
  } else {
    instancedParticlesMesh.visible = false;
  }

  renderer.render(scene, camera);
};

const onResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

onMounted(() => {
  initThree();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
  }
});

watch(() => props.state, (newState) => {
  // Any specific state change reactions can go here if needed,
  // though the animation loop already handles intensity lerping.
});
</script>

<template>
  <div class="absolute inset-0 -z-10">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>

<style scoped>
/* No specific scoped styles needed as Three.js handles rendering,
   and the container is styled with Tailwind */
</style>
