const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const form = document.querySelector("#form");
const status = document.querySelector(".form-status");
const bar = document.querySelector(".progress");
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

function cycle(nodes, every) {
  if (reduce || nodes.length < 2) return;
  let cursor = Math.max(0, nodes.findIndex((node) => node.classList.contains("is-on")));
  setInterval(() => {
    if (nodes.some((node) => node.matches(":hover"))) return;
    cursor = (cursor + 1) % nodes.length;
    nodes.forEach((node, index) => node.classList.toggle("is-on", index === cursor));
  }, every);
}

cycle([...document.querySelectorAll(".card-swap > p")], 2600);
cycle([...document.querySelectorAll(".hours li")], 3200);
cycle([...document.querySelectorAll("#drinks li")], 1800);

const counters = [...document.querySelectorAll("[data-count]")];
if (!reduce && counters.length) {
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

window.addEventListener("scroll", () => {
  document.querySelector(".top").classList.toggle("is-on", scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
}, { passive: true });

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
