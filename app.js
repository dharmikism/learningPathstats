const stats = ["Power", "Speed", "Durability", "Precision", "Potential", "Focus"];
const API_BASE = window.location.origin;
const DEFAULT_ROADMAP = "[x] Arrays and Strings (3h)\n[x] Binary Search (2h)\n[ ] Dynamic Programming (5h)\n[ ] System Design Basics (4h)";

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
  roadmapText: DEFAULT_ROADMAP,
  roadmapStats: {
    totalTopics: 0,
    completedTopics: 0,
    completionPct: 0,
    estimatedHours: 0,
    coverageCount: 0,
    roadmapStrength: 0,
  },
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
  roadmapInput: document.getElementById("roadmapInput"),
  roadmapStatsGrid: document.getElementById("roadmapStatsGrid"),
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

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resetRepairAndRefresh() {
  state.repaired = false;
  updateAll();
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

function analyzeRoadmap(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const topics = lines.map((line) => {
    const done = /^\[(x|done)\]/i.test(line);
    const title = line
      .replace(/^[-*\d.\s]*/, "")
      .replace(/^\[(x|done| )\]\s*/i, "")
      .replace(/\(\s*\d+\s*h\s*\)/i, "")
      .trim();
    const hoursMatch = line.match(/(\d+)\s*h/i);
    const hours = hoursMatch ? toNumber(hoursMatch[1], 2) : 2;
    return { done, title, hours };
  }).filter((topic) => topic.title.length > 0);

  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.done).length;
  const completionPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const estimatedHours = topics.reduce((sum, t) => sum + t.hours, 0);

  const buckets = [
    { name: "algorithms", pattern: /array|string|binary|graph|tree|dp|dynamic|greedy|recursion|algorithm/i },
    { name: "system", pattern: /system\s*design|scalability|distributed|cache|queue|api\s*design/i },
    { name: "backend", pattern: /node|backend|database|sql|nosql|express|server|auth/i },
    { name: "frontend", pattern: /react|frontend|ui|css|html|state\s*management/i },
    { name: "data", pattern: /python|ml|data|statistics|model|pandas|numpy/i },
    { name: "fundamentals", pattern: /os|network|dbms|oop|javascript|typescript|cs\s*fundamental/i },
  ];

  const covered = new Set();
  let hardTopicCount = 0;
  topics.forEach((topic) => {
    buckets.forEach((bucket) => {
      if (bucket.pattern.test(topic.title)) {
        covered.add(bucket.name);
      }
    });
    if (/hard|advanced|expert|deep|system\s*design/i.test(topic.title)) {
      hardTopicCount += 1;
    }
  });

  const coverageCount = covered.size;
  const roadmapStrength = clamp(
    38 + completionPct * 0.34 + coverageCount * 6 + Math.min(estimatedHours, 80) * 0.24 - hardTopicCount * 1.5,
    0,
    100,
  );

  return {
    totalTopics,
    completedTopics,
    completionPct,
    estimatedHours,
    coverageCount,
    roadmapStrength,
  };
}

function computeAfterStats() {
  const { timePressure, burnoutRisk, marketVolatility } = state.sliders;
  const { weeks, hours } = state;
  const { completionPct, coverageCount, totalTopics, roadmapStrength } = state.roadmapStats;

  const scheduleStress = clamp(((hours / Math.max(weeks, 1)) * 5), 0, 30);
  const fatigue = burnoutRisk * 0.45 + timePressure * 0.2;
  const roadmapBoost = clamp(completionPct * 0.08 + coverageCount * 1.8 + roadmapStrength * 0.05, 0, 14);
  const overloadPenalty = clamp((totalTopics - 16) * 0.6, 0, 10);

  state.after = {
    Power: clamp(baseStats.Power - timePressure * 0.28 - marketVolatility * 0.12 + roadmapBoost * 0.25, 35, 99),
    Speed: clamp(baseStats.Speed - timePressure * 0.33 - scheduleStress * 0.4 - overloadPenalty * 0.4, 30, 99),
    Durability: clamp(baseStats.Durability - fatigue - marketVolatility * 0.18, 20, 99),
    Precision: clamp(baseStats.Precision - marketVolatility * 0.3 - timePressure * 0.12 + coverageCount * 1.2, 30, 99),
    Potential: clamp(baseStats.Potential - burnoutRisk * 0.2 - scheduleStress * 0.3 + roadmapBoost * 0.5, 30, 99),
    Focus: clamp(baseStats.Focus - burnoutRisk * 0.32 - timePressure * 0.08 + completionPct * 0.05 - overloadPenalty, 25, 99),
  };

  if (state.repaired) {
    Object.keys(state.after).forEach((k) => {
      state.after[k] = clamp(state.after[k] + 14, 20, 99);
    });
  }
}

function renderRoadmapStats() {
  const s = state.roadmapStats;
  const cards = [
    { label: "Topics", value: `${s.totalTopics}` },
    { label: "Completed", value: `${s.completedTopics}` },
    { label: "Completion", value: `${s.completionPct}%` },
    { label: "Coverage", value: `${s.coverageCount} areas` },
    { label: "Planned Hours", value: `${s.estimatedHours}h` },
    { label: "Roadmap Strength", value: `${Math.round(s.roadmapStrength)}/100` },
  ];

  el.roadmapStatsGrid.innerHTML = cards
    .map((c) => `<article class="roadmap-stat-card"><p class="roadmap-stat-label">${c.label}</p><p class="roadmap-stat-value">${c.value}</p></article>`)
    .join("");
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
  state.roadmapStats = analyzeRoadmap(state.roadmapText);
  computeAfterStats();
  renderMeta();
  renderRadar();
  renderRoadmapStats();
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

    state.sliders.timePressure = clamp(toNumber(intel.timePressure, state.sliders.timePressure), 0, 100);
    state.sliders.burnoutRisk = clamp(toNumber(intel.burnoutRisk, state.sliders.burnoutRisk), 0, 100);
    state.sliders.marketVolatility = clamp(toNumber(intel.marketVolatility, state.sliders.marketVolatility), 0, 100);

    el.timePressure.value = String(state.sliders.timePressure);
    el.burnoutRisk.value = String(state.sliders.burnoutRisk);
    el.marketVolatility.value = String(state.sliders.marketVolatility);

    updateSliderLabel("timePressure", state.sliders.timePressure);
    updateSliderLabel("burnoutRisk", state.sliders.burnoutRisk);
    updateSliderLabel("marketVolatility", state.sliders.marketVolatility);

    el.intelStatus.textContent = `Intel loaded: ${intel.insight || "Market signals mapped to stress profile."}`;
    resetRepairAndRefresh();
  } catch (err) {
    el.intelStatus.textContent = `Bright Data unavailable (${err.message}). Keeping your current slider values.`;
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
  const apiKey = "";
  const weakest = getWeaknessKey();

  el.fixPath.disabled = true;
  el.fixStatus.textContent = "Generating practical improvements for your roadmap...";

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
    if (data?.fallbackReason) {
      el.fixStatus.textContent = `Using backup suggestions (${data.fallbackReason}).`;
    } else {
      el.fixStatus.textContent = "AI suggestions applied. Path stats recovered.";
    }
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
    resetRepairAndRefresh();
  });

  el.weeks.addEventListener("input", (e) => {
    state.weeks = clamp(toNumber(e.target.value, 1), 1, 52);
    resetRepairAndRefresh();
  });

  el.hours.addEventListener("input", (e) => {
    state.hours = clamp(toNumber(e.target.value, 1), 1, 80);
    resetRepairAndRefresh();
  });

  el.domain.addEventListener("change", (e) => {
    state.domain = e.target.value;
    fetchBrightDataIntel();
  });

  el.roadmapInput.addEventListener("input", (e) => {
    state.roadmapText = e.target.value;
    resetRepairAndRefresh();
  });

  ["timePressure", "burnoutRisk", "marketVolatility"].forEach((id) => {
    el[id].addEventListener("input", (e) => {
      const value = clamp(toNumber(e.target.value, state.sliders[id]), 0, 100);
      state.sliders[id] = value;
      updateSliderLabel(id, value);
      resetRepairAndRefresh();
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
  el.roadmapInput.value = state.roadmapText;
  updateSliderLabel("timePressure", state.sliders.timePressure);
  updateSliderLabel("burnoutRisk", state.sliders.burnoutRisk);
  updateSliderLabel("marketVolatility", state.sliders.marketVolatility);
  bindEvents();
  updateAll();
}

init();
