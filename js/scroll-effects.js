const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function markRevealElements() {
  const selectors = [
    ".section-heading",
    ".category-card",
    ".feature-card",
    ".proa-highlight",
    ".need-link",
    ".method-item",
    ".recommendation-card",
    ".profile-banner",
    ".opportunity-row",
    ".social-banner",
    ".study-hero",
    ".study-content",
    ".study-tool-card",
    ".tool-card",
    ".weekly-plan",
    ".schedule-form",
    ".pomodoro-timer"
  ];

  document.querySelectorAll(selectors.join(",")).forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
  });

  document.querySelectorAll(".hero-copy > *").forEach((element, index) => {
    element.classList.add("hero-reveal");
    element.style.setProperty("--hero-delay", `${index * 80}ms`);
  });

  document.querySelectorAll(".hero-art > *").forEach((element, index) => {
    element.classList.add("hero-art-reveal");
    element.style.setProperty("--hero-delay", `${180 + index * 65}ms`);
  });
}

function setupReveal() {
  markRevealElements();
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".scroll-reveal, .hero-reveal").forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

  document.querySelectorAll(".scroll-reveal, .hero-reveal").forEach((element) => observer.observe(element));
}

function setupParallax() {
  const elements = [...document.querySelectorAll("[data-parallax]")];
  if (!elements.length || reducedMotion.matches) return;

  let scheduled = false;
  const update = () => {
    const viewportCenter = window.innerHeight / 2;
    elements.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      const distance = (bounds.top + bounds.height / 2 - viewportCenter) * Number(element.dataset.parallax || 0.04);
      element.style.setProperty("--parallax-y", `${Math.max(-24, Math.min(24, distance))}px`);
    });
    scheduled = false;
  };

  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  requestUpdate();
}

function setupJourneyPlane() {
  const guide = document.querySelector(".scroll-guide");
  if (!guide || reducedMotion.matches) return;

  let scheduled = false;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    guide.style.setProperty("--journey-progress", progress.toString());
    scheduled = false;
  };
  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  update();
}

export function setupScrollEffects() {
  setupReveal();
  setupParallax();
  setupJourneyPlane();
}

setupScrollEffects();
