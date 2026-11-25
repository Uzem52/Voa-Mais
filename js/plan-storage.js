// js/plan-storage.js
// Salva o Plano Voa Mais de cada pessoa no Firestore e mostra o plano salvo quando ela volta.
// Caminho no banco: users/{uid}/plans/latest

import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("profile-form");
const results = document.getElementById("profile-results");
const dialog = document.getElementById("profile-dialog");

if (form && results && dialog) init();

function init() {
  let db = null;
  let currentUser = null;
  let pending = null; // plano recém-feito que ainda não foi salvo
  let savedPlan = null; // plano que já está salvo na conta

  const getDb = () => (db ??= getFirestore(getApp()));
  const planRef = (uid) => doc(getDb(), "users", uid, "plans", "latest");

  // ---------- Utilidades ----------
  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    setTimeout(() => el.classList.remove("is-visible"), 3500);
  }

  function collectAnswers() {
    const fd = new FormData(form);
    return {
      age: fd.get("age"),
      education: fd.get("education"),
      goals: fd.getAll("goal"),
      interest: fd.get("interest"),
      time: fd.get("time"),
      access: fd.get("access"),
      free: fd.get("free"),
      status: fd.get("status"),
    };
  }

  // Limpa o HTML salvo antes de mostrar de novo (remove scripts e atributos perigosos).
  function sanitize(html) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("script, iframe, object, embed, link, style, meta, base").forEach((n) => n.remove());
    parsed.body.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((a) => {
        const name = a.name.toLowerCase();
        const value = a.value.trim().toLowerCase();
        const urlAttr = ["href", "src", "xlink:href", "action", "formaction"].includes(name);
        if (name.startsWith("on") || (urlAttr && value.startsWith("javascript:"))) {
          el.removeAttribute(a.name);
        }
      });
    });
    return parsed.body.innerHTML;
  }

  function formatDate(ts) {
    try {
      return ts?.toDate ? ts.toDate().toLocaleDateString("pt-BR") : "";
    } catch {
      return "";
    }
  }

  // ---------- Salvar ----------
  async function savePending() {
    if (!pending?.html) return;
    if (!currentUser) {
      showSavePrompt();
      return;
    }
    try {
      await setDoc(planRef(currentUser.uid), {
        answers: pending.answers,
        html: pending.html,
        updatedAt: serverTimestamp(),
        version: 1,
      });
      savedPlan = { answers: pending.answers, html: pending.html, updatedAt: null };
      pending = null;
      showNote("✓ Plano salvo na sua conta. Você pode vê-lo de novo quando entrar.");
      toast("Plano salvo na sua conta!");
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      showNote("Não conseguimos salvar seu plano agora. Tente novamente mais tarde.", true);
    }
  }

  function showNote(text, isError = false) {
    results.querySelector(".plan-save-note")?.remove();
    const div = document.createElement("div");
    div.className = "plan-save-note" + (isError ? " is-error" : "");
    div.textContent = text;
    results.appendChild(div);
  }

  function showSavePrompt() {
    results.querySelector(".plan-save-note")?.remove();
    const div = document.createElement("div");
    div.className = "plan-save-note";
    div.innerHTML =
      '<p>Quer guardar este plano? Entre ou crie uma conta e ele fica salvo para você voltar quando quiser.</p>' +
      '<button type="button" class="button button-primary" data-plan-action="login">Entrar para salvar</button>';
    results.appendChild(div);
  }

  // Depois que o teste é enviado, espera o plano aparecer na tela e então salva.
  form.addEventListener("submit", () => {
    pending = { answers: collectAnswers(), html: null };
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const ready = !results.hidden && results.innerHTML.trim().length > 0;
      if (ready) {
        clearInterval(timer);
        pending.html = results.innerHTML;
        savePending();
      } else if (tries > 25) {
        clearInterval(timer); // desiste depois de ~5s
      }
    }, 200);
  });

  // ---------- Mostrar plano salvo ----------
  function removeBanner() {
    document.getElementById("saved-plan-banner")?.remove();
  }

  function renderBanner() {
    removeBanner();
    if (!savedPlan) return;
    if (!results.hidden && results.innerHTML.trim()) return; // já está vendo um plano
    const anchor = dialog.querySelector(".profile-progress");
    if (!anchor) return;
    const date = formatDate(savedPlan.updatedAt);
    const banner = document.createElement("div");
    banner.className = "saved-plan-banner";
    banner.id = "saved-plan-banner";
    banner.innerHTML =
      "<div><strong>Você já tem um plano salvo</strong>" +
      (date ? `<span>Feito em ${date}</span>` : "") +
      '</div><button type="button" class="button button-primary" data-plan-action="view">Ver meu plano</button>';
    anchor.before(banner);
  }

  function showSavedPlan() {
    if (!savedPlan?.html) return;
    removeBanner();
    dialog.querySelector(".modal-intro")?.setAttribute("hidden", "");
    dialog.querySelector(".profile-progress")?.setAttribute("hidden", "");
    form.hidden = true;
    results.innerHTML = sanitize(savedPlan.html);
    const redo = document.createElement("div");
    redo.className = "plan-save-note";
    redo.innerHTML =
      '<p>Este é o plano que você salvou. Quer refazer o teste?</p>' +
      '<button type="button" class="button button-dark" data-plan-action="redo">Refazer o teste</button>';
    results.appendChild(redo);
    results.hidden = false;
  }

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-plan-action]")?.dataset.planAction;
    if (action === "view") showSavedPlan();
    if (action === "redo") location.reload();
    if (action === "login") document.getElementById("auth-trigger")?.click();
    if (e.target.closest(".profile-trigger")) setTimeout(renderBanner, 0);
  });

  // ---------- Reage ao login / logout (evento criado no auth.js) ----------
  async function onUser(user) {
    currentUser = user;
    removeBanner();
    if (!user) {
      savedPlan = null;
      return;
    }
    if (pending?.html) {
      await savePending(); // a pessoa fez o teste antes de entrar
      return;
    }
    try {
      const snap = await getDoc(planRef(user.uid));
      savedPlan = snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error("Erro ao carregar plano:", err);
      savedPlan = null;
    }
    if (dialog.open) renderBanner();
  }

  document.addEventListener("voa:auth", (e) => onUser(e.detail.user));
  if (window.voaUser) onUser(window.voaUser);
}
