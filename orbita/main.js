const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const form = document.querySelector("#form");
const status = document.querySelector(".form-status");
const bar = document.querySelector(".progress");
const dome = document.querySelector("#dome");
const seatLabel = document.querySelector("#seat-label");
const seatField = document.querySelector("#seat-field");
const reel = document.querySelector("#reel");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const taken = new Set([2, 5, 8, 14, 19, 27, 33, 36, 44, 51, 58, 61]);

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

const field = document.querySelector(".stars");
for (let i = 0; i < 90; i += 1) {
  const star = document.createElement("i");
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  const size = Math.random() > 0.85 ? 3 : 2;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.animationDelay = `${Math.random() * 4}s`;
  field.appendChild(star);
}

const firstShow = {
  lito: ["Місяць зблизька", "Кратери, яких із двору не видно."],
  zyma: ["Полярне сяйво", "Зелена завіса на всю ширину купола."],
  more: ["Ніч над морем", "Горизонт нижче, зірок більше."],
};
const firstCard = document.querySelector("#first-show");

document.querySelectorAll(".sky-switch button").forEach((button) => {
  button.addEventListener("click", () => {
    document.body.dataset.sky = button.dataset.sky;
    document.querySelectorAll(".sky-switch button").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    const [title, line] = firstShow[button.dataset.sky];
    firstCard.querySelector("h3").textContent = title;
    firstCard.querySelector("span").textContent = line;
  });
});

for (let index = 0; index < 64; index += 1) {
  const button = document.createElement("button");
  const row = Math.floor(index / 8) + 1;
  const place = (index % 8) + 1;
  const name = `Ряд ${row}, місце ${place}`;
  button.type = "button";
  button.className = "seat";
  button.setAttribute("aria-label", name);
  if (taken.has(index)) {
    button.disabled = true;
    button.setAttribute("aria-label", `${name}, зайняте`);
  } else {
    button.addEventListener("click", () => {
      dome.querySelectorAll(".seat.is-on").forEach((seat) => seat.classList.remove("is-on"));
      button.classList.add("is-on");
      seatLabel.textContent = name;
      seatField.value = name;
    });
  }
  dome.appendChild(button);
}

document.querySelectorAll("[data-reel]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = reel.querySelector("article");
    const step = card.getBoundingClientRect().width + 14;
    reel.scrollBy({ left: step * Number(button.dataset.reel), behavior: reduce ? "auto" : "smooth" });
  });
});

window.addEventListener("scroll", () => {
  document.querySelector(".top").classList.toggle("is-on", scrollY > 24);
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
  status.textContent = `Заявка на ${seatField.value.toLowerCase()} лишається на екрані. Дані нікуди не надіслані.`;
});
