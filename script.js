const codeButton = document.querySelector("[data-code-button]");
const paperButton = document.querySelector("[data-paper-button]");
const videoButton = document.querySelector("[data-video-button]");
const siteConfig = window.EVEE_SITE_CONFIG || {};

const configureReleaseButton = (button, released, url, label) => {
  if (!button) return;

  if (released === true && url) {
    button.textContent = label;
    button.href = url;
    button.target = "_blank";
    button.rel = "noopener";
    button.classList.remove("button-disabled");
    button.removeAttribute("aria-disabled");
    button.removeAttribute("tabindex");
    return;
  }

  button.textContent = "Paper (Coming soon)";
  button.removeAttribute("href");
  button.removeAttribute("target");
  button.removeAttribute("rel");
  button.classList.add("button-disabled");
  button.setAttribute("aria-disabled", "true");
  button.tabIndex = -1;
};

configureReleaseButton(
  codeButton,
  siteConfig.codeReleased,
  siteConfig.codeUrl,
  "Code",
);
configureReleaseButton(
  videoButton,
  siteConfig.videoReleased,
  siteConfig.videoUrl,
  "Video",
);
configureReleaseButton(
  paperButton,
  siteConfig.paperReleased,
  siteConfig.paperUrl,
  "Paper",
);

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const closeButton = lightbox?.querySelector(".lightbox-close");

document.querySelectorAll("[data-lightbox]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = trigger.dataset.lightbox;
    lightboxImage.alt = trigger.querySelector("img")?.alt || "Expanded figure";
    lightbox.showModal();
  });
});

closeButton?.addEventListener("click", () => {
  lightbox?.close();
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.open) {
    lightbox.close();
  }
});

const startAutoplayVideos = () => {
  document.querySelectorAll("video[autoplay], .result-slide.is-active video").forEach((video) => {
    if (video.closest(".result-slide")?.getAttribute("aria-hidden") === "true") return;
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(() => {});
  });
};

document.querySelectorAll("video[data-fallback]").forEach((video) => {
  video.addEventListener("error", () => {
    const fallback = video.dataset.fallback;
    if (!fallback) return;
    const image = document.createElement("img");
    image.src = fallback;
    image.alt = video.getAttribute("aria-label") || "";
    video.replaceWith(image);
  });
});

document.querySelectorAll("[data-results-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("[data-result-slide]"));
  const jumpButtons = Array.from(carousel.querySelectorAll("[data-result-jump]"));
  const count = carousel.querySelector("[data-carousel-count]");
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  let touchStartX = null;

  if (slides.length < 2) return;

  const setActiveSlide = (requestedIndex, direction) => {
    const nextIndex = (requestedIndex + slides.length) % slides.length;
    if (nextIndex === activeIndex) return;

    const previousSlide = slides[activeIndex];
    const nextSlide = slides[nextIndex];
    const previousVideo = previousSlide.querySelector("video");
    const nextVideo = nextSlide.querySelector("video");

    carousel.dataset.direction = direction || (nextIndex > activeIndex ? "next" : "previous");
    previousVideo?.pause();

    slides.forEach((slide, index) => {
      const isActive = index === nextIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    jumpButtons.forEach((button) => {
      const isActive = Number(button.dataset.resultJump) === nextIndex;
      button.classList.toggle("is-active", isActive);
      if (button.getAttribute("role") === "tab") {
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      } else {
        if (isActive) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      }
    });

    activeIndex = nextIndex;
    if (count) {
      count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }

    if (nextVideo) {
      nextVideo.muted = true;
      nextVideo.defaultMuted = true;
      try {
        nextVideo.currentTime = 0;
      } catch (_error) {
        // Metadata may not be available yet; playback can still start normally.
      }
      nextVideo.play().catch(() => {});
    }
  };

  slides.forEach((slide, index) => {
    slide.inert = index !== activeIndex;
  });

  carousel.querySelectorAll("[data-carousel-prev]").forEach((button) => {
    button.addEventListener("click", () => setActiveSlide(activeIndex - 1, "previous"));
  });

  carousel.querySelectorAll("[data-carousel-next]").forEach((button) => {
    button.addEventListener("click", () => setActiveSlide(activeIndex + 1, "next"));
  });

  jumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.resultJump);
      setActiveSlide(nextIndex, nextIndex < activeIndex ? "previous" : "next");
    });
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveSlide(activeIndex - 1, "previous");
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveSlide(activeIndex + 1, "next");
    }
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    },
    { passive: true },
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;
      const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
      const distance = touchEndX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) < 48) return;
      setActiveSlide(activeIndex + (distance < 0 ? 1 : -1), distance < 0 ? "next" : "previous");
    },
    { passive: true },
  );
});

window.addEventListener("load", startAutoplayVideos, { once: true });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) startAutoplayVideos();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero");
const pageDecor = document.querySelector(".page-decor");
const finePointer = window.matchMedia("(pointer: fine)");

if (hero && !reducedMotion.matches && finePointer.matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
    hero.style.setProperty("--hero-pointer-x", `${pointerX.toFixed(1)}%`);
    hero.style.setProperty("--hero-pointer-y", `${pointerY.toFixed(1)}%`);
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--hero-pointer-x", "50%");
    hero.style.setProperty("--hero-pointer-y", "35%");
  });
}

if (pageDecor && !reducedMotion.matches && finePointer.matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      pageDecor.style.setProperty("--page-pointer-x", `${event.clientX}px`);
      pageDecor.style.setProperty("--page-pointer-y", `${event.clientY}px`);
    },
    { passive: true },
  );
}

const revealItems = Array.from(
  document.querySelectorAll(
    [
      ".partner-logos",
      ".hero-copy",
      ".core-idea-heading",
      ".abstract-copy",
      ".core-animation-card",
      ".visual-band .section-heading",
      ".visual-band .image-frame",
      "#method > .section-inner > .section-heading",
      ".module-card",
      ".method-note",
      ".traw-animation-card",
      ".traw-proof-card",
      ".results-intro",
      ".results-metrics .metric",
      ".results-carousel",
      ".acknowledgements-section .section-heading",
      ".acknowledgement-copy",
      ".citation-section .section-heading",
      ".citation-card",
    ].join(","),
  ),
);

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  revealItems.forEach((item, index) => {
    item.classList.add("reveal-ready");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          return;
        }

        entry.target.classList.remove("is-visible");
        entry.target.dataset.revealFrom =
          entry.boundingClientRect.bottom <= 0 ? "top" : "bottom";
      });
    },
    {
      rootMargin: "0px 0px -9% 0px",
      threshold: 0.08,
    },
  );

  revealItems.forEach((item) => {
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 900;
    if (item.getBoundingClientRect().top <= viewportHeight * 0.94) {
      item.classList.add("is-visible");
    }
    revealObserver.observe(item);
  });
}

const scrollProgress = document.querySelector("[data-scroll-progress]");
const backToTop = document.querySelector("[data-back-to-top]");
let scrollFrameRequested = false;

const updateScrollEffects = () => {
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = documentHeight > 0 ? Math.min(1, window.scrollY / documentHeight) : 0;
  scrollProgress?.style.setProperty("transform", `scaleX(${progress})`);
  backToTop?.classList.toggle("is-visible", window.scrollY > Math.min(720, window.innerHeight));
  pageDecor?.style.setProperty(
    "--page-drift",
    `${Math.max(-110, window.scrollY * -0.014).toFixed(2)}px`,
  );
  scrollFrameRequested = false;
};

const requestScrollEffectsUpdate = () => {
  if (scrollFrameRequested) return;
  scrollFrameRequested = true;
  window.requestAnimationFrame(updateScrollEffects);
};

window.addEventListener("scroll", requestScrollEffectsUpdate, { passive: true });
window.addEventListener("resize", requestScrollEffectsUpdate);
updateScrollEffects();

const citationCopyButton = document.querySelector("[data-copy-citation]");
const citationCode = document.querySelector(".bibtex code");
let citationCopyResetTimer;

const copyPlainText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

citationCopyButton?.addEventListener("click", async () => {
  if (!citationCode) return;

  window.clearTimeout(citationCopyResetTimer);
  try {
    await copyPlainText(citationCode.textContent.trim());
    citationCopyButton.textContent = "Copied";
    citationCopyButton.classList.add("is-copied");
  } catch (_error) {
    citationCopyButton.textContent = "Copy failed";
  }

  citationCopyResetTimer = window.setTimeout(() => {
    citationCopyButton.textContent = "Copy BibTeX";
    citationCopyButton.classList.remove("is-copied");
  }, 1800);
});
