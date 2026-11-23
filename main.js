const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const form = document.querySelector("#form");
const status = document.querySelector(".form-status");
const bar = document.querySelector(".progress");
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
  }, 2800);

  const counters = [...document.querySelectorAll("[data-count]")];
  const begun = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - begun) / 1100);
    const eased = 1 - Math.pow(1 - t, 3);
    counters.forEach((el) => {
      el.textContent = String(Math.round(eased * Number(el.dataset.count)));
    });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }, { passive: true });
}

const reveals = [...document.querySelectorAll(".reveal")];
if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  reveals.forEach((el) => observer.observe(el));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    form.classList.add("invalid");
    return;
  }
  form.classList.remove("invalid");
  status.hidden = false;
  status.textContent = "Так виглядає підтвердження. Дані нікуди не надіслані: це демонстраційна форма.";
  form.reset();
});
