const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const intro = document.querySelector(".intro");
const photo = document.querySelector(".hero-photo");
const photoImg = photo.querySelector("img");
const copy = document.querySelector(".intro-copy");
const railWrap = document.querySelector(".rail-wrap");
const rail = document.querySelector("#rail");
const scenes = document.querySelectorAll(".scene");
const bar = document.querySelector("#progress");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = window.matchMedia("(max-width: 860px)");

menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.textContent = open ? "Закрити" : "Меню";
});

nav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  menu.textContent = "Меню";
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function update() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
  if (reduce || narrow.matches) return;

  const introDistance = intro.offsetHeight - window.innerHeight;
  const introProgress = clamp(window.scrollY / introDistance, 0, 1);
  const edge = (1 - introProgress) * 12;
  const left = (1 - introProgress) * 46;
  photo.style.clipPath = `inset(${edge}% ${(1 - introProgress) * 6}% ${edge}% ${left}%)`;
  photoImg.style.transform = `scale(${1.12 - introProgress * 0.12})`;
  copy.style.opacity = String(1 - clamp((introProgress - 0.42) / 0.4, 0, 1));
  copy.style.transform = `translateY(${introProgress * -48}px)`;

  const railStart = railWrap.offsetTop;
  const railDistance = railWrap.offsetHeight - window.innerHeight;
  const railProgress = clamp((window.scrollY - railStart) / railDistance, 0, 1);
  const travel = Math.max(0, rail.scrollWidth - window.innerWidth);
  rail.style.transform = `translate3d(${-railProgress * travel}px, 0, 0)`;

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const local = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
    scene.querySelector("img").style.transform = `translateY(${(local - 0.5) * 40}px)`;
  });
}

let ticking = false;
function requestTick() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    ticking = false;
    update();
  });
}

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick);
narrow.addEventListener("change", () => {
  photo.style.clipPath = "";
  photoImg.style.transform = "";
  copy.style.opacity = "";
  copy.style.transform = "";
  rail.style.transform = "";
  update();
});
update();
