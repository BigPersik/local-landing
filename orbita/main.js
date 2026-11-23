const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const form = document.querySelector("#form");
const status = document.querySelector(".form-status");
const bar = document.querySelector(".progress");
const dome = document.querySelector("#dome");
const seatLabel = document.querySelector("#seat-label");
const seatField = document.querySelector("#seat-field");
const reel = document.querySelector("#reel");
const canvas = document.querySelector("#planet");
const caption = document.querySelector("#orb-caption");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rows = [5, 6, 7, 8, 9, 9, 10, 10];
const taken = new Set(["1-3", "2-1", "2-6", "3-4", "4-2", "4-7", "5-5", "6-1", "6-8", "7-4", "7-9", "8-3", "8-6", "8-10"]);

const skies = {
  lito: {
    lit: "#fff6e4",
    mid: "#f0a15a",
    deep: "#7a3d86",
    shade: "#160e1c",
    ring: [255, 214, 170],
    glow: "rgba(255, 170, 80, 0.45)",
    caption: "Сатурн · літнє небо",
  },
  zyma: {
    lit: "#f7fbff",
    mid: "#8ec0ea",
    deep: "#2c568f",
    shade: "#10182c",
    ring: [198, 224, 255],
    glow: "rgba(140, 196, 255, 0.42)",
    caption: "Сатурн · зимове небо",
  },
  more: {
    lit: "#f3fffb",
    mid: "#3ecbb8",
    deep: "#146078",
    shade: "#071820",
    ring: [176, 244, 230],
    glow: "rgba(62, 224, 195, 0.4)",
    caption: "Сатурн · ніч над морем",
  },
};

const firstShow = {
  lito: ["Місяць зблизька", "Кратери, яких із двору не видно."],
  zyma: ["Полярне сяйво", "Зелена завіса на всю ширину купола."],
  more: ["Ніч над морем", "Горизонт нижче, зірок більше."],
};

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
for (let i = 0; i < 120; i += 1) {
  const star = document.createElement("i");
  const hot = Math.random() > 0.9;
  const size = hot ? 3 : Math.random() > 0.8 ? 2 : 1;
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.animationDelay = `${Math.random() * 4}s`;
  if (hot) star.style.background = "#ffe1b0";
  field.appendChild(star);
}

function ringStyle(color, alpha) {
  const [r, g, b] = color;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function strokeRing(ctx, rx, ry, width, color) {
  const gradient = ctx.createLinearGradient(-rx, 0, rx, 0);
  gradient.addColorStop(0, ringStyle(color, 0));
  gradient.addColorStop(0.14, ringStyle(color, 0.95));
  gradient.addColorStop(0.5, ringStyle(color, 0.28));
  gradient.addColorStop(0.86, ringStyle(color, 0.95));
  gradient.addColorStop(1, ringStyle(color, 0));
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawPlanet() {
  const sky = skies[document.body.dataset.sky] || skies.lito;
  const width = 1200;
  const height = 820;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(640, 360, 40, 640, 360, 360);
  glow.addColorStop(0, sky.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(640, 430);
  ctx.rotate(-0.32);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-560, -240, 1120, 240);
  ctx.clip();
  strokeRing(ctx, 445, 78, 34, sky.ring);
  ctx.beginPath();
  ctx.ellipse(0, 0, 452, 82, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(8, 6, 12, 0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, -48);
  const body = ctx.createRadialGradient(-70, -78, 12, 16, 10, 210);
  body.addColorStop(0, sky.lit);
  body.addColorStop(0.12, sky.mid);
  body.addColorStop(0.58, sky.deep);
  body.addColorStop(1, sky.shade);
  ctx.beginPath();
  ctx.arc(0, 0, 196, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 196, 0, Math.PI * 2);
  ctx.clip();
  const night = ctx.createLinearGradient(-30, -40, 190, 30);
  night.addColorStop(0, "rgba(0,0,0,0)");
  night.addColorStop(0.62, "rgba(0,0,0,0.08)");
  night.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = night;
  ctx.fillRect(-210, -210, 420, 420);

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.ellipse(0, -24, 188, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 36, 170, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(10, 64, 160, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const air = ctx.createRadialGradient(0, 0, 176, 0, 0, 214);
  air.addColorStop(0, "rgba(255,255,255,0)");
  air.addColorStop(0.7, sky.glow);
  air.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(0, 0, 214, 0, Math.PI * 2);
  ctx.fillStyle = air;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(-560, 0, 1120, 260);
  ctx.clip();
  strokeRing(ctx, 445, 78, 36, sky.ring);
  ctx.beginPath();
  ctx.ellipse(0, 0, 452, 82, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(8, 6, 12, 0.45)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  caption.textContent = sky.caption;
}

drawPlanet();

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
    firstCard.querySelectorAll("svg").forEach((art) => {
      art.hidden = art.dataset.art !== button.dataset.sky;
    });
    if (reduce) {
      drawPlanet();
      return;
    }
    canvas.style.opacity = "0";
    window.setTimeout(() => {
      drawPlanet();
      canvas.style.opacity = "1";
    }, 160);
  });
});

rows.forEach((count, rowIndex) => {
  const row = document.createElement("div");
  row.className = "row";
  const number = document.createElement("span");
  number.className = "row-no";
  number.textContent = String(rowIndex + 1);
  row.appendChild(number);
  const split = Math.floor(count / 2);
  for (let place = 1; place <= count; place += 1) {
    const button = document.createElement("button");
    const name = `Ряд ${rowIndex + 1}, місце ${place}`;
    button.type = "button";
    button.className = "seat";
    button.setAttribute("aria-label", name);
    if (taken.has(`${rowIndex + 1}-${place}`)) {
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
    row.appendChild(button);
    if (place === split) {
      const aisle = document.createElement("span");
      aisle.className = "aisle";
      row.appendChild(aisle);
    }
  }
  dome.appendChild(row);
});

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
