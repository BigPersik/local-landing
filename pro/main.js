const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const canvas = document.querySelector("#field");
const ctx = canvas.getContext("2d");
const clock = document.querySelector("#clock");
const coord = document.querySelector("#coord");
const swap = document.querySelector("#swap");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const words = ["справи", "заявки", "візиту"];
const pointer = { x: -9999, y: -9999 };
let dots = [];
let width = 0;
let height = 0;
let word = 0;

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

function paintClock() {
  clock.textContent = new Date().toLocaleTimeString("uk-UA", { hour12: false });
}
paintClock();
window.setInterval(paintClock, 1000);

if (!reduce) {
  window.setInterval(() => {
    word = (word + 1) % words.length;
    swap.querySelector("span").textContent = words[word];
  }, 2400);
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  coord.textContent = `X ${Math.round(event.clientX)} · Y ${Math.round(event.clientY)}`;
});

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = Math.min(120, Math.round((width * height) / 16000));
  dots = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
  }));
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  dots.forEach((dot) => {
    const dx = pointer.x - dot.x;
    const dy = pointer.y - dot.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 180) {
      dot.vx += dx / dist * 0.04;
      dot.vy += dy / dist * 0.04;
    }
    dot.vx *= 0.99;
    dot.vy *= 0.99;
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < 0 || dot.x > width) dot.vx *= -1;
    if (dot.y < 0 || dot.y > height) dot.vy *= -1;
  });
  for (let i = 0; i < dots.length; i += 1) {
    for (let j = i + 1; j < dots.length; j += 1) {
      const a = dots[i];
      const b = dots[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 130) continue;
      ctx.strokeStyle = `rgba(92, 225, 255, ${(1 - dist / 130) * 0.28})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(236, 234, 228, 0.9)";
  dots.forEach((dot) => {
    ctx.fillRect(dot.x, dot.y, 1.6, 1.6);
  });
  if (!reduce) requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener("resize", resize);

document.querySelectorAll(".shot").forEach((card) => {
  const photo = card.querySelector("img");
  card.addEventListener("pointermove", (event) => {
    if (reduce) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    photo.style.transform = `scale(1.08) translate(${x * -12}px, ${y * -12}px)`;
  });
  card.addEventListener("pointerleave", () => {
    photo.style.transform = "";
  });
});

const blocks = document.querySelectorAll(".sheet, .close");
blocks.forEach((block) => block.classList.add("reveal"));
if (reduce || !("IntersectionObserver" in window)) {
  blocks.forEach((block) => block.classList.add("in"));
} else {
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  }, { threshold: 0.18 });
  blocks.forEach((block) => watch.observe(block));
}
