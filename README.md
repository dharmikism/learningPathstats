Great question. Here is exactly how your app calculates everything, step by step.

**End-to-End Flow**
1. You type plan details and roadmap topics in index.html.
2. Frontend logic in app.js parses roadmap text and computes roadmap metrics.
3. Those metrics + stress sliders are converted into 6 core scores.
4. Scores are converted into letter grades and rank.
5. UI updates radar, grade cards, evolution grid, weakness warning, and timeline.
6. Backend in server.js fetches Bright Data stress intel and Featherless suggestions.

---

**1) Roadmap Parsing and Metrics**
In app.js, roadmap input is parsed line-by-line.

Expected topic format examples:
1. `[x] Arrays (3h)` -> completed topic
2. `[ ] Graphs (5h)` -> pending topic
3. `[done] SQL (2h)` -> also treated as completed

For each line it extracts:
1. done status
2. cleaned title
3. estimated hours (`Nh`, default = 2 if not written)

Then it calculates:
1. totalTopics
2. completedTopics
3. completionPct
4. estimatedHours (sum)
5. coverageCount (how many skill buckets are represented)
6. roadmapStrength

Coverage buckets include:
1. algorithms
2. system design
3. backend
4. frontend
5. data
6. fundamentals

Roadmap strength formula:
$$
\text{roadmapStrength} = \text{clamp}\left(38 + 0.34\cdot \text{completionPct} + 6\cdot \text{coverageCount} + 0.24\cdot \min(\text{estimatedHours},80) - 1.5\cdot \text{hardTopicCount}, 0, 100\right)
$$

---

**2) Stress + Roadmap -> Core Stat Scores**
Base stats:
1. Power 88
2. Speed 84
3. Durability 80
4. Precision 82
5. Potential 86
6. Focus 78

Inputs used:
1. timePressure
2. burnoutRisk
3. marketVolatility
4. weeks
5. hours
6. roadmap metrics

Derived helper values:
1. `scheduleStress = clamp((hours / weeks) * 5, 0, 30)`
2. `fatigue = burnoutRisk * 0.45 + timePressure * 0.2`
3. `roadmapBoost = clamp(completionPct*0.08 + coverageCount*1.8 + roadmapStrength*0.05, 0, 14)`
4. `overloadPenalty = clamp((totalTopics - 16) * 0.6, 0, 10)`

Then each score is calculated (and clamped to safe ranges):
1. Power: affected by time + volatility, improved by roadmapBoost
2. Speed: drops with time pressure and schedule stress, plus overload
3. Durability: mainly reduced by fatigue and volatility
4. Precision: reduced by volatility/time, improved by coverage breadth
5. Potential: reduced by burnout/schedule, improved by roadmapBoost
6. Focus: reduced by burnout/time/overload, improved by completion

If “Fix My Path” is applied, repaired mode adds +14 to each stat (with clamp limits).

---

**3) Score -> Grade and Rank**
Grade mapping:
1. A: >= 90
2. B: >= 80
3. C: >= 70
4. D: >= 60
5. E: < 60

Rank mapping (based on average of 6 stats):
1. S: >= 90
2. A: >= 83
3. B: >= 74
4. C: >= 66
5. D: >= 56
6. E: < 56

Weakness:
1. Lowest stat is selected as primary weakness.
2. If weakness grade is D/E, warning style is highlighted.

---

**4) Timeline Logic**
Timeline checkpoints are fixed labels:
1. Week 2
2. Week 4
3. Week 6
4. Week 8

Pass threshold per checkpoint:
1. 82
2. 77
3. 72
4. 67

If average stat >= threshold -> PASS, else FAIL.

---

**5) Bright Data Calculation Path**
When you click “Get Live Stress”, frontend calls:
1. `POST /api/brightdata/intel` in server.js

Two modes:

1. Request API mode (`https://api.brightdata.com/request`)
1. Server builds Google query by domain.
2. Sends `{ zone, url, format: "raw" }`.
3. Parses returned HTML and counts keyword signals.
4. Converts counts to:
- marketVolatility
- timePressure
- burnoutRisk

2. Webhook JSON mode
1. Accepts JSON with either root fields or nested `intel`.
2. Normalizes multiple possible field names to the 3 stress values.

If Bright Data fails:
1. Server returns domain-based fallback stress profile and insight note.

---

**6) Featherless Suggestion Path**
When you click “Fix My Path”, frontend calls:
1. `POST /api/featherless/fix`

Backend logic in server.js:
1. Builds prompt from plan name, weakest stat, and current grades.
2. Tries configured model first (`FEATHERLESS_MODEL`).
3. If that fails, fetches `/v1/models` and retries with discovered models.
4. Parses model output as JSON array of 3 suggestions.
5. If everything fails, returns fallback suggestions + `fallbackReason`.

Frontend in app.js:
1. Shows AI success message if real response succeeded.
2. Shows backup message when fallback is used.

---

**7) Why Your UI Feels “Live”**
Every input event re-runs:
1. roadmap analysis
2. score recomputation
3. rank/grade mapping
4. full UI render

So you get immediate feedback for every typed topic or slider movement.

---

If you want, I can next create a one-page “formula cheat sheet” section in README.md so you can explain this quickly during judging without opening source code.