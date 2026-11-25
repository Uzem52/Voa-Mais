import "./opportunities.js";
import "./search.js";
import "./profile.js";
import "./profile-validation.js";
import "./scroll-effects.js";
import "./icon-pop.js";
import { setupSoundControl } from "./sounds.js";

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
