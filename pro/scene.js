import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.querySelector("#view");
const loader = document.querySelector("#loader");
const count = document.querySelector("#count");
const narrow = window.matchMedia("(max-width: 800px)").matches;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !narrow,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.setClearColor(0xd5dde3, 1);
renderer.shadowMap.enabled = !narrow;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xd5dde3, narrow ? 0.028 : 0.022);
scene.background = new THREE.Color(0xd5dde3);

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
const clock = new THREE.Clock();

const hemi = new THREE.HemisphereLight(0xe7eef3, 0x5c676e, 0.72);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6ee, 1.35);
sun.position.set(10, 11, 4);
sun.castShadow = !narrow;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 36;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
sun.shadow.bias = -0.0004;
scene.add(sun);

const core = new THREE.PointLight(0xf4fbff, 8, 6.5, 2);
core.position.set(0, 1.2, 0);
scene.add(core);

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise2(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function ridge(x, z) {
  return (
    Math.sin(x * 0.16) * Math.cos(z * 0.13) * 1.7 +
    Math.sin(x * 0.05 + 1.4) * Math.sin(z * 0.055) * 2.5 +
    Math.cos(x * 0.23 - z * 0.18) * 0.62 +
    (noise2(x * 0.55, z * 0.55) - 0.5) * 1.15 +
    (noise2(x * 1.6, z * 1.6) - 0.5) * 0.28
  );
}

function smooth(edge0, edge1, value) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const groundGeo = new THREE.PlaneGeometry(140, 140, narrow ? 90 : 200, narrow ? 90 : 200);
groundGeo.rotateX(-Math.PI / 2);
const positions = groundGeo.attributes.position;
const colors = new Float32Array(positions.count * 3);
const tint = new THREE.Color();
for (let i = 0; i < positions.count; i += 1) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  const distance = Math.hypot(x, z);
  const mask = smooth(8, 16, distance);
  let y = ridge(x, z) * mask * 0.85;
  y += smooth(18, 40, distance) * (5.4 + Math.sin(Math.atan2(z, x) * 3.5) * 2.8);
  positions.setY(i, y);
  const high = smooth(-0.2, 3.2, y);
  const grit = noise2(x * 1.4, z * 1.4);
  tint.set("#66717a").lerp(new THREE.Color("#e4eaee"), high);
  tint.offsetHSL(0, 0, (grit - 0.5) * 0.12);
  colors[i * 3] = tint.r;
  colors[i * 3 + 1] = tint.g;
  colors[i * 3 + 2] = tint.b;
}
groundGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(
  groundGeo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }),
);
ground.receiveShadow = true;
scene.add(ground);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(70, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: "varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: "varying vec3 vWorld; void main(){ float h = normalize(vWorld).y; vec3 c = mix(vec3(0.72,0.77,0.80), vec3(0.90,0.93,0.95), smoothstep(-0.05,0.35,h)); gl_FragColor = vec4(c,1.0); }",
  }),
);
scene.add(sky);

const stone = [0xa7b1b8, 0x7c878f, 0xc5ced4, 0x8e989f].map((color) => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.78,
  metalness: 0.04,
}));
const blockGeo = new RoundedBoxGeometry(0.98, 0.46, 0.68, 2, 0.03);
const blocks = [];

for (let layer = 0; layer < 6; layer += 1) {
  const count = 18 - Math.floor(layer * 0.4);
  const radius = 2.05 - layer * 0.05;
  const gap = 0.34 + layer * 0.05;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const facing = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(facing) < gap) continue;
    if (layer > 4 && Math.random() > 0.55) continue;
    const material = stone[i % stone.length].clone();
    material.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
    const mesh = new THREE.Mesh(blockGeo, material);
    mesh.castShadow = !narrow;
    mesh.receiveShadow = true;
    const loose = layer === 5;
    mesh.userData.base = new THREE.Vector3(
      Math.sin(angle) * radius,
      0.24 + layer * 0.46 + (loose ? 0.12 + Math.random() * 0.16 : (Math.random() - 0.5) * 0.03),
      Math.cos(angle) * radius,
    );
    mesh.position.copy(mesh.userData.base);
    mesh.rotation.y = angle + (loose ? (Math.random() - 0.5) * 0.4 : 0);
    if (loose) mesh.rotation.z = (Math.random() - 0.5) * 0.25;
    scene.add(mesh);
    blocks.push(mesh);
  }
}

const glowBoard = document.createElement("canvas");
glowBoard.width = 128;
glowBoard.height = 256;
const glowCtx = glowBoard.getContext("2d");
const glowPaint = glowCtx.createRadialGradient(64, 140, 8, 64, 130, 120);
glowPaint.addColorStop(0, "rgba(255,255,255,1)");
glowPaint.addColorStop(0.45, "rgba(232,244,255,0.7)");
glowPaint.addColorStop(1, "rgba(255,255,255,0)");
glowCtx.fillStyle = glowPaint;
glowCtx.fillRect(0, 0, 128, 256);
const glowMap = new THREE.CanvasTexture(glowBoard);
const glow = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 3.2),
  new THREE.MeshBasicMaterial({ map: glowMap, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
);
glow.position.set(0, 1.2, -0.2);
scene.add(glow);

const dustCount = narrow ? 80 : 180;
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i += 1) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 24;
  dustPositions[i * 3 + 1] = Math.random() * 6;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.65, depthWrite: false }),
);
scene.add(dust);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.55, 0.93);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const mouse = { x: 0, y: 0 };
let progress = 0;
let target = 0;
window.addEventListener("pointermove", (event) => {
  mouse.x = event.clientX / window.innerWidth - 0.5;
  mouse.y = event.clientY / window.innerHeight - 0.5;
});
window.addEventListener("wheel", (event) => {
  target = Math.min(1, Math.max(0, target + event.deltaY * 0.0008));
}, { passive: true });
let touchY = 0;
window.addEventListener("touchstart", (event) => {
  touchY = event.touches[0].clientY;
}, { passive: true });
window.addEventListener("touchmove", (event) => {
  const y = event.touches[0].clientY;
  target = Math.min(1, Math.max(0, target + (touchY - y) * 0.003));
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
  progress += (target - progress) * 0.06;
  document.body.classList.toggle("is-open", progress > 0.42);

  const radius = 11.5 - progress * 2.2;
  const angle = 0.18 + mouse.x * 0.85 + (reduce ? 0 : time * 0.04);
  camera.position.set(
    Math.sin(angle) * radius,
    1.85 + mouse.y * -0.35,
    Math.cos(angle) * radius,
  );
  camera.lookAt(0, 1.25, 0);

  if (!reduce) {
    blocks.forEach((block, index) => {
      const push = 1 + progress * 0.22;
      block.position.x = block.userData.base.x * push;
      block.position.z = block.userData.base.z * push;
      block.position.y = block.userData.base.y + Math.sin(time * 0.7 + index) * 0.012;
    });
    const dustPos = dust.geometry.attributes.position;
    for (let i = 0; i < dustCount; i += 1) {
      let y = dustPos.getY(i) - 0.004;
      if (y < 0) y = 6;
      dustPos.setY(i, y);
    }
    dustPos.needsUpdate = true;
    glow.scale.y = 1 + Math.sin(time * 1.4) * 0.03;
  }

  composer.render();
  if (shown < 100) {
    shown = Math.min(100, shown + 5);
    count.textContent = String(shown).padStart(3, "0");
    if (shown === 100) loader.classList.add("is-off");
  }
  requestAnimationFrame(frame);
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(frame);
