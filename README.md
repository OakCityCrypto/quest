# Quest — Cash's Daily Practice

An offline phone app: one reading passage (tuned to his Lexile, weighted heaviest),
ten math problems (accelerated, grade 7), and a school-work check-in — wrapped in an
XP / coins / badges reward loop tied to a motivation profile. No internet, no accounts,
no cost. Every answer is logged on-device for later use (the "Model B" live-generator).

---

## 1. Deploy it free on GitHub Pages (~5 minutes)

The whole site is the **`docs/`** folder. GitHub Pages can serve that directly.

### Option A — drag-and-drop (no command line)
1. Go to https://github.com/new → name it `quest` → **Public** → Create.
   *(Public is required for free Pages. The repo holds only code + passages — no personal
   data; all of Cash's answers live on his phone, never in the repo.)*
2. On the repo page: **Add file → Upload files**. Drag in **everything from this folder**
   (including the `docs/` folder, keep the structure) → Commit.
3. **Settings → Pages**. Under *Build and deployment*: Source = **Deploy from a branch**,
   Branch = **main**, Folder = **/docs** → Save.
4. Wait ~1 minute, refresh. The URL appears at the top:
   `https://<your-username>.github.io/quest/`

### Option B — command line
```bash
cd quest
git init && git add . && git commit -m "Quest v1"
git branch -M main
git remote add origin https://github.com/<your-username>/quest.git
git push -u origin main
```
Then do step 3 above (Settings → Pages → main → /docs).

---

## 2. Put it on Cash's iPhone home screen
1. Open the Pages URL **in Safari** (must be Safari for this to work on iOS).
2. Tap the **Share** icon → **Add to Home Screen** → **Add**.
3. It launches full-screen like a real app and works **offline** after the first open.

Use the **same phone** each day — progress and the data log are stored on that device.

---

## 3. First run
- The quiz sorts him into a motivation type (Champion / Collector / Designer / Earner /
  Explorer / Star) — this reshapes how rewards are framed for him.
- Defaults are already set for Cash: **Reading = Building (~830L)**, **Math = 7th**.
  Change them anytime in the **Parent** tab.
- In **Parent**, paste the **PowerSchool / Canvas link** so the school-work mission
  deep-links straight to his grades.

---

## 4. The data you asked for (Model B)
**Parent tab → "Model-B data"**. Every session logs, per answer:
- Reading: each question's type (main-idea / detail / vocab / inference), what he picked,
  whether it was right, his open-response writing sample, the Lexile, and time spent.
- Math: each problem's topic tag, his answer, right/wrong, perfect-score flag, and timing.
- School-work check-ins, day-completions, and reward redemptions.

Tap **Export data (.json)** to pull the full log for training/calibrating the live model,
or **Copy to clipboard**. The **Insights** panel above it already surfaces his weakest
math topics and reading-question types from real answers.

---

## 5. Adding more passages later (when the bank starts repeating)
The bank is **`src/passages.js`** — a plain array. Add objects in the same shape
(`title, genre, lexile, passage, mc[5], open`), then rebuild:

```bash
npx esbuild src/main.jsx --bundle --minify --outfile=docs/app.js --loader:.js=jsx
cp public/* docs/
```
Commit and push — Pages redeploys automatically. (Bump the cache name in `public/sw.js`
from `quest-v1` to `quest-v2` so phones pick up the new build.)

Currently **18 passages** at ~830–925L. The app rotates without repeating until the bank
is exhausted, then reshuffles.

---

## Structure
```
src/        app.jsx (app), passages.js (reading bank), styles.css, main.jsx (entry)
public/     index.html, manifest.json, sw.js, icons, .nojekyll
docs/       ← the built, deployable site (this is what Pages serves)
```
Built with React 19 + esbuild. No backend, no API keys, no tracking.
