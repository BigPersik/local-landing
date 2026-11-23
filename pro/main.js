const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const shots = document.querySelectorAll(".frame img");
const note = document.querySelector("#frame-note");
const captions = ["Цех 48 · зразок", "Тиха · зразок"];
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

if (!reduce && shots.length === 2) {
  let index = 0;
  window.setInterval(() => {
    index = index === 0 ? 1 : 0;
    shots.forEach((shot, shotIndex) => shot.classList.toggle("is-on", shotIndex === index));
    note.textContent = captions[index];
  }, 6500);
}
