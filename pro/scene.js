import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.querySelector("#view");
const loader = document.querySelector("#loader");
const countEl = document.querySelector("#count");
const narrow = window.matchMedia("(max-width: 800px)").matches;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.setClearColor(0x0c1014, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1014);
scene.fog = new THREE.FogExp2(0x0c1014, narrow ? 0.07 : 0.05);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
const clock = new THREE.Clock();

scene.add(new THREE.AmbientLight(0xb7c6d8, 0.35));
const key = new THREE.DirectionalLight(0xfff6ec, 2.6);
key.position.set(5, 7, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0x7eb0ff, 1.8);
rim.position.set(-6, 3, -4);
scene.add(rim);

function ribbonGeometry(curve, segments, width, thick) {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [];
  const indices = [];
  let side = new THREE.Vector3().crossVectors(frames.tangents[0], new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-6) side.crossVectors(frames.tangents[0], new THREE.Vector3(1, 0, 0));
  side.normalize();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = frames.tangents[i];
    side.addScaledVector(tangent, -side.dot(tangent)).normalize();
    side.applyAxisAngle(tangent, 0.01);
    const face = new THREE.Vector3().crossVectors(tangent, side).normalize();
    const half = width * (0.82 + Math.sin(t * Math.PI) * 0.18);
    [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([along, across]) => {
      positions.push(
        point.x + side.x * half * along + face.x * thick * across,
        point.y + side.y * half * along + face.y * thick * across,
        point.z + side.z * half * along + face.z * thick * across,
      );
    });
    if (i === segments) continue;
    const a = i * 4;
    const b = a + 4;
    for (let edge = 0; edge < 4; edge += 1) {
      const n = (edge + 1) % 4;
      indices.push(a + edge, b + edge, a + n, b + edge, b + n, a + n);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const arc = [];
for (let i = 0; i <= 14; i += 1) {
  const angle = -0.55 + (i / 14) * Math.PI * 1.65;
  arc.push(new THREE.Vector3(
    Math.cos(angle) * 1.65,
    1.45 + Math.sin(angle) * 1.2,
    Math.sin(angle * 1.35) * 0.48,
  ));
}
const path = new THREE.CatmullRomCurve3(arc, false, "catmullrom", 0.2);

const metal = new THREE.MeshPhysicalMaterial({
  color: 0xd5dbe3,
  metalness: 1,
  roughness: 0.18,
  clearcoat: 0.65,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1.15,
});
const band = new THREE.Mesh(ribbonGeometry(path, narrow ? 90 : 160, 0.42, 0.055), metal);
scene.add(band);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(18, 72),
  new THREE.MeshStandardMaterial({ color: 0x12161c, metalness: 0.08, roughness: 0.92 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.06, 0.3, 0.94));
composer.addPass(new OutputPass());

const pointer = { x: 0, y: 0 };
let progress = 0;
let target = 0;
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth - 0.5;
  pointer.y = event.clientY / window.innerHeight - 0.5;
});
window.addEventListener("wheel", (event) => {
  target = Math.min(1, Math.max(0, target + event.deltaY * 0.0009));
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
  document.body.classList.toggle("is-open", progress > 0.4);

  const intro = reduce ? 1 : Math.min(1, time / 2.2);
  const ease = 1 - (1 - intro) ** 3;
  const radius = THREE.MathUtils.lerp(9.5, 6.1, ease);
  const orbit = (reduce ? 0.4 : time * 0.12) + pointer.x * 1.1;
  camera.position.set(
    Math.sin(orbit) * radius,
    1.55 + pointer.y * -0.45 + (1 - ease) * 1.2,
    Math.cos(orbit) * radius,
  );
  camera.lookAt(0, 1.45, 0);
  band.rotation.y = progress * 0.35;

  composer.render();
  if (shown < 100) {
    shown = Math.min(100, shown + 5);
    countEl.textContent = String(shown).padStart(3, "0");
    if (shown === 100) loader.classList.add("is-off");
  }
  requestAnimationFrame(frame);
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(frame);
