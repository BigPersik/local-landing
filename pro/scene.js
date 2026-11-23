import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.querySelector("#view");
const loader = document.querySelector("#loader");
const count = document.querySelector("#count");
const narrow = window.matchMedia("(max-width: 800px)").matches;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const noiseGlsl = `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.2;
    a *= 0.5;
  }
  return v;
}
`;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.setClearColor(0x9aabb8, 1);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 140);
const clock = new THREE.Clock();
const fogColor = new THREE.Color("#7f909c");
const sun = new THREE.Vector3(0.45, 0.62, 0.28).normalize();

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(90, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uSun: { value: sun } },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vDir = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 horizon = vec3(0.58, 0.68, 0.74);
        vec3 zenith = vec3(0.015, 0.02, 0.045);
        vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.72, h));
        float moon = pow(clamp(dot(dir, uSun), 0.0, 1.0), 28.0);
        col += vec3(0.85, 0.9, 1.0) * moon;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }),
);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160, narrow ? 90 : 200, narrow ? 90 : 200),
  new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: {
      uSun: { value: sun },
      uFog: { value: fogColor },
      uDensity: { value: narrow ? 0.02 : 0.016 },
    },
    vertexShader: `
      ${noiseGlsl}
      varying vec3 vWorld;
      void main() {
        vec3 p = position;
        float d = length(p.xy);
        float near = smoothstep(8.0, 18.0, d);
        float far = smoothstep(20.0, 48.0, d);
        p.z += (fbm(p.xy * 0.07) - 0.2) * 1.6 * near;
        p.z += (fbm(p.xy * 0.22) - 0.5) * 0.22 * near;
        p.z += fbm(p.xy * 0.03 + 5.0) * 8.0 * far;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      ${noiseGlsl}
      varying vec3 vWorld;
      uniform vec3 uSun;
      uniform vec3 uFog;
      uniform float uDensity;
      void main() {
        vec3 geo = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        float e = 0.18;
        float h = fbm(vWorld.xz * 1.8);
        float hx = fbm((vWorld.xz + vec2(e, 0.0)) * 1.8);
        float hz = fbm((vWorld.xz + vec2(0.0, e)) * 1.8);
        vec3 micro = normalize(vec3(h - hx, e * 0.45, h - hz));
        vec3 n = normalize(geo + micro * 0.12);
        float light = clamp(dot(n, uSun) * 0.85 + 0.15, 0.0, 1.0);
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float spec = pow(clamp(dot(reflect(-uSun, n), viewDir), 0.0, 1.0), 50.0);
        vec3 snow = mix(vec3(0.08, 0.11, 0.15), vec3(0.42, 0.50, 0.58), light);
        snow += spec * 0.08;
        float slope = smoothstep(0.82, 0.45, geo.y);
        snow = mix(snow, vec3(0.42, 0.50, 0.58), slope * 0.65);
        float dist = distance(cameraPosition, vWorld);
        float fog = 1.0 - exp(-dist * uDensity);
        gl_FragColor = vec4(mix(snow, uFog, fog), 1.0);
      }
    `,
  }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const blockMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd7e4ee,
  roughness: 0.08,
  metalness: 0,
  transmission: 0.92,
  thickness: 0.85,
  ior: 1.4,
  attenuationColor: new THREE.Color("#8fb4d4"),
  attenuationDistance: 0.7,
  transparent: true,
});
const heart = new THREE.PointLight(0xd6ecff, 18, 7, 2);
heart.position.set(0, 1.2, 0.2);
scene.add(heart);

const blockGeo = new RoundedBoxGeometry(0.86, 0.4, 0.56, 3, 0.035);
const monument = new THREE.Group();
const blocks = [];

for (let layer = 0; layer < 9; layer += 1) {
  const lift = layer / 8;
  const radius = Math.cos(lift * 1.2) * 2.35;
  if (radius < 0.45) continue;
  const y = 0.22 + Math.sin(lift * 1.2) * 2.15;
  const countOnRing = Math.max(8, Math.round(radius * 9));
  const gap = 0.28 + (1.0 - lift) * 0.38;
  for (let i = 0; i < countOnRing; i += 1) {
    const angle = (i / countOnRing) * Math.PI * 2;
    const facing = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(facing) < gap) continue;
    if (lift > 0.72 && Math.random() > 0.62) continue;
    const mesh = new THREE.Mesh(blockGeo, blockMaterial);
    const loose = lift > 0.82 && Math.random() > 0.45;
    mesh.position.set(
      Math.sin(angle) * (radius + (loose ? 0.18 : 0)),
      y + (loose ? 0.16 : (Math.random() - 0.5) * 0.02),
      Math.cos(angle) * (radius + (loose ? 0.12 : 0)),
    );
    mesh.lookAt(0, y, 0);
    mesh.rotateY(Math.PI / 2);
    if (loose) mesh.rotation.z += (Math.random() - 0.5) * 0.35;
    mesh.userData.base = mesh.position.clone();
    monument.add(mesh);
    blocks.push(mesh);
  }
}
scene.add(monument);

const flakeCanvas = document.createElement("canvas");
flakeCanvas.width = 32;
flakeCanvas.height = 32;
const flakeCtx = flakeCanvas.getContext("2d");
const flakePaint = flakeCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
flakePaint.addColorStop(0, "rgba(255,255,255,0.9)");
flakePaint.addColorStop(1, "rgba(255,255,255,0)");
flakeCtx.fillStyle = flakePaint;
flakeCtx.fillRect(0, 0, 32, 32);
const flakes = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(flakeCanvas),
    color: 0xffffff,
    size: narrow ? 0.06 : 0.045,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  }),
);
const flakeCount = narrow ? 120 : 320;
const flakePos = new Float32Array(flakeCount * 3);
for (let i = 0; i < flakeCount; i += 1) {
  flakePos[i * 3] = (Math.random() - 0.5) * 28;
  flakePos[i * 3 + 1] = Math.random() * 8;
  flakePos[i * 3 + 2] = (Math.random() - 0.5) * 28;
}
flakes.geometry.setAttribute("position", new THREE.BufferAttribute(flakePos, 3));
scene.add(flakes);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.4, 0.96));
composer.addPass(new OutputPass());

const pointer = { x: 0, y: 0 };
let progress = 0;
let target = 0;
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth - 0.5;
  pointer.y = event.clientY / window.innerHeight - 0.5;
});
window.addEventListener("wheel", (event) => {
  target = Math.min(1, Math.max(0, target + event.deltaY * 0.00085));
}, { passive: true });
let touchY = 0;
window.addEventListener("touchstart", (event) => {
  touchY = event.touches[0].clientY;
}, { passive: true });
window.addEventListener("touchmove", (event) => {
  const y = event.touches[0].clientY;
  target = Math.min(1, Math.max(0, target + (touchY - y) * 0.0032));
  touchY = y;
}, { passive: true });

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
}

let shown = 0;
function frame() {
  const time = clock.getElapsedTime();
  progress += (target - progress) * 0.055;
  document.body.classList.toggle("is-open", progress > 0.38);
  const intro = reduce ? 1 : Math.min(1, time / 2.6);
  const ease = 1 - (1 - intro) ** 3;
  const radius = (16.0 - ease * 7.4) - progress * 0.4;
  const orbit = pointer.x * 0.9 + (reduce ? 0.2 : time * 0.045);
  camera.position.set(
    Math.sin(orbit) * radius,
    (3.6 - ease * 1.5) + pointer.y * -0.3,
    Math.cos(orbit) * radius,
  );
  camera.lookAt(0, 1.25, 0);

  if (!reduce) {
    blocks.forEach((block) => {
      const push = 1 + progress * 0.04;
      block.position.x = block.userData.base.x * push;
      block.position.z = block.userData.base.z * push;
    });
    const positions = flakes.geometry.attributes.position;
    for (let i = 0; i < flakeCount; i += 1) {
      let y = positions.getY(i) - 0.006;
      if (y < 0) y = 8;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  }

  composer.render();
  if (shown < 100) {
    shown = Math.min(100, shown + 4);
    count.textContent = String(shown).padStart(3, "0");
    if (shown === 100) loader.classList.add("is-off");
  }
  requestAnimationFrame(frame);
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(frame);
