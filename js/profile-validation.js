// js/profile-validation.js
// Impede avançar no teste de perfil sem responder a etapa atual.

const form = document.getElementById("profile-form");

if (form) {
  const filled = (name) => !!form.querySelector(`[name="${name}"]:checked`);
  const selected = (name) => !!form.querySelector(`[name="${name}"]`)?.value;

  const rules = {
    1: { ok: () => filled("age") && selected("education"), msg: "Escolha sua faixa de idade e sua escolaridade para continuar." },
    2: { ok: () => filled("goal"), msg: "Escolha pelo menos um objetivo para continuar." },
    3: { ok: () => filled("interest"), msg: "Escolha uma área de interesse para continuar." },
    4: { ok: () => selected("time") && selected("access") && selected("free"), msg: "Responda as três perguntas para continuar." },
    5: { ok: () => filled("status"), msg: "Escolha seu momento profissional para montar o plano." },
  };

  const activeStep = () => form.querySelector(".profile-step.is-active");

  function clearError() {
    form.querySelectorAll(".profile-step-error").forEach((el) => el.remove());
  }

  function showError(step, message) {
    clearError();
    const p = document.createElement("p");
    p.className = "profile-step-error";
    p.setAttribute("role", "alert");
    p.textContent = message;
    step.appendChild(p);
  }

  function validateCurrent() {
    const step = activeStep();
    if (!step) return true;
    const rule = rules[step.dataset.step];
    if (!rule || rule.ok()) {
      clearError();
      return true;
    }
    showError(step, rule.msg);
    return false;
  }

  // Captura o clique ANTES do handler do botão "Continuar" e bloqueia se faltar resposta.
  form.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#profile-next") && !validateCurrent()) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      if (e.target.closest("#profile-back")) clearError();
    },
    true
  );

  // Também valida na última etapa antes de montar o plano.
  form.addEventListener(
    "submit",
    (e) => {
      if (!validateCurrent()) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true
  );

  // Some com o aviso assim que a pessoa responde.
  form.addEventListener("change", clearError);
}
