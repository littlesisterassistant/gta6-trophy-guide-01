"use strict";
/* Leonida Legend — offline GTA VI trophy guide and tracker.
   No network at runtime: the only fetch is data/trophies.json, a file
   under app/ served by the same static server. Progress lives in
   localStorage and can be exported to a file and imported back. */

const DATA_URL = "data/trophies.json";
const STORAGE_KEY = "leonida-legend-progress-v1";
const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const GRADE_LETTER = { platinum: "P", gold: "G", silver: "S", bronze: "B" };

const SOURCES = {
  "PowerPyx": { label: "PowerPyx — GTA 6 Trophy Guide & Roadmap", url: "https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/" },
  "sixshore": { label: "sixshore — GTA 6 Trophy and Achievement List", url: "https://sixshore.com/gta-6/guides/trophies-and-achievements/" },
  "PSNProfiles": { label: "PSNProfiles — GTA VI PS5 trophies and points", url: null },
  "Exophase": { label: "Exophase — GTA VI PS5 trophy list", url: null },
  "Push Square": { label: "Push Square — GTA 6 trophy guide and roadmap", url: null },
  "TrueTrophies": { label: "TrueTrophies — GTA VI PS5 trophy list", url: null }
};

const ROADMAP_STAGES = [
  { n: 1, title: "Step 1 — Play the story (about 60–80 hours)", text: "Finish all five chapters and the story missions. Along the way, do the Chapter 1 meditation (see the warning above), take optional missions as they appear, scan every new vehicle with WAiNK and study new animals through the binoculars — all of it counts toward the 100% checklist later." },
  { n: 2, title: "Step 2 — The 100% checklist and challenges (about 100 hours)", text: "After the story the checklist opens under Progress, then Stats, then 100% Completion. Work through it: 70 of 80 challenges, 15 of 18 meditations, 300 stunts, and everything for robberies, underwater discoveries, shooting ranges, drone races and Bret's quests. Most trophies below live in this step." },
  { n: 3, title: "Step 3 — Strangers & cleanup (about 10 hours)", text: "Finish the stranger strands — Strangers & Freaks is not part of the 100% checklist, so it may still be open — clean up anything left on the list, and the platinum follows." }
];

let TROPHIES = [];
const state = {
  earned: new Set(),
  filter: "all",
  spoiler: false,
  query: "",
  view: "checklist",
  selected: null
};

function el(id) { return document.getElementById(id); }

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.earned)) {
      state.earned = new Set(data.earned.filter((n) => Number.isInteger(n)));
    }
  } catch (err) { /* a corrupt save is ignored; the checklist starts empty */ }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned].sort((a, b) => a - b) }));
  } catch (err) { /* storage full or unavailable: progress stays in memory */ }
}

function gradePoints(grade) { return GRADE_POINTS[grade] || 0; }

function earnedPoints() {
  return TROPHIES.reduce((sum, t) => sum + (state.earned.has(t.id) ? gradePoints(t.grade) : 0), 0);
}

function totalPoints() {
  return TROPHIES.reduce((sum, t) => sum + gradePoints(t.grade), 0);
}

function updateProgress() {
  el("progress-count").textContent = state.earned.size + " / " + TROPHIES.length + " earned";
  el("progress-points").textContent = earnedPoints() + " / " + totalPoints() + " PSN points";
  el("progress-fill").style.width = (TROPHIES.length ? (state.earned.size / TROPHIES.length) * 100 : 0) + "%";
}

function isStorySpoiler(t) {
  return state.spoiler && t.hidden && t.kinds.includes("story") && !state.earned.has(t.id);
}

function displayName(t) {
  return isStorySpoiler(t) ? "Hidden story trophy" : t.name;
}

function displayDescription(t) {
  return isStorySpoiler(t) ? "Hidden until earned — turn the spoiler setting off to reveal it, or earn it in the game." : t.description;
}

function trophyMatches(t) {
  if (state.filter !== "all" && !t.kinds.includes(state.filter)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderFilterCounts() {
  const counts = { all: TROPHIES.length, story: 0, missable: 0, collectibles: 0, activities: 0, online: 0 };
  for (const t of TROPHIES) {
    for (const k of t.kinds) {
      if (counts[k] !== undefined) counts[k] += 1;
    }
  }
  for (const [kind, n] of Object.entries(counts)) {
    const span = document.querySelector('[data-count="' + kind + '"]');
    if (span) span.textContent = "(" + n + ")";
  }
  const note = el("filter-note");
  if (state.filter === "online") {
    note.hidden = false;
    note.textContent = "There are no online trophies in GTA VI — all 55 are single-player, so this filter is empty by design. (Source: PowerPyx.)";
  } else {
    note.hidden = true;
    note.textContent = "";
  }
}

function trophyCard(t) {
  const li = document.createElement("li");
  li.className = "trophy-card" + (state.earned.has(t.id) ? " earned" : "");
  li.dataset.trophyId = String(t.id);
  const grade = t.grade;
  let badges = '<span class="badge">' + grade + '</span>';
  if (t.missable) badges += ' <span class="badge missable">⚠ missable</span>';
  if (t.hidden) badges += ' <span class="badge hidden-flag">hidden on PS5</span>';
  if (t.count) badges += ' <span class="badge count">×' + t.count + '</span>';
  li.innerHTML =
    '<div class="grade-disc grade-' + grade + '" aria-label="' + grade + ' trophy">' + GRADE_LETTER[grade] + '</div>' +
    '<div class="trophy-main">' +
      '<h3 class="trophy-name"></h3>' +
      '<p class="trophy-desc"></p>' +
      '<div class="trophy-meta">' + badges + '</div>' +
    '</div>' +
    '<div class="trophy-actions">' +
      '<label class="earned-check"><input type="checkbox" class="earned-box"' + (state.earned.has(t.id) ? " checked" : "") + '> Earned</label>' +
      '<button type="button" class="guide-btn">Guide</button>' +
    '</div>';
  li.querySelector(".trophy-name").textContent = displayName(t);
  li.querySelector(".trophy-desc").textContent = displayDescription(t);
  li.querySelector(".earned-box").addEventListener("change", (ev) => {
    if (ev.target.checked) state.earned.add(t.id); else state.earned.delete(t.id);
    saveProgress();
    renderAll();
  });
  li.querySelector(".guide-btn").addEventListener("click", () => showGuide(t.id));
  return li;
}

function renderList() {
  const list = el("trophy-list");
  list.innerHTML = "";
  const shown = TROPHIES.filter(trophyMatches);
  for (const t of shown) list.appendChild(trophyCard(t));
  el("empty-state").hidden = shown.length !== 0;
  const filterName = state.filter === "all" ? "all kinds" : state.filter;
  el("list-summary").textContent = "Showing " + shown.length + " of " + TROPHIES.length + " trophies (" + filterName + ")" +
    (state.query ? ' matching "' + state.query + '"' : "") + ".";
}

function renderRoadmap() {
  const wrap = el("roadmap-stages");
  wrap.innerHTML = "";
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement("div");
    card.className = "roadmap-stage";
    const items = TROPHIES.filter((t) => t.stage === stage.n);
    let listHtml = "";
    for (const t of items) {
      const done = state.earned.has(t.id);
      listHtml += '<li class="' + (done ? "earned" : "") + '">' + escapeHtml(displayName(t)) +
        ' <span class="badge">' + t.grade + "</span></li>";
    }
    card.innerHTML = "<h3>" + escapeHtml(stage.title) + "</h3><p>" + escapeHtml(stage.text) + "</p><ul>" + listHtml + "</ul>";
    wrap.appendChild(card);
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sourceLinks(names) {
  return names.map((name) => {
    const s = SOURCES[name];
    if (!s) return escapeHtml(name);
    if (s.url) return '<a href="' + s.url + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + "</a>";
    return escapeHtml(s.label);
  }).join("");
}

function showGuide(id) {
  const t = TROPHIES.find((x) => x.id === id);
  if (!t) return;
  state.selected = id;
  const body = el("guide-body");
  if (isStorySpoiler(t)) {
    body.innerHTML =
      "<h2>Hidden story trophy</h2>" +
      '<p class="trophy-desc">This is a story trophy and the spoiler setting is on, so its name, description and guide stay hidden until you earn it in the game — or turn the spoiler setting off.</p>' +
      '<p><button type="button" class="guide-btn" id="reveal-spoiler-btn">Turn the spoiler setting off</button></p>';
    body.querySelector("#reveal-spoiler-btn").addEventListener("click", () => {
      state.spoiler = false;
      el("spoiler").checked = false;
      saveProgress();
      renderAll();
      showGuide(id);
    });
  } else {
    let html = "<h2></h2><p class=\"trophy-desc\"></p><div class=\"trophy-meta\">";
    html += '<span class="badge">' + t.grade + "</span>";
    if (t.missable) html += ' <span class="badge missable">⚠ missable</span>';
    if (t.hidden) html += ' <span class="badge hidden-flag">hidden on PS5</span>';
    if (t.count) html += ' <span class="badge count">×' + t.count + "</span>";
    html += "</div>";
    if (t.missable) {
      html += '<div class="guide-warning"><strong>Possibly missable.</strong> See the guide below and do the Chapter 1 step during the story — it cannot be repeated later.</div>';
    }
    html += "<h3>How to earn it</h3><p></p><h3>Sources</h3><p class=\"guide-sources\">" + sourceLinks(t.sources) + "</p>";
    body.innerHTML = html;
    body.querySelector("h2").textContent = t.name;
    body.querySelector(".trophy-desc").textContent = t.description;
    body.querySelectorAll("p")[1].textContent = t.guide;
  }
  el("guide-panel").hidden = false;
  writeHash();
}

function closeGuide() {
  state.selected = null;
  el("guide-panel").hidden = true;
  writeHash();
}

function exportProgress() {
  const payload = JSON.stringify({ game: "Grand Theft Auto VI", earned: [...state.earned].sort((a, b) => a - b), exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leonida-legend-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgressFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("not a progress file");
      const ids = new Set(TROPHIES.map((t) => t.id));
      state.earned = new Set(data.earned.filter((n) => Number.isInteger(n) && ids.has(n)));
      saveProgress();
      renderAll();
    } catch (err) {
      alert("That file is not a Leonida Legend progress export.");
    }
  };
  reader.readAsText(file);
}

function setView(view) {
  state.view = view === "roadmap" ? "roadmap" : "checklist";
  el("roadmap-view").hidden = state.view !== "roadmap";
  el("checklist-view").hidden = state.view !== "checklist";
  el("tab-checklist").classList.toggle("active", state.view === "checklist");
  el("tab-roadmap").classList.toggle("active", state.view === "roadmap");
  el("tab-checklist").setAttribute("aria-selected", String(state.view === "checklist"));
  el("tab-roadmap").setAttribute("aria-selected", String(state.view === "roadmap"));
  if (state.view === "roadmap") renderRoadmap();
  writeHash();
}

function readHash() {
  // The hash fully determines the state: a missing parameter means its
  // default (checklist view, all filter), so a link like #spoiler=on
  // always shows the checklist with spoilers hidden, whether it is
  // opened fresh or navigated to from the roadmap view.
  const params = new URLSearchParams(location.hash.slice(1));
  state.view = params.get("view") === "roadmap" ? "roadmap" : "checklist";
  const filter = params.get("filter");
  state.filter = ["all", "story", "missable", "collectibles", "activities", "online"].includes(filter) ? filter : "all";
  state.spoiler = params.get("spoiler") === "on";
  state.query = params.get("q") || "";
  const trophy = Number(params.get("trophy"));
  state.selected = Number.isInteger(trophy) && trophy > 0 ? trophy : null;
}

function writeHash() {
  const params = new URLSearchParams();
  if (state.view !== "checklist") params.set("view", state.view);
  if (state.filter !== "all") params.set("filter", state.filter);
  if (state.spoiler) params.set("spoiler", "on");
  if (state.query) params.set("q", state.query);
  if (state.selected) params.set("trophy", String(state.selected));
  const hash = params.toString();
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search);
}

function renderAll() {
  updateProgress();
  renderFilterCounts();
  renderList();
  if (state.view === "roadmap") renderRoadmap();
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === state.filter);
  });
  el("spoiler").checked = state.spoiler;
  el("search").value = state.query;
  setView(state.view);
  // The guide panel follows the selected trophy: open exactly when the
  // state (or the URL hash) names one, closed otherwise — so a hash
  // without a trophy never leaves a stale panel over the page.
  if (state.selected) showGuide(state.selected);
  else el("guide-panel").hidden = true;
}

function bindEvents() {
  el("search").addEventListener("input", (ev) => {
    state.query = ev.target.value.trim();
    renderList();
    writeHash();
  });
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filter = chip.dataset.filter;
      renderAll();
    });
  });
  el("spoiler").addEventListener("change", (ev) => {
    state.spoiler = ev.target.checked;
    if (state.selected) closeGuide();
    renderAll();
  });
  el("tab-checklist").addEventListener("click", () => setView("checklist"));
  el("tab-roadmap").addEventListener("click", () => setView("roadmap"));
  el("export-btn").addEventListener("click", exportProgress);
  el("import-btn").addEventListener("click", () => el("import-file").click());
  el("import-file").addEventListener("change", (ev) => {
    if (ev.target.files && ev.target.files[0]) importProgressFile(ev.target.files[0]);
    ev.target.value = "";
  });
  el("reset-btn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies?")) {
      state.earned = new Set();
      saveProgress();
      renderAll();
    }
  });
  el("guide-close").addEventListener("click", closeGuide);
  window.addEventListener("hashchange", () => {
    readHash();
    renderAll();
  });
}

async function init() {
  loadProgress();
  bindEvents();
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Could not load " + DATA_URL);
  const data = await res.json();
  TROPHIES = data.trophies || data;
  readHash();
  renderAll();
  if (state.selected) showGuide(state.selected);
}

init().catch((err) => {
  el("list-summary").textContent = "Could not load the trophy list: " + err.message;
});
