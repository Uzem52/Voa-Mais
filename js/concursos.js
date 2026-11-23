import { buscarConcursos } from "../services/concursosService.js";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");
const grid = document.querySelector("#contest-grid");
const loading = document.querySelector("#contest-loading");
const empty = document.querySelector("#contest-empty");
const error = document.querySelector("#contest-error");
const count = document.querySelector("#results-count");
const filters = {
  search: document.querySelector("#filter-search"),
  state: document.querySelector("#filter-state"),
  city: document.querySelector("#filter-city"),
  education: document.querySelector("#filter-education"),
  status: document.querySelector("#filter-status"),
  area: document.querySelector("#filter-area"),
  salary: document.querySelector("#filter-salary"),
  sort: document.querySelector("#filter-sort"),
  openOnly: document.querySelector("#filter-open"),
  favoritesOnly: document.querySelector("#filter-favorites")
};
let contests = [];
let favorites = loadFavorites();

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem("voamais:concursos-favoritos") || "[]"));
  } catch (storageError) {
    console.error("Não foi possível carregar os favoritos de concursos.", storageError);
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("voamais:concursos-favoritos", JSON.stringify([...favorites]));
  } catch (storageError) {
    console.error("Não foi possível salvar os favoritos de concursos.", storageError);
  }
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function numericSalary(value) {
  const parsed = Number(String(value).replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function filteredContests() {
  const query = normalize(filters.search.value);
  const salaryRange = filters.salary.value;
  const result = contests.filter((contest) => {
    const text = normalize(`${contest.orgao} ${contest.concurso} ${contest.cargos.join(" ")}`);
    const salary = numericSalary(contest.salario);
    const matchesSalary = !salaryRange
      || (salaryRange === "0-2000" && salary <= 2000)
      || (salaryRange === "2000-5000" && salary > 2000 && salary <= 5000)
      || (salaryRange === "5000+" && salary > 5000);
    return (!query || text.includes(query))
      && (!filters.state.value || contest.estado === filters.state.value)
      && (!filters.city.value || normalize(contest.cidade).includes(normalize(filters.city.value)))
      && (!filters.education.value || contest.escolaridades.includes(filters.education.value))
      && (!filters.status.value || contest.status === filters.status.value)
      && (!filters.area.value || contest.area.includes(filters.area.value))
      && (!filters.openOnly.checked || contest.status === "Inscrições abertas")
      && (!filters.favoritesOnly.checked || favorites.has(contest.id))
      && matchesSalary;
  });

  return result.sort((first, second) => {
    if (filters.sort.value === "salary") return numericSalary(second.salario) - numericSalary(first.salario);
    if (filters.sort.value === "deadline") return dateValue(first.inscricaoFim) - dateValue(second.inscricaoFim);
    return dateValue(second.atualizadoEm) - dateValue(first.atualizadoEm);
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function daysUntil(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Math.ceil((new Date(`${value}T23:59:59`) - new Date()) / 86400000);
}

function deadlineNotice(contest) {
  const days = daysUntil(contest.inscricaoFim);
  return days !== null && days >= 0 && days <= 7
    ? `<span class="deadline-alert">Inscrições encerram em ${days === 0 ? "menos de 1 dia" : `${days} dias`}</span>`
    : "";
}

function contestCard(contest) {
  const favorite = favorites.has(contest.id);
  const statusClass = normalize(contest.status).replace(/\s+/g, "-");
  return `<article class="contest-card"><div class="contest-card-top"><span class="contest-status status-${statusClass}">${escapeHtml(contest.status)}</span><button class="favorite-button${favorite ? " is-favorite" : ""}" type="button" data-favorite="${escapeHtml(contest.id)}" aria-pressed="${favorite}" aria-label="${favorite ? "Remover dos favoritos" : "Favoritar concurso"}">${favorite ? "★" : "☆"}</button></div><p class="contest-organization">${escapeHtml(contest.orgao)}</p><h3>${escapeHtml(contest.concurso)}</h3>${deadlineNotice(contest)}<dl class="contest-details"><div><dt>Cidade/Estado</dt><dd>${escapeHtml(contest.cidade)} · ${escapeHtml(contest.estado)}</dd></div><div><dt>Cargos</dt><dd>${escapeHtml(contest.cargos.join(", "))}</dd></div><div><dt>Escolaridade</dt><dd>${escapeHtml(contest.escolaridades.join(", "))}</dd></div><div><dt>Vagas</dt><dd>${escapeHtml(contest.vagas)}</dd></div><div><dt>Salário</dt><dd>${escapeHtml(contest.salario)}</dd></div><div><dt>Taxa</dt><dd>${escapeHtml(contest.taxa)}</dd></div><div><dt>Inscrições</dt><dd>${formatDate(contest.inscricaoInicio)} até ${formatDate(contest.inscricaoFim)}</dd></div><div><dt>Prova</dt><dd>${formatDate(contest.prova)}</dd></div><div><dt>Banca</dt><dd>${escapeHtml(contest.banca)}</dd></div></dl><div class="contest-footer"><small>Última atualização: ${formatDate(contest.atualizadoEm)}<br><a href="${escapeHtml(contest.fonteUrl)}" target="_blank" rel="noopener noreferrer">Fonte oficial</a></small><div class="contest-actions"><button class="button contest-details-button" type="button" data-details="${escapeHtml(contest.id)}">Ver detalhes</button><a class="button button-primary contest-action" href="${escapeHtml(contest.editalUrl)}" target="_blank" rel="noopener noreferrer">Ver edital oficial <svg class="icon"><use href="#i-arrow"/></svg></a></div></div></article>`;
}

function showDetails(id) {
  const contest = contests.find((item) => item.id === id);
  if (!contest) return;
  const modal = document.querySelector("#contest-modal");
  modal.querySelector("#modal-title").textContent = contest.concurso;
  modal.querySelector("#modal-content").innerHTML = `<p><strong>Órgão:</strong> ${escapeHtml(contest.orgao)}</p><p><strong>Cargos:</strong> ${escapeHtml(contest.cargos.join(", "))}</p><p><strong>Escolaridades:</strong> ${escapeHtml(contest.escolaridades.join(", "))}</p><p><strong>Área:</strong> ${escapeHtml(contest.area.join(", "))}</p><p><strong>Fonte:</strong> <a href="${escapeHtml(contest.fonteUrl)}" target="_blank" rel="noopener noreferrer">site oficial do órgão</a></p>`;
  modal.hidden = false;
  modal.querySelector("#modal-close").focus();
}

function render() {
  const visible = filteredContests();
  grid.innerHTML = visible.map(contestCard).join("");
  count.textContent = `${visible.length} ${visible.length === 1 ? "resultado" : "resultados"}`;
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  grid.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.favorite;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    saveFavorites();
    render();
  }));
  grid.querySelectorAll("[data-details]").forEach((button) => button.addEventListener("click", () => showDetails(button.dataset.details)));
}

function clearFilters() {
  Object.values(filters).forEach((control) => {
    if (control.type === "checkbox") control.checked = false;
    else if (control.id === "filter-sort") control.value = "recent";
    else control.value = "";
  });
  render();
}

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
  navigation.classList.toggle("is-open", !open);
  menuButton.innerHTML = `<svg class="icon"><use href="#${open ? "i-menu" : "i-close"}"/></svg>`;
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a") && navigation.classList.contains("is-open")) navigation.classList.remove("is-open");
});
Object.values(filters).forEach((control) => control.addEventListener("input", render));
document.querySelector("#clear-filters").addEventListener("click", clearFilters);
document.querySelector("#modal-close").addEventListener("click", () => { document.querySelector("#contest-modal").hidden = true; });
document.querySelector("#current-year").textContent = new Date().getFullYear();

try {
  contests = await buscarConcursos();
  loading.hidden = true;
  render();
} catch (loadError) {
  console.error("Não foi possível carregar os concursos.", loadError);
  loading.hidden = true;
  error.hidden = false;
}
