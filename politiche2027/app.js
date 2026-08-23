const app = {
  data: null,
  view: "home",
  history: [],
  group: null,
  party: null,
  candidateIndex: 0,
  candidateMode: "ordinary"
};

const views = {
  home: document.querySelector("#home-view"),
  ballot: document.querySelector("#ballot-view"),
  groups: document.querySelector("#groups-view"),
  group: document.querySelector("#group-view"),
  candidates: document.querySelector("#candidates-view"),
  summary: document.querySelector("#summary-view")
};

const stepByView = { ballot: 1, groups: 2, group: 3, candidates: 3, summary: 4 };
const backButton = document.querySelector("#back-button");
const progress = document.querySelector("#progress");
const progressLabel = document.querySelector("#progress-label");
const progressFill = document.querySelector("#progress-fill");
const main = document.querySelector("#contenuto");
const lawDialog = document.querySelector("#law-dialog");

function showView(name, { remember = true } = {}) {
  if (remember && app.view !== name) app.history.push(app.view);
  app.view = name;

  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("is-active", key === name);
  });

  const step = stepByView[name];
  progress.classList.toggle("is-hidden", !step);
  backButton.classList.toggle("is-hidden", name === "home");

  if (step) {
    progressLabel.textContent = `Passo ${step} di 4`;
    progressFill.style.width = `${step * 25}%`;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  main.focus({ preventScroll: true });
}

function goBack() {
  const previous = app.history.pop() || "home";
  showView(previous, { remember: false });
}

async function loadData() {
  const response = await fetch("data/padova-2022.json");
  if (!response.ok) throw new Error("Dati non disponibili");
  app.data = await response.json();
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function renderGroups() {
  const container = document.querySelector("#group-list");
  container.innerHTML = "";

  app.data.groups.forEach(group => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-card";
    button.style.setProperty("--group-color", group.color);
    button.innerHTML = `
      <span>
        <strong>${group.name}</strong>
        <small>${group.parties.length > 1 ? `${group.parties.length} liste insieme` : "Una lista"}</small>
      </span>
      <span class="arrow" aria-hidden="true">→</span>
    `;
    button.addEventListener("click", () => selectGroup(group));
    container.appendChild(button);
  });
}

function selectGroup(group) {
  app.group = group;
  document.querySelector("#group-kind").textContent = group.parties.length > 1 ? "Coalizione" : "Lista singola";
  document.querySelector("#group-title").textContent = group.name;
  document.querySelector("#group-summary").textContent = group.summary;

  const ideas = document.querySelector("#group-ideas");
  ideas.innerHTML = group.ideas.map(idea => `<li>${idea}</li>`).join("");

  const partyList = document.querySelector("#party-list");
  partyList.innerHTML = "";
  group.parties.forEach(party => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "party-choice";
    button.innerHTML = `<span>${party.name}</span><span aria-hidden="true">→</span>`;
    button.addEventListener("click", () => selectParty(party));
    partyList.appendChild(button);
  });

  document.querySelector("#lists-heading").textContent = group.parties.length > 1 ? "Le liste dentro" : "I candidati";
  showView("group");
}

function selectParty(party) {
  app.party = party;
  app.candidateIndex = 0;
  app.candidateMode = "ordinary";
  document.querySelector("#candidate-group").textContent = app.group.name;
  document.querySelector("#candidates-title").textContent = party.name;
  setCandidateMode("ordinary");
  showView("candidates");
}

function setCandidateMode(mode) {
  app.candidateMode = mode;
  app.candidateIndex = 0;

  document.querySelector("#ordinary-tab").classList.toggle("is-active", mode === "ordinary");
  document.querySelector("#ordinary-tab").setAttribute("aria-selected", String(mode === "ordinary"));
  document.querySelector("#bonus-tab").classList.toggle("is-active", mode === "bonus");
  document.querySelector("#bonus-tab").setAttribute("aria-selected", String(mode === "bonus"));
  renderCandidate();
}

function renderCandidate() {
  const card = document.querySelector("#candidate-card");
  const controls = document.querySelector("#candidate-controls");

  if (app.candidateMode === "bonus") {
    card.className = "candidate-card empty-card";
    card.innerHTML = `
      <div>
        <div class="empty-icon" aria-hidden="true">＋</div>
        <h2>Nel 2022 questa lista non esisteva</h2>
        <p>Con lo Stabilicum qui compariranno i candidati che entrano solo se la coalizione ottiene il premio.</p>
        <p class="source-note">Non inventiamo nomi: li aggiungeremo quando saranno ufficiali.</p>
      </div>`;
    controls.classList.add("is-hidden");
    return;
  }

  const candidates = app.party.candidates;
  const candidate = candidates[app.candidateIndex];
  card.className = "candidate-card";
  card.innerHTML = `
    <div class="candidate-top">
      <div class="avatar" aria-hidden="true">${initials(candidate.name)}</div>
      <div>
        <p class="candidate-position">Numero ${app.candidateIndex + 1} in lista</p>
        <h2 class="candidate-name">${candidate.name}</h2>
      </div>
    </div>
    <p class="candidate-meta">${candidate.birth}</p>
    <div class="candidate-about">
      <h3>Cosa ha fatto</h3>
      <p>${candidate.about}</p>
    </div>
    <p class="source-note">Dati anagrafici: manifesto ufficiale Camera 2022. Profilo sintetico da verificare prima della pubblicazione.</p>`;

  controls.classList.remove("is-hidden");
  document.querySelector("#candidate-count").textContent = `${app.candidateIndex + 1} di ${candidates.length}`;
  document.querySelector("#previous-candidate").disabled = app.candidateIndex === 0;
  document.querySelector("#next-candidate").disabled = app.candidateIndex === candidates.length - 1;
}

function moveCandidate(direction) {
  const next = app.candidateIndex + direction;
  if (next < 0 || next >= app.party.candidates.length) return;
  app.candidateIndex = next;
  renderCandidate();
}

function restart() {
  app.history = [];
  app.group = null;
  app.party = null;
  app.candidateIndex = 0;
  document.querySelector("#comune").value = "";
  showView("home", { remember: false });
  setTimeout(() => document.querySelector("#comune").focus(), 100);
}

document.querySelector("#location-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#comune");
  const error = document.querySelector("#location-error");
  const normalized = input.value.trim().toLocaleLowerCase("it");

  if (normalized !== "padova") {
    error.textContent = "Per questo test scrivi Padova.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  error.textContent = "";
  input.removeAttribute("aria-invalid");
  showView("ballot");
});

document.querySelector("#show-groups").addEventListener("click", () => {
  renderGroups();
  showView("groups");
});

document.querySelector("#ordinary-tab").addEventListener("click", () => setCandidateMode("ordinary"));
document.querySelector("#bonus-tab").addEventListener("click", () => setCandidateMode("bonus"));
document.querySelector("#previous-candidate").addEventListener("click", () => moveCandidate(-1));
document.querySelector("#next-candidate").addEventListener("click", () => moveCandidate(1));
document.querySelector("#show-summary").addEventListener("click", () => showView("summary"));
document.querySelector("#restart-button").addEventListener("click", restart);
backButton.addEventListener("click", goBack);
document.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); restart(); });

document.querySelector("#help-button").addEventListener("click", () => lawDialog.showModal());
document.querySelectorAll("[data-open-law]").forEach(button => button.addEventListener("click", () => lawDialog.showModal()));
document.querySelector("#close-dialog").addEventListener("click", () => lawDialog.close());
lawDialog.addEventListener("click", event => {
  if (event.target === lawDialog) lawDialog.close();
});

let touchStart = null;
document.querySelector("#candidate-card").addEventListener("touchstart", event => {
  touchStart = event.changedTouches[0].clientX;
}, { passive: true });
document.querySelector("#candidate-card").addEventListener("touchend", event => {
  if (touchStart === null || app.candidateMode !== "ordinary") return;
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 55) moveCandidate(distance < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });

loadData().catch(() => {
  document.querySelector("#location-error").textContent = "Il prototipo non riesce a caricare i dati. Riprova tra poco.";
  document.querySelector("#location-form button").disabled = true;
});
