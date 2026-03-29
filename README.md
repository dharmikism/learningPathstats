# Learning Path Stats Lab

Complete hackathon demo app with:
- Hero stats card and radar visualization
- Live stress degradation and evolution view
- AI recovery suggestions via Featherless
- Bright Data driven stress intel via webhook

## 1) Project Setup

1. Open terminal in this project folder.
2. Copy .env.example to .env.
3. Fill keys and webhook URL in .env.
4. Start the app:
   - npm start
5. Open http://127.0.0.1:8787 in Chrome.

## 2) Exactly What To Do In Featherless.ai

1. Log in to Featherless.
2. Create a new API key.
3. Copy the key.
4. Put it in one of these places:
   - Recommended: .env as FEATHERLESS_API_KEY
   - Optional: paste in app top bar field Featherless API Key (optional override)
5. Keep FEATHERLESS_MODEL in .env as gpt-4.1-mini unless you want another model.
6. Test inside app:
   - Add stress with sliders.
   - Click FIX MY PATH.
   - Confirm 3 upgrade suggestions appear.

What happens internally:
- Frontend calls POST /api/featherless/fix on local server.
- Server calls Featherless chat completions API.
- If API fails, server returns fallback suggestions so demo still runs.

## 3) Exactly What To Do In Bright Data

Goal:
- Bright Data should return stress metrics your app can map to sliders.

1. In Bright Data, create a webhook or API flow that returns JSON.
2. Make sure response includes these fields (root or inside intel object):
   - marketVolatility (0-100)
   - timePressure (0-100)
   - burnoutRisk (0-100)
   - insight (string summary)
3. Copy your Bright Data webhook URL.
4. Put webhook in .env:
   - BRIGHTDATA_WEBHOOK_URL=your_url
   - If you want to use Bright Data Request API directly, use:
     BRIGHTDATA_WEBHOOK_URL=https://api.brightdata.com/request
     BRIGHTDATA_ZONE=your_zone_name
5. If your endpoint needs auth, set:
   - BRIGHTDATA_BEARER_TOKEN=your_token
6. Restart server after changing .env.
7. In app, choose Domain and click Fetch Live Stress.
8. Confirm sliders update from returned values and intel message appears.

What happens internally:
- Frontend calls POST /api/brightdata/intel.
- Server forwards domain, planName, weeks, hours to your Bright Data webhook.
- If using Bright Data Request API URL directly, server sends zone/url/format payload and derives stress from returned HTML.
- Server normalizes returned fields into slider values.
- If Bright Data is unavailable, server sends fallback stress values.

## 4) Expected Bright Data Response Examples

Example A (root fields):
{
  "marketVolatility": 61,
  "timePressure": 52,
  "burnoutRisk": 47,
  "insight": "Job listings show tighter deadlines this week."
}

Example B (nested fields):
{
  "intel": {
    "marketVolatility": 61,
    "timePressure": 52,
    "burnoutRisk": 47,
    "insight": "Job listings show tighter deadlines this week."
  }
}

## 5) Demo Script (Judges)

1. Open app and show hero card.
2. Change Plan Name and show PATH label updates.
3. Select Domain and click Fetch Live Stress.
4. Move sliders and show grades degrade plus radar collapse.
5. Show weakness highlight in red.
6. Click FIX MY PATH and show AI upgrades.
7. Show rank and evolution recovery.

## 6) Files

- Frontend: index.html, styles.css, app.js
- Server: server.js
- Config template: .env.example
- Run script: package.json
