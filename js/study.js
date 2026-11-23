import { setupSoundControl, playNotificationSound } from "./sounds.js";
import "./scroll-effects.js";
import "./icon-pop.js";

setupSoundControl();

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  navigation.classList.toggle("is-open", !isOpen);
  menuButton.innerHTML = `<svg class="icon"><use href="#${isOpen ? "i-menu" : "i-close"}"/></svg>`;
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a") && navigation.classList.contains("is-open")) {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
    menuButton.innerHTML = '<svg class="icon"><use href="#i-menu"/></svg>';
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

const scheduleForm = document.querySelector("#schedule-form");
const scheduleOutput = document.querySelector("#schedule-output");
if (scheduleForm) {
  scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(scheduleForm);
    scheduleOutput.textContent = `${data.get("day")}: ${data.get("subject")} das ${data.get("time")}. Reserve uma pausa curta e registre a próxima revisão.`;
  });
}

const openPomodoro = document.querySelector("#open-pomodoro");
const pomodoroTimer = document.querySelector("#pomodoro-timer");
const timerDisplay = document.querySelector("#timer-display");
const timerStatus = document.querySelector("#timer-status");
const timerMessage = document.querySelector("#timer-message");
const startButton = document.querySelector("#timer-start");
const pauseButton = document.querySelector("#timer-pause");
const resetButton = document.querySelector("#timer-reset");
const modeButtons = document.querySelectorAll(".timer-mode");

if (openPomodoro && pomodoroTimer && timerDisplay && timerStatus && timerMessage && startButton && pauseButton && resetButton && modeButtons.length) {
  const focusDuration = 25 * 60;
  const breakDuration = 5 * 60;
  let selectedDuration = focusDuration;
  let remainingSeconds = focusDuration;
  let timerId = null;
  let endTime = 0;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  const renderTimer = () => {
    timerDisplay.textContent = formatTime(remainingSeconds);
    document.title = `${formatTime(remainingSeconds)} · Técnica Pomodoro | VoaMais`;
  };

  const stopTimer = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    pauseButton.disabled = true;
  };

  const finishTimer = () => {
    stopTimer();
    playNotificationSound();
    remainingSeconds = 0;
    renderTimer();
    timerStatus.textContent = "Período concluído";
    timerMessage.textContent = selectedDuration === breakDuration
      ? "Intervalo concluído. Você pode voltar ao foco quando estiver pronto."
      : "Período de foco terminou. Faça uma pausa de 5 minutos antes do próximo ciclo.";
    startButton.textContent = "Iniciar novamente";
  };

  const tick = () => {
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    renderTimer();
    if (remainingSeconds === 0) finishTimer();
  };

  const startTimer = () => {
    if (timerId !== null || remainingSeconds <= 0) return;
    endTime = Date.now() + remainingSeconds * 1000;
    timerId = window.setInterval(tick, 250);
    timerStatus.textContent = selectedDuration === focusDuration ? "Foco em andamento" : "Intervalo em andamento";
    timerMessage.textContent = "Mantenha o foco no que você escolheu fazer.";
    startButton.textContent = "Em andamento";
    startButton.disabled = true;
    pauseButton.disabled = false;
  };

  const pauseTimer = () => {
    if (timerId === null) return;
    tick();
    stopTimer();
    timerStatus.textContent = "Cronômetro pausado";
    timerMessage.textContent = "Retome quando estiver pronto para continuar.";
    startButton.textContent = "Continuar";
    startButton.disabled = false;
  };

  const resetTimer = () => {
    stopTimer();
    remainingSeconds = selectedDuration;
    renderTimer();
    timerStatus.textContent = "Pronto para começar";
    timerMessage.textContent = "Quando o período terminar, você verá uma mensagem aqui.";
    startButton.textContent = "Iniciar";
    startButton.disabled = false;
  };

  openPomodoro.addEventListener("click", () => {
    pomodoroTimer.hidden = false;
    pomodoroTimer.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => startButton.focus(), 350);
  });

  startButton.addEventListener("click", startTimer);
  pauseButton.addEventListener("click", pauseTimer);
  resetButton.addEventListener("click", resetTimer);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const duration = Number(button.dataset.duration);
      if (!Number.isFinite(duration) || duration <= 0) return;
      modeButtons.forEach((mode) => mode.classList.remove("is-active"));
      button.classList.add("is-active");
      selectedDuration = duration;
      resetTimer();
    });
  });

  window.addEventListener("beforeunload", stopTimer);
  renderTimer();
}
