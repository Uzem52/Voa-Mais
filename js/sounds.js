const soundPreferenceKey = "voamais:sounds-enabled";
let audioContext;

function soundsEnabled() {
  try {
    return localStorage.getItem(soundPreferenceKey) !== "false";
  } catch (error) {
    console.error("Não foi possível ler a preferência de som.", error);
    return true;
  }
}

function setSoundsEnabled(enabled) {
  try {
    localStorage.setItem(soundPreferenceKey, String(enabled));
  } catch (error) {
    console.error("Não foi possível salvar a preferência de som.", error);
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration, volume, delay = 0, type = "sine") {
  if (!soundsEnabled()) return;
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playClickSound() {
  playTone(520, 0.055, 0.035);
}

export function playSuccessSound() {
  playTone(523, 0.09, 0.045);
  playTone(659, 0.13, 0.04, 0.07);
}

export function playNotificationSound() {
  playTone(440, 0.1, 0.04);
  playTone(349, 0.14, 0.035, 0.11);
}

function updateSoundControl(control, enabled) {
  control.textContent = enabled ? "🔊" : "🔇";
  control.setAttribute("aria-label", enabled ? "Desativar sons" : "Ativar sons");
  control.setAttribute("aria-pressed", String(enabled));
  control.title = enabled ? "Sons ativados" : "Sons desativados";
}

export function setupSoundControl() {
  const headerActions = document.querySelector(".header-actions");
  if (!headerActions || headerActions.querySelector("[data-sound-control]")) return;
  const control = document.createElement("button");
  control.className = "icon-button sound-control";
  control.type = "button";
  control.dataset.soundControl = "true";
  const enabled = soundsEnabled();
  updateSoundControl(control, enabled);
  control.addEventListener("click", () => {
    const nextEnabled = !soundsEnabled();
    setSoundsEnabled(nextEnabled);
    updateSoundControl(control, nextEnabled);
    if (nextEnabled) playClickSound();
  });
  headerActions.append(control);
}

setupSoundControl();

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a, input[type='radio'], input[type='checkbox'], select, summary, [role='button'], .profile-option");
  if (!target || target.disabled || target.closest("[data-sound-control]")) return;
  playClickSound();
}, true);
