// js/auth.js — Login do VoaMais com Firebase Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 1) COLE AQUI a configuração do seu projeto (Firebase Console > Configurações do projeto > Seus apps)
const firebaseConfig = {
  apiKey: "AIzaSyAHTRIbUQnxEpRmfYrwh-gxVoufac4Xqu4",
  authDomain: "voa-mais.firebaseapp.com",
  projectId: "voa-mais",
  appId: "1:386328977147:web:75956670777afd25d71a5e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "pt-BR";

// ---------- Elementos ----------
const dialog = document.getElementById("auth-dialog");
const form = document.getElementById("auth-form");
const tabs = document.querySelectorAll("[data-auth-tab]");
const nameField = document.getElementById("auth-name-field");
const nameInput = document.getElementById("auth-name");
const emailInput = document.getElementById("auth-email");
const passInput = document.getElementById("auth-password");
const submitBtn = document.getElementById("auth-submit");
const errorBox = document.getElementById("auth-error");
const forgotBtn = document.getElementById("auth-forgot");
const googleBtn = document.getElementById("auth-google");
const title = document.getElementById("auth-dialog-title");
const trigger = document.getElementById("auth-trigger");
const userArea = document.getElementById("auth-user");
const userName = document.getElementById("auth-user-name");
const logoutBtn = document.getElementById("auth-logout");

let mode = "login"; // "login" | "signup"

// ---------- Utilidades ----------
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-visible", "is-active", "show");
  setTimeout(() => el.classList.remove("is-visible", "is-active", "show"), 3500);
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = !msg;
}

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/missing-password": "Digite sua senha.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/email-already-in-use": "Esse e-mail já tem cadastro. Tente entrar.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
    "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
    "auth/popup-closed-by-user": "",
    "auth/cancelled-popup-request": "",
    "auth/unauthorized-domain":
      "Este domínio não está autorizado no Firebase (veja o passo de domínios autorizados).",
  };
  return map[code] ?? "Algo deu errado. Tente novamente.";
}

function setMode(next) {
  mode = next;
  const signup = mode === "signup";
  tabs.forEach((t) => {
    const active = t.dataset.authTab === mode;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", active);
  });
  nameField.hidden = !signup;
  nameInput.required = signup;
  forgotBtn.hidden = signup;
  passInput.autocomplete = signup ? "new-password" : "current-password";
  submitBtn.firstChild.textContent = signup ? "Criar minha conta " : "Entrar ";
  title.textContent = signup ? "Crie sua conta" : "Entre na sua conta";
  showError("");
}

function setLoading(on) {
  submitBtn.disabled = on;
  googleBtn.disabled = on;
}

// ---------- Eventos ----------
trigger?.addEventListener("click", () => {
  setMode("login");
  dialog.showModal();
});

tabs.forEach((t) => t.addEventListener("click", () => setMode(t.dataset.authTab)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  setLoading(true);
  try {
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: nameInput.value.trim() });
      toast("Conta criada! Bem-vindo(a) ao VoaMais ✈");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      toast("Que bom te ver de novo!");
    }
    form.reset();
    dialog.close();
  } catch (err) {
    showError(friendlyError(err.code));
  } finally {
    setLoading(false);
  }
});

googleBtn.addEventListener("click", async () => {
  showError("");
  setLoading(true);
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    dialog.close();
    toast("Login feito com Google!");
  } catch (err) {
    showError(friendlyError(err.code));
  } finally {
    setLoading(false);
  }
});

forgotBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return showError("Digite seu e-mail acima para receber o link de redefinição.");
  try {
    await sendPasswordResetEmail(auth, email);
    showError("");
    toast("Enviamos um link de redefinição para o seu e-mail.");
  } catch (err) {
    showError(friendlyError(err.code));
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  toast("Você saiu da conta.");
});

// ---------- Estado de login (atualiza o cabeçalho) ----------
onAuthStateChanged(auth, (user) => {
  const logged = !!user;
  trigger.hidden = logged;
  userArea.hidden = !logged;
  if (logged) {
    const first = (user.displayName || user.email || "").split(/[ @]/)[0];
    userName.textContent = `Olá, ${first}`;
  }
  // Disponível para o resto do site (ex.: salvar o Plano Voa Mais por usuário)
  window.voaUser = user;
  document.dispatchEvent(new CustomEvent("voa:auth", { detail: { user } }));
});
