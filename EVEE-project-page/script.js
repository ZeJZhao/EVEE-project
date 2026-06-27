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
  document.querySelectorAll("video[autoplay]").forEach((video) => {
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

window.addEventListener("load", startAutoplayVideos, { once: true });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) startAutoplayVideos();
});
