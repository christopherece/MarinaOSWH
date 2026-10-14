# MarinaOS

A fleet safety and compliance app for small marine operators: vessels, shore bases, voyages, checks, maintenance, documents, health & safety and crew in one place.

MarinaOS is one HTML page with no build step and no server. It runs in two ways:

| Mode | Where | Data | Best for |
|---|---|---|---|
| **claude.ai Artifact** | Published from `marinaos.html` on claude.ai | Shared database, sign-in, file storage, provided by claude.ai | Day-to-day use by a team |
| **Local / static** | `index.html` opened from disk or any static host (e.g. GitHub Pages) | Stored in the browser you use (localStorage + IndexedDB) | Trying it out, demos, single-device use, development |

---

## Contents

1. [Features](#features)
2. [Quick start](#quick-start)
3. [Deploying](#deploying)
4. [User guide](#user-guide)
5. [Data model](#data-model)
6. [Customising](#customising)
7. [Project structure and build](#project-structure-and-build)
8. [Limitations](#limitations)
9. [Privacy and security](#privacy-and-security)
10. [Troubleshooting](#troubleshooting)

---

## Features

**Fleet dashboard**
- A card for each vessel or facility with its **asset score**: the share of tracked items that are current.
- Red / amber / green bars count overdue, due-within-30-days and current items.
- Fleet totals: score, overdue, due soon, reminders.
- Asset picker (show or hide assets) and search.

**Asset (vessel) pages**
- Operational mode (Operational / Maintenance / Out of service). Each change asks for a reason and is logged.
- Engine hours with "tap to log", and a 7-day action log.
- Status bars for every register, linking straight to that register filtered to the asset.
- Vessel details: callsign, MNZ number, MMSI, dimensions, engines, construction, area of operation, and a Marine Traffic link.
- Photo for the dashboard card.

**Logbook (voyages)**
- **Start up:** master, origin, departure, engine hours, fuel, weather, tides, crew on board, and pre-voyage checks (OK / Fault / N/A).
- **Events:** General note, Departed, Anchored, Arrived, Navigation log, Engineering log, Safety briefing, Bunkering, Weather forecast, Towing operations, or your own list per asset.
- **Complete:** destination, arrival, end engine hours and fuel, and shutdown checks.
- Pre- and post-voyage faults automatically become jobs on the defect list.
- Voyage history by month, CSV export of a single voyage or the whole history.
- Per-asset logbook settings: saved locations, required fuel and weather readings, minimum crew, start-up and shutdown checks, event types.

**Safety:** Safety Checks · Safety Equipment Expiries · Drills (crew matrix)

**Maintenance:** Planned Maintenance (by date and/or engine hours) · Job / Defect List · Spare Parts · Equipment List · Equipment Manuals · Maintenance History

**Vessel documents:** Certificates · Vessel Documents · Survey Documents · Standard Operating Procedures

**Health & Safety**
- Incident / Event Reports: a full report form with a draft → for review → in review → completed workflow, and a signature.
- Corrective Actions, Risk Assessments (pre- and post-control ratings), H&S Meetings, Dangerous Goods Register.

**Company documents**
- Maritime Transport Operator Plan: a document made of numbered sections, with a table of contents and PDF export.
- Company Documents.
- Forms / Checklists with a **form builder**, versions, drafts and signatures.

**Crew:** Crew Particulars · Crew Certificates · Crew Training (crew matrix) · Contacts / Suppliers

**Across all registers**
- Attachments (photos, PDFs, video).
- Links and tags.
- Renewals with history.
- Reminders.
- Overdue / upcoming filter chips.
- CSV export.

**Reporting**
- Overview: status by asset, plus a list of everything that needs attention.
- Safety, Maintenance, Health & Safety, Vessel Documents and Crew reports, with charts and a 7 / 30 / 90 / 365-day filter.
- CSV export of every chart.

---

## Quick start

### Try it on your computer (local mode)

1. Download or clone this repository.
2. Open `index.html` in Chrome, Edge, Firefox or Safari.

   Attachments need the page served over `http://` rather than opened as a file in some browsers. If photos don't upload, serve the folder instead:

   ```bash
   cd marinaos
   python3 -m http.server 8000
   # then open http://localhost:8000
   ```

3. The first time it opens, MarinaOS loads two example assets and a few example records. Edit or delete them.

Local mode keeps everything in that one browser. See [Limitations](#limitations).

### Use it as a team (claude.ai Artifact)

1. In Claude (claude.ai, with Artifacts enabled), ask Claude to publish `marinaos.html` as an Artifact with these capabilities:

   ```json
   { "db": {}, "user": { "scopes": ["profile"] }, "assets": { "upload": "interact" }, "downloads": true }
   ```

   | Capability | Gives the app |
   |---|---|
   | `db` | Shared database |
   | `user` | Who is signed in, and names for "completed by" |
   | `assets` | Photo and file storage. `"interact"` lets Contributors upload, where your plan supports it. |
   | `downloads` | CSV and PDF exports |

2. Open the Artifact and click **Share**.
   - **Contributor:** crew who fill in checks, voyages and reports.
   - **Viewer:** read-only access.
   - **Editor:** people who manage the app and its files.
3. Add your assets with **+ Add asset**, then fill in the registers.

To update a published Artifact after changing the code, republish the same file to the same Artifact URL. The data is kept.

---

## Deploying

### GitHub Pages (static, local mode)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`, and save.
4. After a minute the app is live at `https://<your-user>.github.io/<repo>/`.

GitHub Pages hosts the page only. Each visitor's data stays in their own browser, so it is **not** a shared team database. For a team, use the claude.ai Artifact mode or connect a backend (see [Customising → Using your own backend](#using-your-own-backend)).

Other static hosts (Netlify, Vercel, Cloudflare Pages, an S3 bucket, any web server) work the same way. Upload `index.html` and `local-mode.js` together.

---

## User guide

### Status colours

| Colour | Meaning |
|---|---|
| **Red** | Overdue, failed, urgent, serious, or below minimum stock |
| **Amber** | Due within 30 days, open, or at minimum stock |
| **Green** | Current or completed |
| **Grey** | Not scheduled, or an information-only record |

The **asset score** is green ÷ (red + amber + green) for that asset's records.

### Assets

- **+ Add asset** adds a vessel, work boat, patrol boat, barge or shore base.
- **Asset details** on an asset page edits everything about the asset:
  - registration details and photo
  - engine hours
  - logbook settings: locations, fuel and weather requirements, minimum crew, start-up and shutdown checks, event types.
- The mode button (e.g. **Operational ▾**) changes the operational mode. A reason is required, and the change is listed under *Operational mode history*.
- **Engine hours · tap to log** records a new reading. Hours-based maintenance updates from it.

### Logbook

1. On an asset page click **Start voyage**, or go to **Logbook → Voyages → Start voyage**.
2. Fill in start up:
   - master and origin, picked from the saved locations
   - departure time, engine hours, fuel, weather, tides
   - who is on board
   - the pre-voyage checks
3. During the voyage, tap an event button (Departed, Navigation log, Bunkering…) to log it. Engineering log entries update engine hours. Bunkering litres are added to fuel used.
4. On return open the **Complete** tab, then **Complete voyage**:
   - destination, arrival time, end hours and fuel
   - shutdown checks
5. Any start-up or shutdown check marked **Fault** creates a job on the defect list.

The dashboard card shows **Active 1h 20m** while a voyage is underway.

### Registers

Every register works the same way:

- **+ Add …** creates a record. Required fields are marked `*`.
- Click a row to view or edit it, attach files, add links, and see its history.
- The filter chips (**All / Overdue / Upcoming / Current**), the asset dropdown and search narrow the list.
- **Export** downloads the current list as CSV.

Record actions:

| Button | Used on | What it does |
|---|---|---|
| **Complete / Fill in** | Safety checks, maintenance, drills, training, forms | Records a completion with date, actual time, notes, photos and checklist results. Moves the next due date forward. |
| **Renew** | Equipment expiries, certificates, documents | Records a renewal with the new expiry date and file, and keeps the history. |
| **Review** | Risk assessments | Records a review and moves the next review date. |

**Planned maintenance** can be scheduled by interval (weekly to 5-yearly, or custom days), by engine hours, or both. It goes red at whichever limit comes first. Completing it asks for the current engine hours.

**Checklists:** add *Checklist items* (one per line) to a safety check, drill or maintenance task, and **Fill in** shows each item as Pass / Fail / N/A. Failed items can automatically raise jobs.

**Drills and Crew Training** open as a **crew matrix**: one row per person, one column per drill or training task. Each cell shows when that person last did it, coloured by due date. Click a cell, or **✓ Complete**, to record a session and tick everyone who took part.

**Reminders:** set *Reminder* (1 week to 3 months before) on certificates, documents, equipment expiries, jobs or dangerous goods. The **Reminders** tile on the dashboard lists records whose reminder window has started.

### Incident / event reports

1. **+ Add report** and complete the sections:
   - **Type:** asset, type of event, title, category
   - **Personnel:** who was involved, who reported it, witnesses
   - **Event:** date, time, location, conditions, authorities notified, contributing factors, damage, what happened, initial actions, suggested corrective actions
2. **Save draft** keeps it as Draft.
3. **Submit report** requires the signature and sets the status to *For review*.
4. Reviewers fill in the **Review** section (severity, injury details, findings) and move it to *In review*, then *Completed*.
5. **+ Corrective action** on a report creates a linked corrective action.

### Forms / Checklists (form builder)

1. **+ Add form**: title, category, and *Linked to* (None, Vessel / facility, or Personnel).
2. Open the form, then **Edit form**. Add fields:

   | Field | Use |
   |---|---|
   | Section heading | Splits the form into sections |
   | Checklist group | Several items, each marked ✓ / Fault / N/A |
   | Required tick box | A statement that must be ticked |
   | Short answer, long answer, number, date | Free entry |
   | Crew member | Picks someone from Crew Particulars |
   | Signature | Finger or mouse signature pad |

   Reorder fields with ↑ ↓. **Save new version** creates a new version. Past completions keep the version they used.
3. **Complete** fills in the form.
   - **Save draft** saves it to finish later. Drafts show in the form's history and reopen where you left off.
   - **Submit** checks required fields and signatures, then records the completion.
4. Open any completion in the history to view it, or export it as a **PDF** with signatures.

### Maritime Transport Operator Plan

- Write the plan as numbered sections, e.g. `1`, `2.1`, `2.2`, each with its own version and review date.
- The **Document** view shows a table of contents and the full plan. **List** shows sections as records.
- **Export as PDF** downloads the whole plan.
- Company documents, vessel documents and SOPs can also be written in the app as *controlled documents* (the content field). Use **View document** and **PDF** on them.

### Reporting

- **Overview:** status by asset across all registers, plus everything overdue or due soon.
- **Safety, Maintenance, Health & Safety, Vessel Documents, Crew:** charts by asset and category. Use the period filter for completed work.
- **Export** on each report downloads the chart data as CSV.

---

## Data model

The app uses four collections:

| Collection | One document per | Key fields |
|---|---|---|
| `vessels` | asset | `name`, `type`, `status`, `engineHours`, `hoursDate`, `photo`, vessel details (`callsign`, `mnz`, …), logbook settings (`locations`, `preChecks`, `postChecks`, `eventTypes`, `minCrew`, `fuelRequired`, `weatherRequired`), `modeHistory[]` |
| `items` | register record | `kind` (which register), `title`, `vesselId` (empty for company-wide), register fields (see `KINDS`), `files[]`, `links[]`, `tags[]`, `updatedAt`, `updatedBy` |
| `completions` | completion, renewal or review | `itemId`, `kind`, `vesselId`, `date`, `by`, `status` (`Completed` / `Draft`), `results[]` / `answers[]`, `attendees[]`, `personnel`, `mins`, `hours`, `notes`, `files[]`, `formVersion` |
| `voyages` | voyage | `vesselId`, `status` (`active` / `completed`), `name`, `origin`, `departAt`, `destination`, `arriveAt`, `startHours`, `endHours`, `startFuel`, `endFuel`, `crew[]`, `checks[]`, `postChecksDone[]`, `weather`, `tides`, `events[]` |

The `kind` values in `items`:

| Area | `kind` values |
|---|---|
| Safety | `safetyCheck`, `equipExpiry`, `drill` |
| Maintenance | `maintenance`, `defect`, `spare`, `equipment`, `equipManual` |
| Vessel documents | `vesselCert`, `vesselDoc`, `surveyDoc`, `sop` |
| Health & Safety | `incident`, `correctiveAction`, `risk`, `hsMeeting`, `dangerousGood` |
| Company documents | `motPlan`, `companyDoc`, `form` |
| Crew | `crewMember`, `crewCert`, `training`, `contact` |

Other conventions:

- Dates are `YYYY-MM-DD`. Times are ISO 8601 timestamps.
- People who used the app (`by`, `updatedBy`) are stored as opaque user ids and resolved to names when shown.
- Crew in registers are plain names taken from Crew Particulars.

---

## Customising

All configuration is near the top of the `<script>` in `marinaos.html`.

### Add or change a register

Registers are defined in the `KINDS` object. Each entry looks like this:

```js
myRegister: {
  label: "My Register",          // name in the sidebar and page title
  one: "record",                 // used in "+ Add record"
  scope: "vessel",               // "vessel" | "company" | "either"
  group: "category",             // optional: group rows by this field
  fields: [ F.title("Name"), F.vessel, { k:"expiry", label:"Expiry", type:"date" } ],
  due: it => it.expiry,          // optional: due date shown in the list
  status: it => byDate(it.expiry), // "red" | "amber" | "green" | "info" | "none"
  cols: ["category"],            // extra list columns
  // optional flags: complete:"lastDone", renew:true, matrix:true, docView:true, draftable:true
}
```

Then add the key to a section in `SECTIONS` so it appears in the sidebar and on asset pages.

The field `type` can be any of:

| Type | Input |
|---|---|
| `text`, `textarea`, `number`, `date`, `time` | Standard inputs |
| `select` | Dropdown (needs `options`) |
| `multi` | Tick boxes (needs `options`) |
| `vessel`, `vesselmulti` | One asset, or several |
| `crew`, `crewmulti` | One crew member, or several |
| `equipment`, `contact` | A record from the Equipment List or Contacts |
| `tags` | Comma-separated tags |
| `links` | URLs, one per line |
| `signature` | Signature pad |
| `heading` | Section heading inside the form |

### Other settings

| Setting | Where |
|---|---|
| "Due soon" window | `WARN_DAYS` (default 30) |
| Repeat intervals | `INTERVALS` |
| Systems list | `SYSTEMS` |
| Contributing factors | `FACTORS` |
| Default voyage event types | `EVENT_TYPES` (each asset can override these in its logbook settings) |
| Colours and fonts | CSS custom properties at the top of the `<style>` block. Light and dark themes are both defined there. |

After editing `marinaos.html`:

- **Static / local:** run `python3 build.py` to regenerate `index.html`.
- **claude.ai:** republish `marinaos.html` to the same Artifact.

### Using your own backend

The app talks to storage only through `claude.use("db")`, `claude.use("user")`, `claude.use("assets")` and `claude.use("downloads")`. `local-mode.js` is a complete example of that interface backed by the browser. To run MarinaOS as a shared app outside claude.ai, write a similar adapter backed by Firebase/Firestore, Supabase or your own API, and load it instead of `local-mode.js`. The interface is small:

| Capability | Methods |
|---|---|
| `db` | `collection(name)` with `.doc(id?)`, `.onSnapshot(fn)`, `.get()`. Document refs have `.set()`, `.update()`, `.delete()`, `.get()`. |
| `user` | `id()`, `me()`, `can()`, `profiles(ids)` |
| `assets` | `upload(file)` → `{id, url, contentType}`. Also set `window.__marinaBlobURL = id => url`. |
| `downloads` | `save({filename, data})` |

---

## Project structure and build

```
.
├── index.html      # Standalone app (generated: wrapper + local-mode.js + marinaos.html)
├── local-mode.js   # Browser-only stand-in for claude.ai's runtime (localStorage + IndexedDB)
├── marinaos.html   # The app source; also what gets published as a claude.ai Artifact
├── build.py        # Regenerates index.html from marinaos.html
└── README.md
```

| Dependency | Loaded from | Used for |
|---|---|---|
| Google Fonts: Archivo, Source Sans 3, IBM Plex Mono | Google Fonts | Type. The app falls back to system fonts if they're blocked. |
| jsPDF 2.5.1 | cdnjs, only when you export a PDF | PDF export |

There is no bundler, framework or package install.

Rebuild after any change to the source:

```bash
python3 build.py
```

---

## Limitations

- **Local mode is single-browser.** Data lives in that browser's storage. It isn't shared, isn't synced across devices, and is lost if you clear site data. Export CSVs regularly, or use claude.ai mode.
- **No email or push notifications.** "To notify" and reminders are shown inside the app only.
- **Weather and tides are entered by hand.** There is no automatic forecast feed.
- **Online only on claude.ai.** There is no offline mode or native mobile app. The page works in mobile browsers.
- **Permissions are coarse.** On claude.ai, access follows Artifact sharing levels (Viewer, Contributor, Editor). There are no custom roles.
- **Logbook edits are last-write-wins.** Two people saving an event on the same voyage at the same instant can overwrite one another.

---

## Privacy and security

- **Crew Particulars** can hold personal and medical details: next of kin, medical issues, medication, allergies, passport number. Everyone who can open the app can read them. Only fill them in if every viewer should see them, and share the Artifact accordingly.
- **Don't commit real data to a public repository.** `index.html` and the source contain no records. Records live in the database or browser storage, not in the code.
- **Local mode leaves data in the browser.** On a shared computer, use a private window or clear the site data when finished.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Records can't load in this view" | On claude.ai, sign in and open the Artifact from claude.ai. Standalone, make sure `local-mode.js` sits next to `index.html`. |
| Can't add or edit anything (claude.ai) | You have Viewer access. Ask the owner for Contributor access. |
| "+ Add photo" is missing (claude.ai) | Uploads need Editor access, or Contributor where `assets.upload: "interact"` is supported. |
| Photos don't upload (local) | Serve the folder over `http://localhost` (see [Quick start](#quick-start)). Some browsers block storage for `file://` pages. |
| PDF export does nothing | The PDF library loads from cdnjs on first use. Check your connection or content blocker. |
| Start over with example data (local) | Clear the site data, or run `Object.keys(localStorage).filter(k=>k.startsWith('marinaos.local.')).forEach(k=>localStorage.removeItem(k))` in the browser console, then reload. |
