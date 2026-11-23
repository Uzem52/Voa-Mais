import { getOpportunities, setOpportunitySearch } from "./opportunities.js";

const form = document.querySelector("#search-form");
const input = document.querySelector("#site-search");
const dropdown = document.querySelector("#search-results");
const searchTrigger = document.querySelector(".search-trigger");
const searchSection = document.querySelector("#busca");
const siteResults = document.querySelector("#site-search-results");
const searchedTerm = document.querySelector("#searched-term");
const clearSearch = document.querySelector("#clear-search");
const opportunitySelect = document.querySelector("#opportunity-filter");

const categories = {
  curso: "cursos", cursos: "cursos", bolsa: "bolsas", bolsas: "bolsas",
  enem: "enem", vestibular: "enem", vestibulares: "enem", if: "ifs",
  ifs: "ifs", trabalho: "trabalho", emprego: "trabalho", oportunidades: "todas"
};

const pageIndex = [
  { title: "Técnica Pomodoro", description: "Cronômetro de foco de 25 minutos, intervalo de 5 minutos e dicas para estudar com ritmo.", category: "Métodos de estudo", href: "pomodoro.html", terms: "pomodoro foco pausa cronometro estudar produtividade" },
  { title: "Revisão espaçada", description: "Aprenda a organizar revisões para lembrar melhor do conteúdo ao longo do tempo.", category: "Métodos de estudo", href: "revisao-espacada.html", terms: "revisao revisão espaçada memória estudo" },
  { title: "Mapas mentais", description: "Organize ideias de forma visual e conecte os conteúdos dos seus estudos.", category: "Métodos de estudo", href: "mapas-mentais.html", terms: "mapas mentais organização visual estudo" },
  { title: "Cronograma de estudos", description: "Monte uma rotina de estudos realista e acompanhe seus próximos passos.", category: "Métodos de estudo", href: "cronograma.html", terms: "cronograma planejamento rotina estudo organização" },
  { title: "Flashcards e ENEM", description: "Use perguntas e respostas para revisar conteúdos e se preparar para o ENEM.", category: "ENEM e vestibulares", href: "flashcards.html", terms: "flashcards enem vestibular revisão prova" },
  { title: "Apps e sites para estudar", description: "Conheça ferramentas digitais úteis para aprender e organizar sua rotina.", category: "Ferramentas", href: "apps-estudo.html", terms: "apps sites ferramentas celular tecnologia estudar" },
  { title: "Instituto ProA", description: "Conheça os programas, projetos e oportunidades do Instituto ProA.", category: "Instituições", href: "https://www.proa.org.br/", terms: "proa instituto formação jovem trabalho tecnologia programa", external: true },
  { title: "Cursos e oportunidades", description: "Explore cursos, bolsas, IFs, ENEM, trabalho e outras oportunidades no VoaMais.", category: "Categorias", href: "#categorias", terms: "cursos bolsas enem vestibular concursos concurso instituto federal ifs trabalho emprego oportunidades tecnologia" },
  { title: "Seu Plano Voa Mais", description: "Monte uma orientação personalizada para seus estudos, qualificação e entrada no mercado.", category: "Orientação", href: "#para-voce", terms: "plano carreira perfil orientação objetivo formação profissão" },
  { title: "Privacidade", description: "Entenda como funcionam os dados e preferências nesta versão do VoaMais.", category: "Informações", href: "pages/privacidade.html", terms: "privacidade dados" },
  { title: "Termos de uso", description: "Consulte os combinados para usar o conteúdo e os links do VoaMais.", category: "Informações", href: "pages/termos.html", terms: "termos uso regras" }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function normalize(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function getSiteIndex() {
  const opportunityEntries = getOpportunities().map((item) => ({
    title: item.title,
    description: `${item.institution}. ${item.description}`,
    category: item.type,
    href: item.url,
    terms: [item.title, item.type, item.institution, item.location, item.description, ...item.tags].join(" "),
    external: true
  }));
  return [...pageIndex, ...opportunityEntries];
}

function searchSite(query) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return getSiteIndex().filter((item) => {
    const searchable = normalize(`${item.title} ${item.description} ${item.category} ${item.terms}`);
    return terms.every((term) => searchable.includes(term) || (
      term === "programacao" && /tecnologia|desenvolvimento|front.end|informatica/.test(searchable)
    ));
  });
}

function resultMarkup(item) {
  const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<article class="site-search-result"><div><span class="search-result-category">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div><a class="text-link" href="${escapeHtml(item.href)}"${target}>Acessar <svg class="icon"><use href="#i-arrow"/></svg></a></article>`;
}

function renderSiteResults(query) {
  const matches = searchSite(query);
  searchedTerm.textContent = query;
  searchSection.hidden = false;
  siteResults.innerHTML = matches.length
    ? matches.map(resultMarkup).join("")
    : `<div class="search-empty-state"><h3>Não encontramos resultados para sua busca.</h3><p>Tente pesquisar por outro termo, como cursos, bolsas, ENEM ou tecnologia.</p></div>`;
  searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showDropdown(query) {
  if (!query.trim()) {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
    return;
  }
  const matches = searchSite(query).slice(0, 6);
  dropdown.innerHTML = matches.length
    ? matches.map((item, index) => `<button class="search-result" type="button" role="option" data-site-result="${index}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.description)}</small></span><span aria-hidden="true">→</span></button>`).join("")
    : `<p class="search-empty">Pressione Enter para buscar no site.</p>`;
  dropdown.hidden = false;
}

function executeSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;
  setOpportunitySearch("");
  if (opportunitySelect) {
    const category = categories[normalize(trimmed)];
    opportunitySelect.value = category || "todas";
    opportunitySelect.dispatchEvent(new Event("change"));
  }
  renderSiteResults(trimmed);
  dropdown.hidden = true;
}

function focusSearch(event) {
  event.preventDefault();
  if (input.value.trim()) {
    executeSearch(input.value);
    return;
  }
  input.focus();
  input.scrollIntoView({ behavior: "smooth", block: "center" });
}

input.addEventListener("input", () => showDropdown(input.value));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  executeSearch(input.value);
});
searchTrigger.addEventListener("click", focusSearch);
clearSearch.addEventListener("click", () => {
  input.value = "";
  dropdown.hidden = true;
  searchSection.hidden = true;
  siteResults.innerHTML = "";
  input.focus();
  window.history.replaceState({}, "", "#busca");
});

dropdown.addEventListener("click", (event) => {
  const button = event.target.closest("[data-site-result]");
  if (!button) return;
  const matches = searchSite(input.value);
  const item = matches[Number(button.dataset.siteResult)];
  if (!item) return;
  if (item.external) window.open(item.href, "_blank", "noopener,noreferrer");
  else window.location.href = item.href;
});

document.addEventListener("click", (event) => {
  if (!form.contains(event.target)) dropdown.hidden = true;
});

document.querySelectorAll("[data-search]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.search;
    executeSearch(input.value);
  });
});

document.querySelectorAll("[data-category-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const category = link.dataset.categoryLink;
    if (categories[category]) {
      setOpportunitySearch("");
      opportunitySelect.value = categories[category];
      opportunitySelect.dispatchEvent(new Event("change"));
    }
  });
});

if (window.location.hash === "#busca") {
  window.setTimeout(() => input.focus(), 0);
}
