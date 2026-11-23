import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#view");
const loaderEl = document.querySelector("#loader");
const countEl = document.querySelector("#count");
const nowEl = document.querySelector("#now");
const narrow = window.matchMedia("(max-width: 800px)").matches;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.3 : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x090b0e, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090b0e);
scene.fog = new THREE.Fog(0x090b0e, 8, 18);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;

const camera = new THREE.PerspectiveCamera(narrow ? 42 : 34, 1, 0.1, 40);
const clock = new THREE.Clock();

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xfff8f0, 2.2);
key.position.set(2, 4, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0x9eb4d4, 0.6);
fill.position.set(-4, 2, 3);
scene.add(fill);

const works = [
  { name: "Цех 48", line: "Нічний сервіс", file: "../assets/hero-garage.jpg" },
  { name: "Тиха", line: "Денна зала", file: "../assets/cafe-hero.jpg" },
  { name: "Норд", line: "Дім предметів", file: "../assets/oak-wood.jpg" },
];

const loader = new THREE.TextureLoader();
const boards = [];
const gap = narrow ? 2.15 : 3.35;
const side = new THREE.MeshStandardMaterial({ color: 0x1c2128, metalness: 0.45, roughness: 0.4 });

works.forEach((work, index) => {
  const texture = loader.load(work.file);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const group = new THREE.Group();
  const print = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.7),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72, metalness: 0.02 }),
  );
  print.position.z = 0.045;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.78, 1.78, 0.08), side);
  group.add(slab, print);
  group.position.set((index - 1) * gap, 0.05, index === 1 ? 0.15 : -0.35);
  group.rotation.y = (index - 1) * -0.18;
  scene.add(group);
  boards.push(group);
});

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(12, 48),
  new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.95, metalness: 0.05 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.05;
scene.add(floor);

const pointer = { x: 0, y: 0 };
let progress = 0;
let target = 0;
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth - 0.5;
  pointer.y = event.clientY / window.innerHeight - 0.5;
});
window.addEventListener("wheel", (event) => {
  target = Math.min(1, Math.max(0, target + event.deltaY * 0.0007));
}, { passive: true });
let touchY = 0;
window.addEventListener("touchstart", (event) => {
  touchY = event.touches[0].clientY;
}, { passive: true });
window.addEventListener("touchmove", (event) => {
  const y = event.touches[0].clientY;
  target = Math.min(1, Math.max(0, target + (touchY - y) * 0.0025));
  touchY = y;
}, { passive: true });

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

let shown = 0;
function frame() {
  const time = clock.getElapsedTime();
  progress += (target - progress) * 0.07;
  const focus = Math.min(2, Math.floor(progress * 2.99));
  nowEl.textContent = works[focus].name;
  nowEl.dataset.line = works[focus].line;
  document.body.classList.toggle("is-open", progress > 0.72);

  const intro = reduce ? 1 : Math.min(1, time / 1.6);
  const ease = 1 - (1 - intro) ** 3;
  const lookX = (progress * 2) * gap - gap;
  camera.position.set(
    lookX + pointer.x * 0.45,
    0.15 + pointer.y * -0.25,
    THREE.MathUtils.lerp(6.4, narrow ? 4.4 : 4.8, ease),
  );
  camera.lookAt(lookX, 0.05, 0);

  boards.forEach((board, index) => {
    const active = index === focus ? 1 : 0;
    board.position.z += ((index === 1 ? 0.15 : -0.35) + active * 0.45 - board.position.z) * 0.08;
  });

  renderer.render(scene, camera);
  if (shown < 100) {
    shown = Math.min(100, shown + 6);
    countEl.textContent = String(shown).padStart(3, "0");
    if (shown === 100) loaderEl.classList.add("is-off");
  }
  requestAnimationFrame(frame);
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(frame);
