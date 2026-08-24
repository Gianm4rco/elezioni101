const state = {
  data: null,
  view: "home",
  history: [],
  hasPlace: false,
  group: null,
  party: null,
  candidateIndex: 0,
  directoryFilter: "all"
};

const views = {
  home: document.querySelector("#home-view"),
  guide: document.querySelector("#guide-view"),
  hub: document.querySelector("#hub-view"),
  groups: document.querySelector("#groups-view"),
  group: document.querySelector("#group-view"),
  directory: document.querySelector("#directory-view"),
  candidate: document.querySelector("#candidate-view"),
  law: document.querySelector("#law-view")
};

const backButton = document.querySelector("#back-button");
const bottomNav = document.querySelector("#bottom-nav");
const main = document.querySelector("#contenuto");
const menuPanel = document.querySelector("#menu-panel");
const menuOverlay = document.querySelector("#menu-overlay");
const menuButton = document.querySelector("#menu-button");

function normalize(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function showView(name, { remember = true } = {}) {
  if (!views[name]) return;
  if (!state.hasPlace && !["home", "law"].includes(name)) name = "home";
  if (remember && state.view !== name) state.history.push(state.view);
  state.view = name;

  Object.entries(views).forEach(([key, element]) => element.classList.toggle("is-active", key === name));
  backButton.classList.toggle("is-hidden", ["home", "hub"].includes(name));
  bottomNav.classList.toggle("is-hidden", !state.hasPlace || ["home", "guide"].includes(name));

  const navSection = name === "group" ? "groups" : name === "candidate" ? "directory" : name;
  bottomNav.querySelectorAll("button").forEach(button => button.classList.toggle("is-active", button.dataset.nav === navSection));

  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
  main.focus({ preventScroll: true });
}

function goBack() {
  showView(state.history.pop() || (state.hasPlace ? "hub" : "home"), { remember: false });
}

function navigate(name) {
  if (!state.hasPlace && !["home", "law"].includes(name)) {
    showView("home");
    return;
  }
  if (name === "groups") renderGroups();
  if (name === "directory") renderDirectory();
  showView(name);
}

function setPlace({ showGuide = true } = {}) {
  state.hasPlace = true;
  localStorage.setItem("elezioni101_place", "Padova");
  renderHub();
  renderGroups();
  renderFilters();
  if (showGuide && !localStorage.getItem("elezioni101_intro_seen")) showView("guide");
  else showView("hub");
}

function clearPlace() {
  localStorage.removeItem("elezioni101_place");
  state.hasPlace = false;
  state.history = [];
  document.querySelector("#comune").value = "";
  showView("home", { remember: false });
  setTimeout(() => document.querySelector("#comune").focus(), 80);
}

function openMenu() {
  menuOverlay.hidden = false;
  menuPanel.classList.add("is-open");
  menuPanel.setAttribute("aria-hidden", "false");
  menuButton.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  document.querySelector("#close-menu").focus();
}

function closeMenu() {
  menuOverlay.hidden = true;
  menuPanel.classList.remove("is-open");
  menuPanel.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

async function loadData() {
  const response = await fetch("data/padova-2022.json");
  if (!response.ok) throw new Error("Dati non disponibili");
  state.data = await response.json();
}

function partyLogo(party) {
  return party.logo || "../referendum2026/images/logo.png";
}

function candidateImage(candidate, party) {
  return candidate.photo || partyLogo(party);
}

function attachImageFallback(image, party, container) {
  image.addEventListener("error", () => {
    if (image.dataset.fallback === "true") return;
    image.dataset.fallback = "true";
    image.src = partyLogo(party);
    if (container) container.classList.add("is-logo");
  });
}

function allCandidates() {
  return state.data.groups.flatMap(group => group.parties.flatMap(party => party.candidates.map((candidate, index) => ({
    candidate,
    party,
    group,
    index
  }))));
}

function renderHub() {
  const stack = document.querySelector("#portrait-stack");
  const featured = state.data.groups.map(group => ({ group, party: group.parties[0], candidate: group.parties[0].candidates[0] }));
  stack.innerHTML = featured.map(({ candidate, party }) => `<img src="${candidateImage(candidate, party)}" alt="${candidate.name}" title="${candidate.name}">`).join("");
  stack.querySelectorAll("img").forEach((image, index) => attachImageFallback(image, featured[index].party));
}

function logoMarkup(party, className = "") {
  return `<img class="${className}" src="${partyLogo(party)}" alt="Simbolo ${party.name}">`;
}

function renderGroups() {
  const list = document.querySelector("#group-list");
  list.innerHTML = "";
  state.data.groups.forEach(group => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "coalition-card";
    button.style.setProperty("--group", group.color);
    button.innerHTML = `<span><small>${group.parties.length > 1 ? `${group.parties.length} liste insieme` : "Lista singola"}</small><strong>${group.name}</strong><span class="mini-logos">${group.parties.map(party => logoMarkup(party)).join("")}</span></span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
    button.addEventListener("click", () => selectGroup(group));
    list.appendChild(button);
  });
}

function selectGroup(group) {
  state.group = group;
  const hero = document.querySelector("#group-hero");
  hero.style.setProperty("--group", group.color);
  document.querySelector("#group-kind").textContent = group.parties.length > 1 ? "Coalizione" : "Lista singola";
  document.querySelector("#group-title").textContent = group.name;
  document.querySelector("#group-logo-row").innerHTML = group.parties.map(party => logoMarkup(party)).join("");
  document.querySelector("#group-summary").textContent = group.summary;
  document.querySelector("#group-ideas").innerHTML = group.ideas.map(idea => `<li>${idea}</li>`).join("");
  document.querySelector("#lists-heading").textContent = group.parties.length > 1 ? "Scegli una lista" : "Vedi i candidati";

  const list = document.querySelector("#party-list");
  list.innerHTML = "";
  group.parties.forEach(party => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "party-button";
    button.innerHTML = `${logoMarkup(party, "party-logo")}<span><strong>${party.name}</strong><small>${party.candidates.length} candidati nell’esempio</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>`;
    button.addEventListener("click", () => openCandidate(group, party, 0));
    list.appendChild(button);
  });
  showView("group");
}

function renderFilters() {
  const filters = document.querySelector("#candidate-filters");
  const options = [{ id: "all", name: "Tutti" }, ...state.data.groups.map(group => ({ id: group.id, name: group.name }))];
  filters.innerHTML = options.map(option => `<button type="button" data-filter="${option.id}" class="${option.id === state.directoryFilter ? "is-active" : ""}">${option.name}</button>`).join("");
  filters.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    state.directoryFilter = button.dataset.filter;
    renderFilters();
    renderDirectory();
  }));
}

function renderDirectory() {
  const query = normalize(document.querySelector("#candidate-search").value.trim());
  const entries = allCandidates().filter(entry => {
    const matchesGroup = state.directoryFilter === "all" || entry.group.id === state.directoryFilter;
    const haystack = normalize(`${entry.candidate.name} ${entry.party.name} ${entry.group.name}`);
    return matchesGroup && (!query || haystack.includes(query));
  });

  document.querySelector("#result-count").textContent = `${entries.length} ${entries.length === 1 ? "candidato" : "candidati"}`;
  const directory = document.querySelector("#candidate-directory");
  directory.innerHTML = "";

  entries.forEach(entry => {
    const { candidate, party, group, index } = entry;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "candidate-row";
    button.innerHTML = `<span class="candidate-thumb"><img src="${candidateImage(candidate, party)}" alt="${candidate.photo ? `Foto di ${candidate.name}` : `Simbolo ${party.name}; foto non disponibile`}"><img class="party-badge" src="${partyLogo(party)}" alt=""></span><span><strong>${candidate.name}</strong><small>${party.name} · n. ${index + 1}</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>`;
    attachImageFallback(button.querySelector(".candidate-thumb > img:first-child"), party);
    button.addEventListener("click", () => openCandidate(group, party, index));
    directory.appendChild(button);
  });

  if (!entries.length) directory.innerHTML = `<p class="prototype-strip">Nessun candidato trovato. Prova solo con il cognome o con il nome della lista.</p>`;
}

function openCandidate(group, party, index) {
  state.group = group;
  state.party = party;
  state.candidateIndex = index;
  renderCandidate();
  showView("candidate");
}

function renderCandidate() {
  const candidate = state.party.candidates[state.candidateIndex];
  const hasPhoto = Boolean(candidate.photo);
  const source = hasPhoto && candidate.photoSource
    ? `<p class="photo-credit">Foto: ${candidate.photoCredit || "Wikimedia Commons"} · <a href="${candidate.photoSource}" target="_blank" rel="noreferrer">fonte e licenza ↗</a></p>`
    : `<p class="photo-credit">Foto non ancora reperita con licenza verificabile: viene mostrato il simbolo della lista.</p>`;

  const profile = document.querySelector("#candidate-profile");
  profile.innerHTML = `
    <div class="profile-photo ${hasPhoto ? "" : "is-logo"}">
      <img src="${candidateImage(candidate, state.party)}" alt="${hasPhoto ? `Foto di ${candidate.name}` : `Simbolo ${state.party.name}`}">
      <span class="profile-rank">Numero ${state.candidateIndex + 1} in lista</span>
      <span class="profile-party">${logoMarkup(state.party)}</span>
    </div>
    <div class="profile-body">
      <p class="party-name">${state.party.name} · ${state.group.name}</p>
      <h1 id="candidate-name">${candidate.name}</h1>
      <p class="profile-meta">${candidate.birth}</p>
      <div class="profile-about"><h2>Cosa ha fatto</h2><p>${candidate.about}</p></div>
      ${source}
    </div>`;

  attachImageFallback(profile.querySelector(".profile-photo > img"), state.party, profile.querySelector(".profile-photo"));
  document.querySelector("#candidate-count").textContent = `${state.candidateIndex + 1} di ${state.party.candidates.length}`;
  document.querySelector("#previous-candidate").disabled = state.candidateIndex === 0;
  document.querySelector("#next-candidate").disabled = state.candidateIndex === state.party.candidates.length - 1;
}

function moveCandidate(direction) {
  const next = state.candidateIndex + direction;
  if (next < 0 || next >= state.party.candidates.length) return;
  state.candidateIndex = next;
  renderCandidate();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector("#location-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#comune");
  const error = document.querySelector("#location-error");
  if (normalize(input.value.trim()) !== "padova") {
    error.textContent = "Per questo test scrivi Padova.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  error.textContent = "";
  input.removeAttribute("aria-invalid");
  setPlace({ showGuide: true });
});

document.querySelector("#finish-guide").addEventListener("click", () => {
  localStorage.setItem("elezioni101_intro_seen", "true");
  showView("hub");
});
document.querySelector("#skip-to-candidates").addEventListener("click", () => {
  localStorage.setItem("elezioni101_intro_seen", "true");
  renderDirectory();
  showView("directory");
});
document.querySelector("#resume-button").addEventListener("click", () => setPlace({ showGuide: false }));
document.querySelector("#candidate-search").addEventListener("input", renderDirectory);
document.querySelector("#previous-candidate").addEventListener("click", () => moveCandidate(-1));
document.querySelector("#next-candidate").addEventListener("click", () => moveCandidate(1));
document.querySelector("#hub-change-place").addEventListener("click", clearPlace);
document.querySelector("#change-place").addEventListener("click", clearPlace);
backButton.addEventListener("click", goBack);
menuButton.addEventListener("click", openMenu);
document.querySelector("#close-menu").addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
document.querySelector(".brand").addEventListener("click", event => {
  event.preventDefault();
  showView(state.hasPlace ? "hub" : "home");
});

let touchStart = null;
document.querySelector("#candidate-profile").addEventListener("touchstart", event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
document.querySelector("#candidate-profile").addEventListener("touchend", event => {
  if (touchStart === null) return;
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 55) moveCandidate(distance < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });

const startButton = document.querySelector("#location-form button");
startButton.disabled = true;
loadData()
  .then(() => {
    startButton.disabled = false;
    renderFilters();
    if (localStorage.getItem("elezioni101_place") === "Padova") document.querySelector("#resume-button").classList.remove("is-hidden");
  })
  .catch(() => {
    document.querySelector("#location-error").textContent = "I dati non si caricano. Riprova tra poco.";
  });
