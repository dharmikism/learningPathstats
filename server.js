const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8787);
const HOST = "127.0.0.1";
const ROOT = __dirname;

const FEATHERLESS_API_URL = "https://api.featherless.ai/v1/chat/completions";
const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || "gpt-4.1-mini";
const FEATHERLESS_API_KEY = (process.env.FEATHERLESS_API_KEY || "").trim();

const BRIGHTDATA_WEBHOOK_URL = (process.env.BRIGHTDATA_WEBHOOK_URL || "").trim();
const BRIGHTDATA_BEARER_TOKEN = (process.env.BRIGHTDATA_BEARER_TOKEN || "").trim();
const BRIGHTDATA_ZONE = (process.env.BRIGHTDATA_ZONE || "").trim();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(res, code, payload) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n)));
}

function fallbackIntel(domain) {
  const map = {
    software: {
      marketVolatility: 42,
      timePressure: 58,
      burnoutRisk: 46,
      insight: "Hiring bar is rising; algorithm rounds trending harder.",
    },
    data: {
      marketVolatility: 55,
      timePressure: 48,
      burnoutRisk: 44,
      insight: "Model deployment expectations increased in listings.",
    },
    product: {
      marketVolatility: 38,
      timePressure: 52,
      burnoutRisk: 41,
      insight: "Role scope widened; cross-functional load is high.",
    },
    fintech: {
      marketVolatility: 67,
      timePressure: 49,
      burnoutRisk: 45,
      insight: "Regulation news and risk controls driving stress.",
    },
  };
  return map[domain] || map.software;
}

function normalizeIntel(raw, domain) {
  const source = raw?.intel || raw?.data || raw || {};

  const marketVolatility = clamp(source.marketVolatility ?? source.volatility ?? source.market_stress ?? 40, 0, 100);
  const timePressure = clamp(source.timePressure ?? source.time_pressure ?? source.deadline_pressure ?? 50, 0, 100);
  const burnoutRisk = clamp(source.burnoutRisk ?? source.burnout_risk ?? source.fatigue_risk ?? 45, 0, 100);
  const insight = String(source.insight || source.summary || `Live Bright Data signals mapped for ${domain}.`);

  return { marketVolatility, timePressure, burnoutRisk, insight };
}

async function fetchBrightDataIntel(payload) {
  if (!BRIGHTDATA_WEBHOOK_URL) {
    return fallbackIntel(payload.domain);
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (BRIGHTDATA_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${BRIGHTDATA_BEARER_TOKEN}`;
  }

  const isBrightDataRequestApi = /api\.brightdata\.com\/request/i.test(BRIGHTDATA_WEBHOOK_URL);
  let bodyPayload = payload;

  if (isBrightDataRequestApi) {
    const queryMap = {
      software: "software engineer jobs india hiring trend",
      data: "data science jobs india hiring trend",
      product: "product manager jobs india hiring trend",
      fintech: "fintech jobs india hiring trend",
    };
    const q = queryMap[payload.domain] || queryMap.software;
    const encoded = encodeURIComponent(q);

    bodyPayload = {
      zone: BRIGHTDATA_ZONE || "",
      url: `https://www.google.com/search?q=${encoded}`,
      format: "raw",
    };
  }

  const response = await fetch(BRIGHTDATA_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    throw new Error(`Bright Data webhook returned ${response.status}`);
  }

  if (isBrightDataRequestApi) {
    const html = await response.text();
    const volatility = clamp((html.match(/hiring|urgent|immediate|competition/gi) || []).length * 6 + 30, 0, 100);
    const pressure = clamp((html.match(/interview|deadline|round|assessment/gi) || []).length * 6 + 28, 0, 100);
    const burnout = clamp((html.match(/full time|onsite|experience|fast-paced/gi) || []).length * 5 + 24, 0, 100);

    return {
      marketVolatility: volatility,
      timePressure: pressure,
      burnoutRisk: burnout,
      insight: "Live Bright Data SERP snapshot analyzed from Google results.",
    };
  }

  const data = await response.json();
  return normalizeIntel(data, payload.domain);
}

function fallbackUpgrades(weakest) {
  const map = {
    Power: "Add 2 deep-work blocks per week focused on hard problem sets.",
    Speed: "Introduce 25-minute timed drills to improve response speed.",
    Durability: "Lock one recovery day and cap daily max intensity.",
    Precision: "Add post-session error logs with pattern tagging.",
    Potential: "Reserve one weekly exploration block for frontier topics.",
    Focus: "Use single-task sprints with strict distraction blocking.",
  };

  const first = map[weakest] || map.Focus;
  return [
    first,
    "Move low-value tasks out of peak focus hours and protect your core blocks.",
    "Use weekly review checkpoints to re-balance effort before burnout accumulates.",
  ];
}

function extractJsonArray(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function fetchFeatherlessUpgrades(payload) {
  const runtimeKey = (payload.apiKey || "").trim();
  const key = runtimeKey || FEATHERLESS_API_KEY;

  if (!key) {
    return fallbackUpgrades(payload.weakest);
  }

  const gradeText = (payload.grades || [])
    .map((g) => `${g.stat}:${g.grade}`)
    .join(", ");

  const prompt = [
    "You are a strategist improving a learning path under stress.",
    `Plan: ${payload.planName || "Unnamed"}`,
    `Weakest stat: ${payload.weakest || "Unknown"}`,
    `Current grades: ${gradeText}`,
    "Return exactly 3 concise upgrade actions as a JSON array of strings.",
  ].join("\n");

  const response = await fetch(FEATHERLESS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: FEATHERLESS_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Featherless returned ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonArray(content);

  return (parsed && parsed.length ? parsed : fallbackUpgrades(payload.weakest)).slice(0, 3).map(String);
}

function serveFile(reqPath, res) {
  const clean = reqPath === "/" ? "/index.html" : reqPath;
  const fullPath = path.join(ROOT, clean);

  if (!fullPath.startsWith(ROOT)) {
    sendJson(res, 400, { error: "Invalid path" });
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && reqUrl.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        featherlessConfigured: Boolean(FEATHERLESS_API_KEY),
        brightDataConfigured: Boolean(BRIGHTDATA_WEBHOOK_URL),
      });
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/brightdata/intel") {
      const payload = await readBody(req);
      try {
        const intel = await fetchBrightDataIntel(payload);
        sendJson(res, 200, intel);
      } catch (err) {
        const fallback = fallbackIntel(payload.domain);
        sendJson(res, 200, {
          ...fallback,
          insight: `${fallback.insight} (fallback: ${err.message})`,
        });
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/featherless/fix") {
      const payload = await readBody(req);
      try {
        const upgrades = await fetchFeatherlessUpgrades(payload);
        sendJson(res, 200, { upgrades });
      } catch (err) {
        sendJson(res, 200, { upgrades: fallbackUpgrades(payload.weakest), fallbackReason: err.message });
      }
      return;
    }

    if (req.method === "GET") {
      serveFile(reqUrl.pathname, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    sendJson(res, 500, { error: err.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Learning Path Stats Lab running at http://${HOST}:${PORT}`);
});
