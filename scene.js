// Weather-themed scenery: the sky background, its animated particles, and the
// cartoon character shown next to the temperature.

// Groups WMO weather codes into the scenes we draw.
function weatherKind(code) {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "cloudy";
}

const TIPS = {
  clear: { day: "Sunglasses on, it's a bright one!", night: "Clear skies. Perfect for stargazing." },
  partly: { day: "A little sun, a little cloud. Best of both.", night: "A few clouds drifting past the moon." },
  cloudy: { day: "Grey skies. Good hot-chocolate weather.", night: "Cloudy and cosy tonight." },
  fog: { day: "Pea-soup fog! Take it slow out there.", night: "Foggy night. Take it slow out there." },
  rain: { day: "Grab an umbrella and some puddle boots!", night: "Rainy night. Fall asleep to the pitter-patter." },
  snow: { day: "Snowman time! Wrap up warm.", night: "Snow falling quietly tonight." },
  storm: { day: "Thunder's rumbling. Best to stay indoors!", night: "Stormy night. Stay safe and cosy inside." },
};

function weatherTip(kind, isDay) {
  return TIPS[kind][isDay ? "day" : "night"];
}

// ---- Cartoon characters (inline SVG, 120 x 120) ----

function face(x, y, mood = "happy") {
  const eyes =
    mood === "sleepy"
      ? `<path d="M${x - 12} ${y} q4 4 8 0 M${x + 4} ${y} q4 4 8 0" class="ink" fill="none" stroke-width="2.5" stroke-linecap="round"/>`
      : `<ellipse cx="${x - 8}" cy="${y}" rx="3" ry="4" class="ink-fill"/><ellipse cx="${x + 8}" cy="${y}" rx="3" ry="4" class="ink-fill"/>`;
  const mouth =
    mood === "shocked"
      ? `<ellipse cx="${x}" cy="${y + 11}" rx="4" ry="5" class="ink-fill"/>`
      : mood === "sleepy"
        ? `<path d="M${x - 4} ${y + 10} q4 3 8 0" class="ink" fill="none" stroke-width="2.5" stroke-linecap="round"/>`
        : `<path d="M${x - 8} ${y + 8} q8 8 16 0" class="ink" fill="none" stroke-width="2.5" stroke-linecap="round"/>`;
  const cheeks = `<circle cx="${x - 15}" cy="${y + 7}" r="4" fill="#ff8fa3" opacity=".6"/><circle cx="${x + 15}" cy="${y + 7}" r="4" fill="#ff8fa3" opacity=".6"/>`;
  return eyes + mouth + cheeks;
}

// A puffy cloud drawn twice: a fat outline pass, then the fill on top.
function cloud(fill, outline, x = 0, y = 0, s = 1) {
  const shapes = `<circle cx="36" cy="70" r="18"/><circle cx="58" cy="56" r="25"/><circle cx="84" cy="70" r="18"/><rect x="36" y="64" width="48" height="24" rx="12"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g fill="${outline}" stroke="${outline}" stroke-width="7" stroke-linejoin="round">${shapes}</g>
    <g fill="${fill}">${shapes}</g>
  </g>`;
}

function sun(x = 60, y = 60, r = 26) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = x + Math.cos(a) * (r + 8);
    const y1 = y + Math.sin(a) * (r + 8);
    const x2 = x + Math.cos(a) * (r + 18);
    const y2 = y + Math.sin(a) * (r + 18);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  return `<g class="spin" style="transform-origin:${x}px ${y}px" stroke="#f59e0b" stroke-width="6" stroke-linecap="round">${rays}</g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#ffd23f" stroke="#f59e0b" stroke-width="4"/>`;
}

function moon(x = 60, y = 58, r = 30) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fde68a" stroke="#e5b93a" stroke-width="4"/>
    <circle cx="${x + 14}" cy="${y - 14}" r="5" fill="#f5d36b"/><circle cx="${x - 16}" cy="${y + 16}" r="3.5" fill="#f5d36b"/>
    <text x="${x + 24}" y="${y - 24}" class="zzz">z</text><text x="${x + 33}" y="${y - 35}" class="zzz small">z</text>`;
}

function drops(color) {
  return [30, 50, 70, 90]
    .map((x, i) => `<path class="drop" style="animation-delay:${i * 0.25}s" d="M${x} 94 q-5 8 0 12 q5 -4 0 -12z" fill="${color}"/>`)
    .join("");
}

function flakes() {
  return [32, 54, 76, 94]
    .map(
      (x, i) =>
        `<g class="flake" style="animation-delay:${i * 0.4}s" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
          <line x1="${x - 5}" y1="100" x2="${x + 5}" y2="100"/><line x1="${x}" y1="95" x2="${x}" y2="105"/>
          <line x1="${x - 4}" y1="96" x2="${x + 4}" y2="104"/><line x1="${x + 4}" y1="96" x2="${x - 4}" y2="104"/>
        </g>`
    )
    .join("");
}

function illustration(kind, isDay) {
  const body = {
    clear: () => (isDay ? sun() + face(60, 58) : moon() + face(60, 56, "sleepy")),
    partly: () =>
      (isDay ? sun(44, 42, 20) : moon(44, 42, 20)) + `<g class="bob">${cloud("#ffffff", "#94a3b8", 8, 12, 0.9)}${face(60, 76)}</g>`,
    cloudy: () =>
      `${cloud("#cbd5e1", "#64748b", 26, -8, 0.7)}<g class="bob">${cloud("#f1f5f9", "#64748b", 0, 8)}${face(60, 72)}</g>`,
    fog: () =>
      `<g class="bob">${cloud("#e2e8f0", "#94a3b8", 0, -4)}${face(60, 60, "sleepy")}</g>
      <g class="mist" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M14 98 q12 -6 24 0 t24 0 t24 0 t24 0"/><path d="M24 110 q12 -6 24 0 t24 0 t24 0"/>
      </g>`,
    rain: () => `${drops("#38bdf8")}<g class="bob">${cloud("#94a3b8", "#475569", 0, -6)}${face(60, 58)}</g>`,
    snow: () => `${flakes()}<g class="bob">${cloud("#f8fafc", "#94a3b8", 0, -6)}${face(60, 58)}</g>`,
    storm: () =>
      `<path class="bolt" d="M64 80 L50 102 L62 102 L54 120 L78 94 L65 94 L74 80 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>
      <g class="bob">${cloud("#64748b", "#1e293b", 0, -10)}${face(60, 54, "shocked")}</g>`,
  }[kind]();
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// ---- Sky background ----

function makeParticles(sky, className, count, style) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = className;
    Object.assign(el.style, style(i));
    sky.append(el);
  }
}

function setScene(kind, isDay) {
  document.body.dataset.weather = kind;
  document.body.dataset.time = isDay ? "day" : "night";

  const sky = document.getElementById("sky");
  sky.replaceChildren();
  const rnd = (min, max) => min + Math.random() * (max - min);

  if (!isDay && (kind === "clear" || kind === "partly")) {
    makeParticles(sky, "star", 70, () => ({
      left: `${rnd(0, 100)}%`,
      top: `${rnd(0, 70)}%`,
      animationDelay: `${rnd(0, 3)}s`,
      transform: `scale(${rnd(0.5, 1.4)})`,
    }));
  }
  if (kind === "partly" || kind === "cloudy" || kind === "fog") {
    makeParticles(sky, "puff", kind === "partly" ? 3 : 5, (i) => ({
      top: `${rnd(2, 60)}%`,
      animationDuration: `${rnd(50, 90)}s`,
      animationDelay: `${-rnd(0, 90)}s`,
      scale: String(rnd(0.7, 1.6)),
      opacity: kind === "fog" ? 0.5 : 0.8 - i * 0.08,
    }));
  }
  if (kind === "rain" || kind === "storm") {
    makeParticles(sky, "rain", kind === "storm" ? 110 : 80, () => ({
      left: `${rnd(0, 100)}%`,
      animationDuration: `${rnd(0.5, 0.9)}s`,
      animationDelay: `${-rnd(0, 1)}s`,
      opacity: rnd(0.3, 0.7),
    }));
  }
  if (kind === "snow") {
    makeParticles(sky, "snow", 70, () => ({
      left: `${rnd(0, 100)}%`,
      width: `${rnd(4, 9)}px`,
      animationDuration: `${rnd(6, 14)}s`,
      animationDelay: `${-rnd(0, 14)}s`,
      opacity: rnd(0.5, 0.95),
    }));
  }
  if (kind === "storm") {
    const flash = document.createElement("span");
    flash.className = "flash";
    sky.append(flash);
  }
}
