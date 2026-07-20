const codeButton = document.querySelector("[data-code-button]");
const codeRelease = window.EVEE_SITE_CONFIG || {};

if (codeButton && codeRelease.codeReleased === true && codeRelease.codeUrl) {
  codeButton.textContent = "Code";
  codeButton.href = codeRelease.codeUrl;
  codeButton.target = "_blank";
  codeButton.rel = "noopener";
  codeButton.classList.remove("button-disabled");
  codeButton.removeAttribute("aria-disabled");
  codeButton.removeAttribute("tabindex");
} else if (codeButton) {
  codeButton.textContent = "Coming soon";
  codeButton.removeAttribute("href");
  codeButton.removeAttribute("target");
  codeButton.removeAttribute("rel");
  codeButton.classList.add("button-disabled");
  codeButton.setAttribute("aria-disabled", "true");
  codeButton.tabIndex = -1;
}

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
