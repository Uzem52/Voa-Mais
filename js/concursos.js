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
let defaultOpenOnly = false;

// Ordem em que os grupos aparecem: abertos primeiro, encerrados por último.
const STATUS_ORDER = { "Inscrições abertas": 0, "Em breve": 1, "Encerradas": 2 };
const STATUS_LABEL = { "Encerradas": "Inscrições encerradas" };

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

// ---------- Datas e status (calculados a cada visita) ----------
function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Quantos dias faltam para a data (0 = hoje, negativo = já passou). null = data inválida.
function daysUntil(value) {
  if (!isIsoDate(value)) return null;
  return Math.round((new Date(`${value}T00:00:00`) - todayStart()) / 86400000);
}

// O status vem das datas de inscrição, não do texto cadastrado.
function computeStatus(contest) {
  const toStart = daysUntil(contest.inscricaoInicio);
  const toEnd = daysUntil(contest.inscricaoFim);
  if (toEnd !== null && toEnd < 0) return "Encerradas";
  if (toStart !== null && toStart > 0) return "Em breve";
  if (toEnd !== null) return "Inscrições abertas";
  return contest.status; // sem datas suficientes: mantém o status cadastrado
}

function statusRank(contest) {
  return STATUS_ORDER[contest.status] ?? 1;
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
    const byStatus = statusRank(first) - statusRank(second);
    if (byStatus !== 0) return byStatus;
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
  if (!isIsoDate(value)) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function registrationText(contest) {
  const hasStart = isIsoDate(contest.inscricaoInicio);
  const hasEnd = isIsoDate(contest.inscricaoFim);
  if (hasStart && hasEnd) return `${formatDate(contest.inscricaoInicio)} até ${formatDate(contest.inscricaoFim)}`;
  if (hasEnd) return `Até ${formatDate(contest.inscricaoFim)}`;
  if (hasStart) return `A partir de ${formatDate(contest.inscricaoInicio)}`;
  return "Não informado";
}

function deadlineNotice(contest) {
  if (contest.status === "Em breve") {
    const days = daysUntil(contest.inscricaoInicio);
    if (days === null) return "";
    return `<span class="deadline-info">Inscrições abrem ${days === 1 ? "amanhã" : `em ${days} dias`}</span>`;
  }

  if (contest.status === "Inscrições abertas") {
    const days = daysUntil(contest.inscricaoFim);
    if (days === null) return "";
    if (days === 0) return `<span class="deadline-alert">Último dia para se inscrever!</span>`;
    const text = days === 1 ? "Falta 1 dia para o fim das inscrições" : `Faltam ${days} dias para o fim das inscrições`;
    return `<span class="${days <= 7 ? "deadline-alert" : "deadline-info"}">${text}</span>`;
  }

  if (contest.status === "Encerradas") {
    const days = daysUntil(contest.prova);
    if (days === null || days < 0) return "";
    const when = days === 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`;
    return `<span class="deadline-info">Prova ${when}</span>`;
  }

  return "";
}

function contestCard(contest) {
  const favorite = favorites.has(contest.id);
  const statusClass = normalize(contest.status).replace(/\s+/g, "-");
  const statusText = STATUS_LABEL[contest.status] || contest.status;
  const closedClass = contest.status === "Encerradas" ? " is-closed" : "";
  return `<article class="contest-card${closedClass}"><div class="contest-card-top"><span class="contest-status status-${statusClass}">${escapeHtml(statusText)}</span><button class="favorite-button${favorite ? " is-favorite" : ""}" type="button" data-favorite="${escapeHtml(contest.id)}" aria-pressed="${favorite}" aria-label="${favorite ? "Remover dos favoritos" : "Favoritar concurso"}">${favorite ? "★" : "☆"}</button></div><p class="contest-organization">${escapeHtml(contest.orgao)}</p><h3>${escapeHtml(contest.concurso)}</h3>${deadlineNotice(contest)}<dl class="contest-details"><div><dt>Cidade/Estado</dt><dd>${escapeHtml(contest.cidade)} · ${escapeHtml(contest.estado)}</dd></div><div><dt>Cargos</dt><dd>${escapeHtml(contest.cargos.join(", "))}</dd></div><div><dt>Escolaridade</dt><dd>${escapeHtml(contest.escolaridades.join(", "))}</dd></div><div><dt>Vagas</dt><dd>${escapeHtml(contest.vagas)}</dd></div><div><dt>Salário</dt><dd>${escapeHtml(contest.salario)}</dd></div><div><dt>Taxa</dt><dd>${escapeHtml(contest.taxa)}</dd></div><div><dt>Inscrições</dt><dd>${registrationText(contest)}</dd></div><div><dt>Prova</dt><dd>${formatDate(contest.prova)}</dd></div><div><dt>Banca</dt><dd>${escapeHtml(contest.banca)}</dd></div></dl><div class="contest-footer"><small>Última atualização: ${formatDate(contest.atualizadoEm)}<br><a href="${escapeHtml(contest.fonteUrl)}" target="_blank" rel="noopener noreferrer">Fonte oficial</a></small><div class="contest-actions"><button class="button contest-details-button" type="button" data-details="${escapeHtml(contest.id)}">Ver detalhes</button><a class="button button-primary contest-action" href="${escapeHtml(contest.editalUrl)}" target="_blank" rel="noopener noreferrer">Ver edital oficial <svg class="icon"><use href="#i-arrow"/></svg></a></div></div></article>`;
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
    if (control === filters.openOnly) control.checked = defaultOpenOnly;
    else if (control.type === "checkbox") control.checked = false;
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
  const loaded = await buscarConcursos();
  contests = loaded.map((contest) => ({ ...contest, status: computeStatus(contest) }));
  // Se houver concursos abertos, a página já abre mostrando só eles.
  defaultOpenOnly = contests.some((contest) => contest.status === "Inscrições abertas");
  filters.openOnly.checked = defaultOpenOnly;
  loading.hidden = true;
  render();
} catch (loadError) {
  console.error("Não foi possível carregar os concursos.", loadError);
  loading.hidden = true;
  error.hidden = false;
}
