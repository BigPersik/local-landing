const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const form = document.querySelector("#form");
const status = document.querySelector(".form-status");
const bar = document.querySelector(".progress");
const glow = document.querySelector(".glow");
const ghost = document.querySelector(".ghost");
const services = [...document.querySelectorAll(".svc")];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function show(index) {
  services.forEach((item, i) => item.classList.toggle("is-on", i === index));
}

services.forEach((item, index) => {
  item.addEventListener("mouseenter", () => show(index));
  item.addEventListener("focus", () => show(index));
  item.addEventListener("click", () => show(index));
});

if (!reduce) {
  let cursor = 0;
  setInterval(() => {
    if (services.some((item) => item.matches(":hover"))) return;
    cursor = (cursor + 1) % services.length;
    show(cursor);
  }, 2600);

  const counters = [...document.querySelectorAll("[data-count]")];
  const paint = (el, value) => { el.textContent = String(Math.round(value)); };
  const startCount = () => {
    const begun = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - begun) / 1100);
      const eased = 1 - Math.pow(1 - t, 3);
      counters.forEach((el) => paint(el, eased * Number(el.dataset.count)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  startCount();

  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }, { passive: true });

  window.addEventListener("pointermove", (event) => {
    glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    const x = (event.clientX / innerWidth - 0.5) * 24;
    const y = (event.clientY / innerHeight - 0.5) * 16;
    ghost.style.transform = `translate(${x}px, ${y}px)`;
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    form.classList.add("invalid");
    return;
  }
  form.classList.remove("invalid");
  status.hidden = false;
  status.classList.add("stamped");
  status.textContent = "Так виглядає підтвердження. Дані нікуди не надіслані: це демонстраційна форма.";
  form.reset();
});
