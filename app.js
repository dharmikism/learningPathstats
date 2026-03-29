const stats = ["Power", "Speed", "Durability", "Precision", "Potential", "Focus"];
const API_BASE = window.location.origin;

const baseStats = {
  Power: 88,
  Speed: 84,
  Durability: 80,
  Precision: 82,
  Potential: 86,
  Focus: 78,
};

const state = {
  planName: "DSA Prep",
  weeks: 8,
  hours: 18,
  domain: "software",
  sliders: {
    timePressure: 40,
    burnoutRisk: 35,
    marketVolatility: 30,
  },
  before: structuredClone(baseStats),
  after: structuredClone(baseStats),
  repaired: false,
  upgrades: [],
};

const gradeBands = [
  { min: 90, grade: "A" },
  { min: 80, grade: "B" },
  { min: 70, grade: "C" },
  { min: 60, grade: "D" },
  { min: -1, grade: "E" },
];

const el = {
  apiKey: document.getElementById("apiKey"),
  rankBadge: document.getElementById("rankBadge"),
  pathName: document.getElementById("pathName"),
  pathAbility: document.getElementById("pathAbility"),
  weaknessText: document.getElementById("weaknessText"),
  weaknessCard: document.getElementById("weaknessCard"),
  radar: document.getElementById("radar"),
  radarNote: document.getElementById("radarNote"),
  gradesGrid: document.getElementById("gradesGrid"),
  evolutionGrid: document.getElementById("evolutionGrid"),
  timeline: document.getElementById("timeline"),
  planName: document.getElementById("planName"),
  weeks: document.getElementById("weeks"),
  hours: document.getElementById("hours"),
  domain: document.getElementById("domain"),
  intelStatus: document.getElementById("intelStatus"),
  fetchIntel: document.getElementById("fetchIntel"),
  timePressure: document.getElementById("timePressure"),
  burnoutRisk: document.getElementById("burnoutRisk"),
  marketVolatility: document.getElementById("marketVolatility"),
  timePressureVal: document.getElementById("timePressureVal"),
  burnoutRiskVal: document.getElementById("burnoutRiskVal"),
  marketVolatilityVal: document.getElementById("marketVolatilityVal"),
  fixPath: document.getElementById("fixPath"),
  fixStatus: document.getElementById("fixStatus"),
  upgradeList: document.getElementById("upgradeList"),
  tabButtons: [...document.querySelectorAll(".tab-btn")],
  upgradesPanel: document.getElementById("upgradesPanel"),
  timelinePanel: document.getElementById("timelinePanel"),
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreToGrade(score) {
  return gradeBands.find((b) => score >= b.min).grade;
}

function scoreToRank(avg) {
  if (avg >= 90) return "S";
  if (avg >= 83) return "A";
  if (avg >= 74) return "B";
  if (avg >= 66) return "C";
  if (avg >= 56) return "D";
  return "E";
}

function computeAfterStats() {
  const { timePressure, burnoutRisk, marketVolatility } = state.sliders;
  const { weeks, hours } = state;

  const scheduleStress = clamp(((hours / Math.max(weeks, 1)) * 5), 0, 30);
  const fatigue = burnoutRisk * 0.45 + timePressure * 0.2;

  state.after = {
    Power: clamp(baseStats.Power - timePressure * 0.28 - marketVolatility * 0.12, 35, 99),
    Speed: clamp(baseStats.Speed - timePressure * 0.33 - scheduleStress * 0.4, 30, 99),
    Durability: clamp(baseStats.Durability - fatigue - marketVolatility * 0.18, 20, 99),
    Precision: clamp(baseStats.Precision - marketVolatility * 0.3 - timePressure * 0.12, 30, 99),
    Potential: clamp(baseStats.Potential - burnoutRisk * 0.2 - scheduleStress * 0.3, 30, 99),
    Focus: clamp(baseStats.Focus - burnoutRisk * 0.32 - timePressure * 0.08, 25, 99),
  };

  if (state.repaired) {
    Object.keys(state.after).forEach((k) => {
      state.after[k] = clamp(state.after[k] + 14, 20, 99);
    });
  }
}

function getWeaknessKey() {
  return Object.entries(state.after).sort((a, b) => a[1] - b[1])[0][0];
}

function pathNameFromPlan(planName) {
  const token = planName.trim() || "Unnamed";
  const first = token.split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `PATH: ${first || "VOID"}`;
}

function abilityFromDomain(domain) {
  const map = {
    software: "Core Strength: Recursive Pathfinding Under Chaos",
    data: "Core Strength: Probability Field Prediction",
    product: "Core Strength: User Intent Resonance",
    fintech: "Core Strength: Volatility Counterstrike",
  };
  return map[domain] || "Core Strength: Adaptive Problem Crushing";
}

function renderGrades() {
  el.gradesGrid.innerHTML = "";
  stats.forEach((stat) => {
    const score = state.after[stat];
    const grade = scoreToGrade(score);
    const card = document.createElement("article");
    card.className = `grade-card ${["D", "E"].includes(grade) ? "bad" : ""}`;
    card.innerHTML = `
      <p class="grade-stat">${stat}</p>
      <p class="grade-val">${grade}</p>
    `;
    el.gradesGrid.appendChild(card);
  });
}

function renderEvolution() {
  el.evolutionGrid.innerHTML = "";
  stats.forEach((stat) => {
    const beforeGrade = scoreToGrade(state.before[stat]);
    const afterGrade = scoreToGrade(state.after[stat]);
    const card = document.createElement("article");
    card.className = "evo-card";
    card.innerHTML = `
      <p class="evo-stat">${stat}</p>
      <p class="evo-flow">${beforeGrade} -> ${afterGrade}</p>
    `;
    el.evolutionGrid.appendChild(card);
  });
}

function renderTimeline() {
  const checkpoints = [
    "Week 2: Foundation sprint",
    "Week 4: Midpoint endurance",
    "Week 6: Mock battle",
    "Week 8: Final duel",
  ];

  const avg = stats.reduce((sum, k) => sum + state.after[k], 0) / stats.length;
  el.timeline.innerHTML = checkpoints
    .map((cp, idx) => {
      const passLine = 82 - idx * 5;
      const status = avg >= passLine ? "ok" : "fail";
      const icon = status === "ok" ? "[OK]" : "[X]";
      return `<li><span>${cp}</span><strong class="${status}">${icon} ${status === "ok" ? "PASS" : "FAIL"}</strong></li>`;
    })
    .join("");
}

function polygonPoints(cx, cy, radius, values) {
  const count = values.length;
  return values
    .map((v, i) => {
      const a = ((Math.PI * 2) / count) * i - Math.PI / 2;
      const r = (v / 100) * radius;
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    })
    .join(" ");
}

function axisPoint(cx, cy, radius, i, count, extra = 0) {
  const a = ((Math.PI * 2) / count) * i - Math.PI / 2;
  return [cx + Math.cos(a) * (radius + extra), cy + Math.sin(a) * (radius + extra)];
}

function renderRadar() {
  const width = 460;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = 170;
  const values = stats.map((k) => state.after[k]);
  const weakness = getWeaknessKey();

  let markup = "";

  for (let level = 1; level <= 5; level += 1) {
    const r = (maxR / 5) * level;
    const ringPoints = polygonPoints(cx, cy, r, new Array(stats.length).fill(100));
    markup += `<polygon points="${ringPoints}" fill="none" stroke="rgba(150,202,255,0.18)" stroke-width="1" />`;
  }

  stats.forEach((stat, i) => {
    const [x, y] = axisPoint(cx, cy, maxR, i, stats.length);
    const [lx, ly] = axisPoint(cx, cy, maxR, i, stats.length, 26);
    const danger = stat === weakness;
    markup += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${danger ? "#ff4f5a" : "rgba(150,202,255,0.38)"}" stroke-width="${danger ? 3 : 1}" />`;
    markup += `<text x="${lx}" y="${ly}" fill="${danger ? "#ff9aa1" : "#d2e8fa"}" font-size="14" text-anchor="middle">${stat}</text>`;
  });

  const pointsAfter = polygonPoints(cx, cy, maxR, values);
  markup += `<polygon points="${pointsAfter}" fill="${state.repaired ? "rgba(42,216,143,0.35)" : "rgba(48,208,255,0.30)"}" stroke="${state.repaired ? "#2ad88f" : "#30d0ff"}" stroke-width="3" />`;

  el.radar.innerHTML = markup;
}

function renderMeta() {
  const pathName = pathNameFromPlan(state.planName);
  el.pathName.textContent = pathName;
  el.pathAbility.textContent = abilityFromDomain(state.domain);

  const avg = stats.reduce((sum, key) => sum + state.after[key], 0) / stats.length;
  const rank = scoreToRank(avg);
  el.rankBadge.textContent = `Rank ${rank}`;

  const weakness = getWeaknessKey();
  const weaknessGrade = scoreToGrade(state.after[weakness]);
  el.weaknessText.textContent = `${weakness} axis is at grade ${weaknessGrade} under current stress.`;

  if (["D", "E"].includes(weaknessGrade)) {
    el.weaknessCard.classList.add("flash");
    el.radarNote.textContent = `Warning: ${weakness} axis critical.`;
  } else {
    el.weaknessCard.classList.remove("flash");
    el.radarNote.textContent = "Stress profile stable.";
  }
}

function renderUpgrades() {
  el.upgradeList.innerHTML = "";
  state.upgrades.forEach((u) => {
    const li = document.createElement("li");
    li.textContent = u;
    el.upgradeList.appendChild(li);
  });
}

function updateAll() {
  computeAfterStats();
  renderMeta();
  renderRadar();
  renderGrades();
  renderEvolution();
  renderTimeline();
  renderUpgrades();
}

function updateSliderLabel(id, value) {
  el[`${id}Val`].textContent = value;
}

async function fetchBrightDataIntel() {
  el.intelStatus.textContent = "BrightData scrape running...";
  el.fetchIntel.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/brightdata/intel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: state.domain,
        planName: state.planName,
        weeks: state.weeks,
        hours: state.hours,
      }),
    });

    if (!response.ok) {
      throw new Error(`Bright Data API ${response.status}`);
    }

    const intel = await response.json();

    state.sliders.timePressure = Number(intel.timePressure);
    state.sliders.burnoutRisk = Number(intel.burnoutRisk);
    state.sliders.marketVolatility = Number(intel.marketVolatility);

    el.timePressure.value = String(state.sliders.timePressure);
    el.burnoutRisk.value = String(state.sliders.burnoutRisk);
    el.marketVolatility.value = String(state.sliders.marketVolatility);

    updateSliderLabel("timePressure", state.sliders.timePressure);
    updateSliderLabel("burnoutRisk", state.sliders.burnoutRisk);
    updateSliderLabel("marketVolatility", state.sliders.marketVolatility);

    el.intelStatus.textContent = `Intel loaded: ${intel.insight || "Market signals mapped to stress profile."}`;
    state.repaired = false;
    updateAll();
  } catch (err) {
    el.intelStatus.textContent = `Bright Data unavailable (${err.message}). Using last slider values.`;
  } finally {
    el.fetchIntel.disabled = false;
  }
}

function localUpgradeSuggestions() {
  const weakest = Object.entries(state.after).sort((a, b) => a[1] - b[1]).slice(0, 3).map((x) => x[0]);
  const actions = {
    Power: "Add 2 deep-work blocks per week focused on hard problem sets.",
    Speed: "Introduce 25-minute timed drills to build response speed.",
    Durability: "Lock one full recovery day and cap daily max intensity.",
    Precision: "Add post-session error logs with pattern tagging.",
    Potential: "Reserve one weekly exploration block for frontier topics.",
    Focus: "Use single-task sprints with phone-off constraints.",
  };

  return weakest.map((w) => actions[w]);
}

async function callFeatherlessFix() {
  const apiKey = el.apiKey.value.trim();
  const weakest = getWeaknessKey();

  el.fixPath.disabled = true;
  el.fixStatus.textContent = "Featherless strategist is crafting upgrades...";

  try {
    const response = await fetch(`${API_BASE}/api/featherless/fix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        planName: state.planName,
        weakest,
        grades: stats.map((s) => ({ stat: s, grade: scoreToGrade(state.after[s]) })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Featherless API ${response.status}`);
    }

    const data = await response.json();
    let parsed = data?.upgrades;
    if (!Array.isArray(parsed)) {
      parsed = localUpgradeSuggestions();
    }

    state.upgrades = parsed.slice(0, 3).map((x) => String(x));
    el.fixStatus.textContent = "AI patch deployed. Path stats recovered.";
    state.repaired = true;
    updateAll();
  } catch (err) {
    state.upgrades = localUpgradeSuggestions();
    el.fixStatus.textContent = `AI unavailable (${err.message}). Applied fallback patch.`;
    state.repaired = true;
    updateAll();
  } finally {
    el.fixPath.disabled = false;
  }
}

function bindEvents() {
  el.planName.addEventListener("input", (e) => {
    state.planName = e.target.value;
    state.repaired = false;
    updateAll();
  });

  el.weeks.addEventListener("input", (e) => {
    state.weeks = Number(e.target.value) || 1;
    state.repaired = false;
    updateAll();
  });

  el.hours.addEventListener("input", (e) => {
    state.hours = Number(e.target.value) || 1;
    state.repaired = false;
    updateAll();
  });

  el.domain.addEventListener("change", (e) => {
    state.domain = e.target.value;
    fetchBrightDataIntel();
    updateAll();
  });

  ["timePressure", "burnoutRisk", "marketVolatility"].forEach((id) => {
    el[id].addEventListener("input", (e) => {
      const value = Number(e.target.value);
      state.sliders[id] = value;
      updateSliderLabel(id, value);
      state.repaired = false;
      updateAll();
    });
  });

  el.fetchIntel.addEventListener("click", fetchBrightDataIntel);
  el.fixPath.addEventListener("click", callFeatherlessFix);

  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      el.tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.tab === "timeline") {
        el.timelinePanel.classList.add("active");
        el.upgradesPanel.classList.remove("active");
      } else {
        el.timelinePanel.classList.remove("active");
        el.upgradesPanel.classList.add("active");
      }
    });
  });
}

function init() {
  updateSliderLabel("timePressure", state.sliders.timePressure);
  updateSliderLabel("burnoutRisk", state.sliders.burnoutRisk);
  updateSliderLabel("marketVolatility", state.sliders.marketVolatility);
  bindEvents();
  updateAll();
}

init();
