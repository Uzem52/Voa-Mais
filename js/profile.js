import { getOpportunities } from "./opportunities.js";
import { playSuccessSound } from "./sounds.js";

const dialog = document.querySelector("#profile-dialog");
const form = document.querySelector("#profile-form");
const resultArea = document.querySelector("#profile-results");
const steps = [...document.querySelectorAll(".profile-step")];
const progressLabel = document.querySelector("#profile-progress-label");
const progressBar = document.querySelector("#profile-progress-bar");
const backButton = document.querySelector("#profile-back");
const nextButton = document.querySelector("#profile-next");
const submitButton = document.querySelector("#profile-submit");
let currentStep = 1;

const labels = {
  age: { "14-17": "14 a 17 anos", "18-24": "18 a 24 anos", "25-34": "25 a 34 anos", "35-44": "35 a 44 anos", "45+": "45 anos ou mais" },
  education: { "fundamental-incompleto": "Ensino fundamental incompleto", "fundamental-completo": "Ensino fundamental completo", "medio-incompleto": "Ensino médio incompleto", "medio-completo": "Ensino médio completo", "superior-incompleto": "Ensino superior incompleto", "superior-completo": "Ensino superior completo" },
  interest: { tecnologia: "Tecnologia", administracao: "Administração", saude: "Saúde", educacao: "Educação", comunicacao: "Comunicação", design: "Design", engenharia: "Engenharia", direito: "Direito", financas: "Finanças", comercio: "Comércio", industria: "Indústria", outra: "Outra área", "nao-sei": "Ainda não sei" },
  time: { "30min": "Até 30 minutos por dia", "1h": "Cerca de 1 hora por dia", "2h": "Cerca de 2 horas por dia", "mais-2h": "Mais de 2 horas por dia", "fim-semana": "Apenas aos fins de semana" },
  access: { computer: "Computador e celular", phone: "Apenas celular", limited: "Pouco acesso à internet", none: "Acesso não constante" },
  free: { need: "Precisa ser gratuito", prefer: "Prefere opções gratuitas", any: "Gratuidade não é obrigatória" },
  status: { studying: "Está estudando", unemployed: "Está desempregado(a)", working: "Está trabalhando", "first-job": "Busca o primeiro emprego", "career-change": "Quer mudar de área", "self-employed": "Trabalha por conta própria", other: "Outra situação" }
};

const goalLabels = {
  "primeiro-emprego": "Primeiro emprego", "emprego-melhor": "Emprego melhor", curso: "Fazer um curso", faculdade: "Fazer faculdade",
  tecnico: "Curso técnico", "mudar-carreira": "Mudar de carreira", profissao: "Aprender uma profissão", renda: "Aumentar a renda",
  concurso: "Estudar para concurso", "nao-sei": "Ainda não sabe"
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function selectedValues(name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((field) => field.value);
}

function updateStep() {
  currentStep = Math.min(Math.max(currentStep, 1), steps.length);
  steps.forEach((step) => step.classList.toggle("is-active", Number(step.dataset.step) === currentStep));
  progressLabel.textContent = `Etapa ${currentStep} de ${steps.length}`;
  progressBar.style.width = `${(currentStep / steps.length) * 100}%`;
  backButton.disabled = currentStep === 1;
  nextButton.hidden = currentStep === steps.length;
  submitButton.hidden = currentStep !== steps.length;
  const activeStep = steps[currentStep - 1];
  activeStep.querySelector("input, select")?.focus({ preventScroll: true });
}

function validateStep() {
  const activeStep = steps[currentStep - 1];
  if (!activeStep) return false;
  if (currentStep === 2 && !selectedValues("goal").length) {
    activeStep.querySelector("input")?.setCustomValidity("Escolha pelo menos um objetivo.");
  }
  const valid = activeStep.reportValidity();
  activeStep.querySelectorAll("input").forEach((field) => field.setCustomValidity(""));
  return valid;
}

function getAnswers() {
  const data = new FormData(form);
  return {
    age: data.get("age"),
    education: data.get("education"),
    goals: selectedValues("goal"),
    interest: data.get("interest"),
    time: data.get("time"),
    access: data.get("access"),
    free: data.get("free"),
    status: data.get("status")
  };
}

function containsGoal(answers, values) {
  return values.some((value) => answers.goals.includes(value));
}

function opportunityFor(answers, tags, categories = []) {
  const normalizedTags = tags.map((tag) => tag.toLocaleLowerCase("pt-BR"));
  return getOpportunities().find((item) => {
    const text = [item.title, item.description, ...item.tags].join(" ").toLocaleLowerCase("pt-BR");
    const tagMatch = normalizedTags.some((tag) => text.includes(tag));
    const categoryMatch = !categories.length || categories.includes(item.category);
    return tagMatch && categoryMatch;
  });
}

function recommendationLink(item, fallbackLabel) {
  if (!item) return "";
  return `<a class="profile-plan-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(fallbackLabel)} <span aria-hidden="true">→</span></a>`;
}

const areaPlans = {
  tecnologia: {
    skills: "informática, Excel, lógica de programação, HTML, CSS e JavaScript básico",
    study: "curso gratuito de informática, programação básica, Front-End ou formação técnica em tecnologia",
    future: "Front-End, desenvolvimento web, suporte técnico ou análise de dados"
  },
  administracao: {
    skills: "Excel, organização, atendimento, comunicação profissional e ferramentas administrativas",
    study: "curso de administração, auxiliar administrativo, gestão ou formação técnica",
    future: "assistente administrativo, Recursos Humanos, financeiro ou analista administrativo"
  },
  saude: {
    skills: "comunicação, cuidado, organização, ética e fundamentos de saúde",
    study: "curso introdutório na área da saúde e, quando fizer sentido, formação técnica regulamentada",
    future: "formação técnica, graduação ou funções de apoio relacionadas à saúde"
  },
  educacao: {
    skills: "comunicação, leitura, planejamento, escuta e produção de materiais",
    study: "cursos de apoio educacional, licenciatura ou formação técnica compatível",
    future: "apoio escolar, projetos educacionais, licenciaturas ou gestão pedagógica"
  },
  comunicacao: {
    skills: "escrita, comunicação digital, atendimento, redes sociais e produção de conteúdo",
    study: "marketing digital, comunicação, produção de conteúdo e ferramentas para redes sociais",
    future: "marketing, social media, atendimento, produção de conteúdo ou comunicação institucional"
  },
  design: {
    skills: "composição visual, ferramentas digitais, criatividade e construção de portfólio",
    study: "design gráfico, ferramentas visuais, UX/UI introdutório e projetos práticos",
    future: "design gráfico, conteúdo visual, UX/UI ou comunicação visual"
  },
  engenharia: {
    skills: "matemática, raciocínio lógico, ferramentas digitais e resolução de problemas",
    study: "reforço de matemática, curso técnico e pesquisa sobre graduações da área",
    future: "formação técnica, engenharia ou funções de apoio técnico relacionadas"
  },
  direito: {
    skills: "leitura, escrita, argumentação, organização e interpretação de informações",
    study: "preparação para o ENEM, introdução ao direito e pesquisa sobre graduação",
    future: "graduação em Direito, apoio administrativo jurídico ou concursos compatíveis"
  },
  financas: {
    skills: "matemática financeira, Excel, organização, análise e planejamento",
    study: "educação financeira, Excel, contabilidade introdutória ou formação técnica",
    future: "assistente financeiro, contabilidade, bancos ou análise financeira"
  },
  comercio: {
    skills: "atendimento, vendas, comunicação, organização e ferramentas digitais",
    study: "vendas, atendimento ao cliente, comércio e empreendedorismo",
    future: "vendas, atendimento, comércio digital, liderança ou gestão"
  },
  industria: {
    skills: "segurança, organização, matemática, processos e ferramentas técnicas",
    study: "qualificação profissional, curso técnico e formação prática na indústria",
    future: "operação, manutenção, qualidade, logística ou formação técnica"
  },
  outra: {
    skills: "comunicação, organização, ferramentas digitais e uma habilidade inicial ligada à área escolhida",
    study: "curso introdutório para experimentar áreas diferentes antes de escolher uma formação maior",
    future: "uma especialização construída a partir das experiências e cursos que você testar"
  },
  "nao-sei": {
    skills: "informática, comunicação, organização e autoconhecimento profissional",
    study: "cursos curtos e gratuitos de áreas diferentes para experimentar possibilidades",
    future: "áreas de tecnologia, administração, comércio, comunicação ou formação técnica, conforme suas descobertas"
  }
};

function officialLink(href, label) {
  return `<a class="profile-plan-link" href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <span aria-hidden="true">→</span></a>`;
}

function buildPlan(answers) {
  const area = areaPlans[answers.interest] || areaPlans["nao-sei"];
  const isYoung = answers.age === "14-17";
  const needsFree = answers.free === "need";
  const limitedAccess = ["phone", "limited", "none"].includes(answers.access);
  const wantsWork = containsGoal(answers, ["primeiro-emprego", "emprego-melhor", "renda", "mudar-carreira", "profissao"]) || ["unemployed", "first-job", "career-change"].includes(answers.status);
  const wantsHigherEd = containsGoal(answers, ["faculdade", "tecnico", "concurso"]) || ["superior-incompleto", "superior-completo"].includes(answers.education);
  const basicEducation = ["fundamental-incompleto", "fundamental-completo", "medio-incompleto"].includes(answers.education);
  const tech = answers.interest === "tecnologia";
  const course = opportunityFor(answers, tech ? ["informática", "programação", "tecnologia"] : ["curso", "gratuito"]);
  const work = opportunityFor(answers, isYoung ? ["jovem aprendiz"] : ["estágio", "emprego", "trabalho"], ["trabalho"]);
  const courseLink = recommendationLink(course, "Encontrar cursos");
  const workLink = recommendationLink(work, "Ver oportunidades");
  const accessNote = limitedAccess ? " Priorize materiais leves e plataformas que funcionem pelo celular; quando possível, baixe conteúdos para estudar offline." : "";
  const freeNote = needsFree ? " Como você precisa de opções gratuitas, comece por plataformas abertas, bolsas e instituições públicas." : "";
  const interest = labels.interest[answers.interest] || labels.interest["nao-sei"];
  const objective = answers.goals[0] === "nao-sei" ? "explorar possibilidades sem pressa" : (goalLabels[answers.goals[0]] || "construir seu próximo passo");
  const profileSummary = basicEducation
    ? `Você está construindo sua base de formação e demonstrou interesse em ${interest.toLocaleLowerCase("pt-BR")}. Este plano prioriza educação básica, qualificação acessível e passos que não exigem faculdade neste momento.`
    : `Você está em uma fase de ${objective.toLocaleLowerCase("pt-BR")} e demonstrou interesse em ${interest.toLocaleLowerCase("pt-BR")}. Este caminho pode combinar com seus objetivos sem limitar suas escolhas.`;

  if (basicEducation) {
    const accessibleLink = needsFree ? officialLink("https://www.gov.br/mec/pt-br", "Conhecer oportunidades públicas") : courseLink;
    return {
      summary: profileSummary,
      stages: [
        { number: "01", title: "Fortaleça sua base", text: "Priorize a conclusão da educação básica e procure apoio pedagógico, EJA ou programas públicos compatíveis com sua cidade." + accessNote, link: officialLink("https://www.gov.br/mec/pt-br", "Consultar educação pública") },
        { number: "02", title: "Experimente uma profissão", text: `Comece por uma qualificação curta e acessível em ${area.skills.split(",").slice(0, 2).join(" e ")}. Observe o que desperta seu interesse antes de escolher uma formação maior.${freeNote}`, link: accessibleLink },
        { number: "03", title: "Busque oportunidades", text: wantsWork ? "Procure programas de formação, aprendizagem e oportunidades de entrada que respeitem sua idade, escolaridade e disponibilidade." : "Conheça cursos profissionalizantes, projetos de incentivo e instituições que ofereçam apoio para sua próxima etapa.", link: isYoung ? workLink : officialLink("https://www.proa.org.br/", "Conhecer o Instituto ProA") },
        { number: "04", title: "Construa seu próximo passo", text: `Depois de fortalecer sua base, você pode avançar para ${area.study}. Com mais experiência, explore possibilidades como ${area.future}.`, link: "" }
      ],
      interest
    };
  }

  const stages = [
    {
      number: "01", title: "Comece agora", text: `Escolha uma tarefa pequena ligada a ${interest.toLocaleLowerCase("pt-BR")} e reserve ${labels.time[answers.time].toLocaleLowerCase("pt-BR")}. Monte ou atualize seu currículo e registre o que você já sabe.${accessNote}`,
      link: wantsWork ? "Comece atualizando seu currículo e separando uma hora para estudar." : courseLink
    },
    {
      number: "02", title: "Desenvolva habilidades", text: `Desenvolva ${area.skills}.${freeNote}`,
      link: courseLink
    },
    {
      number: "03", title: wantsWork ? "Busque oportunidades" : "Abra possibilidades", text: wantsWork
        ? `Pesquise vagas compatíveis com seu momento, prepare-se para entrevistas e verifique requisitos antes de se candidatar.${isYoung ? " O programa Jovem Aprendiz pode ser uma porta de entrada para quem tem idade compatível." : ""}`
        : `Explore bolsas, cursos, processos seletivos e projetos de formação que aproximem você da área escolhida. Compare horários, requisitos e custos antes de decidir.`,
      link: wantsWork ? workLink : recommendationLink(opportunityFor(answers, ["bolsa", "auxílio"], ["bolsas"]), "Ver bolsas e auxílios")
    },
    {
      number: "04", title: "Próximo passo", text: wantsHigherEd
        ? "Compare um curso técnico, uma graduação ou uma preparação para o ENEM. Consulte instituições públicas e os editais oficiais antes de se inscrever."
        : `Escolha uma formação compatível com sua rotina: ${area.study}. Depois, crie um projeto ou reúna evidências das habilidades desenvolvidas.`,
      link: wantsHigherEd ? '<a class="profile-plan-link" href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem" target="_blank" rel="noopener noreferrer">Conhecer o ENEM <span aria-hidden="true">→</span></a>' : ""
    },
    {
      number: "05", title: "Possíveis caminhos futuros", text: `Reavalie seu plano a cada poucos meses. Algumas possibilidades para explorar são: ${area.future}.`,
      link: '<a class="profile-plan-link" href="https://www.proa.org.br/" target="_blank" rel="noopener noreferrer">Conhecer o Instituto ProA <span aria-hidden="true">→</span></a>'
    }
  ];
  return { stages, interest, summary: profileSummary };
}

function renderPlan(answers) {
  const { stages, interest, summary } = buildPlan(answers);
  const goals = answers.goals.map((goal) => goalLabels[goal]).join(", ");
  const renderStageLink = (link) => {
    if (!link) return "";
    if (link.trim().startsWith("<a ")) return link;
    return `<span class="profile-plan-note">${escapeHtml(link)}</span>`;
  };
  resultArea.innerHTML = `
    <div class="plan-header"><p class="eyebrow">Orientação para o seu momento</p><h2>Seu Plano Voa Mais</h2><p>Com base nas suas respostas, criamos uma sugestão de caminho para o seu momento atual.</p><p class="plan-summary">${escapeHtml(summary)}</p></div>
    <div class="plan-profile"><h3>Seu perfil</h3><div class="plan-profile-grid"><span><small>Idade</small><strong>${escapeHtml(labels.age[answers.age])}</strong></span><span><small>Escolaridade</small><strong>${escapeHtml(labels.education[answers.education])}</strong></span><span><small>Objetivo</small><strong>${escapeHtml(goals)}</strong></span><span><small>Área de interesse</small><strong>${escapeHtml(interest)}</strong></span><span><small>Tempo disponível</small><strong>${escapeHtml(labels.time[answers.time])}</strong></span><span><small>Situação atual</small><strong>${escapeHtml(labels.status[answers.status])}</strong></span></div></div>
    <h3 class="plan-path-title">Seu caminho recomendado</h3>
    <div class="plan-stages">${stages.map((stage) => `<article class="plan-stage"><span class="plan-stage-number">${stage.number}</span><div><h4>${escapeHtml(stage.title)}</h4><p>${escapeHtml(stage.text)}</p>${renderStageLink(stage.link)}</div></article>`).join("")}</div>
    <div class="plan-message"><p class="eyebrow">Uma mensagem para você</p><p>Você não precisa saber exatamente onde quer chegar. O importante é começar pelo próximo passo.</p></div>
    <div class="plan-footer"><p><strong>Suas respostas mudaram?</strong><br>Você pode refazer o plano e explorar outra possibilidade.</p><button class="button button-dark" id="profile-restart" type="button">Refazer meu plano</button></div>`;
  form.hidden = true;
  resultArea.hidden = false;
  resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
  document.querySelector("#profile-restart").addEventListener("click", resetProfile);
}

function resetProfile() {
  form.reset();
  form.hidden = false;
  resultArea.hidden = true;
  resultArea.innerHTML = "";
  currentStep = 1;
  updateStep();
}

document.querySelectorAll(".profile-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    resetProfile();
    dialog.showModal();
  });
});

nextButton.addEventListener("click", () => {
  if (!validateStep()) return;
  currentStep += 1;
  updateStep();
});

backButton.addEventListener("click", () => {
  if (currentStep <= 1) return;
  currentStep -= 1;
  updateStep();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateStep() || !form.reportValidity()) return;
  renderPlan(getAnswers());
  playSuccessSound();
});

updateStep();
