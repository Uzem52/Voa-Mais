const interactiveSelector = [
  "a",
  "button",
  "input[type='radio']",
  "input[type='checkbox']",
  "select",
  "summary",
  "[role='button']",
  ".profile-option"
].join(", ");

function popIcons(target) {
  target.querySelectorAll(".icon").forEach((icon) => {
    icon.classList.remove("icon-pop", "icon-hover-pop");
    void icon.offsetWidth;
    icon.classList.add("icon-pop");
  });
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest(interactiveSelector);
  if (!target || target.disabled || target.closest("[data-sound-control]")) return;
  popIcons(target);
}, true);

document.addEventListener("mouseenter", (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest(interactiveSelector);
  if (!target || target.disabled || target.closest("[data-sound-control]")) return;

  target.querySelectorAll(".icon").forEach((icon) => {
    icon.classList.remove("icon-hover-pop", "icon-pop");
    void icon.offsetWidth;
    icon.classList.add("icon-hover-pop");
  });
}, true);

document.addEventListener("mouseleave", (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest(interactiveSelector);
  if (!target) return;
  target.querySelectorAll(".icon").forEach((icon) => {
    icon.classList.remove("icon-hover-pop");
  });
}, true);
