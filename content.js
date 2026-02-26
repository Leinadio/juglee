(() => {
  "use strict";

  const CHECK_SVG = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  const EYE_SVG = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

  let watchedVideos = new Set();

  function loadWatchedVideos() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ watchedVideos: [] }, (result) => {
        watchedVideos = new Set(result.watchedVideos);
        resolve();
      });
    });
  }

  let videoTitles = {};

  function loadVideoTitles() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ videoTitles: {} }, (result) => {
        videoTitles = result.videoTitles || {};
        resolve();
      });
    });
  }

  function saveWatchedVideos() {
    const MAX_BYTES = 9 * 1024 * 1024; // 9 Mo (marge sur le quota de 10 Mo)
    const videosArray = [...watchedVideos];
    const data = { watchedVideos: videosArray, videoTitles };

    while (JSON.stringify(data).length > MAX_BYTES && data.watchedVideos.length > 0) {
      const oldest = data.watchedVideos.shift();
      delete data.videoTitles[oldest];
      watchedVideos.delete(oldest);
    }

    chrome.storage.local.set(data);
  }

  function extractVideoId(url) {
    if (!url) return null;
    try {
      const u = new URL(url, window.location.origin);
      if (u.searchParams.has("v")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/"))
        return u.pathname.split("/shorts/")[1]?.split(/[?#/]/)[0];
    } catch {
      // ignore
    }
    return null;
  }

  function toggleWatched(videoId, title) {
    if (watchedVideos.has(videoId)) {
      watchedVideos.delete(videoId);
      delete videoTitles[videoId];
    } else {
      watchedVideos.add(videoId);
      if (title) videoTitles[videoId] = title;
    }
    saveWatchedVideos();
    return watchedVideos.has(videoId);
  }

  // Trouver le titre de la vidéo depuis le DOM autour du lien
  function findVideoTitle(link) {
    // Remonter au renderer parent (fonctionne sur toutes les pages)
    const renderer = link.closest(
      "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer"
    );
    if (renderer) {
      const titleEl = renderer.querySelector("#video-title, h3 a#video-title-link, h3");
      if (titleEl) return titleEl.textContent.trim();
    }
    // Page d'accueil : yt-lockup-view-model
    const lockup = link.closest("yt-lockup-view-model");
    if (lockup) {
      const h3 = lockup.querySelector("h3");
      if (h3) return h3.textContent.trim();
    }
    return null;
  }

  function setBtnState(btn, isWatched) {
    btn.setAttribute("data-watched", isWatched ? "1" : "0");
    if (isWatched) {
      btn.innerHTML = `${CHECK_SVG}<span>Vu</span>`;
      btn.title = "Retirer";
      btn.style.display = "flex";
    } else {
      btn.innerHTML = `${EYE_SVG}<span>Vu</span>`;
      btn.title = "Marquer comme vu";
    }
  }

  // ===== Hover via polling de la position souris =====
  // YouTube injecte un video player au hover qui casse les événements DOM.
  // On utilise un polling basé sur les coordonnées de la souris.

  let mouseX = -1;
  let mouseY = -1;
  let currentHoveredBtn = null;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function findBtnUnderMouse() {
    if (mouseX < 0) return null;

    // Trouver tous les boutons et vérifier si la souris est dans le rect de leur miniature
    const btns = document.querySelectorAll(".yw-thumb-btn");
    for (const btn of btns) {
      // Remonter au lien parent data-yw pour obtenir la zone de la miniature
      const link = btn.closest("[data-yw]");
      if (!link) continue;
      const rect = link.getBoundingClientRect();
      if (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
      ) {
        return btn;
      }
    }
    return null;
  }

  setInterval(() => {
    const btn = findBtnUnderMouse();

    if (btn === currentHoveredBtn) return;

    if (currentHoveredBtn && currentHoveredBtn.getAttribute("data-watched") === "0") {
      currentHoveredBtn.style.display = "none";
    }
    currentHoveredBtn = btn;
    if (btn) {
      btn.style.display = "flex";
    }
  }, 100);

  // ===== Ajout des boutons sur les miniatures =====

  function processThumbnails() {
    const allLinks = document.querySelectorAll(
      "a#thumbnail:not([data-yw]), a.yt-lockup-view-model__content-image:not([data-yw])"
    );

    allLinks.forEach((link) => {
      const videoId = extractVideoId(link.href);
      if (!videoId) return;

      link.setAttribute("data-yw", "1");

      const anchor = link.querySelector("yt-thumbnail-view-model") || link;

      const btn = document.createElement("button");
      btn.className = "yw-thumb-btn";
      setBtnState(btn, watchedVideos.has(videoId));

      if (!watchedVideos.has(videoId)) {
        btn.style.display = "none";
      }

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const title = findVideoTitle(link);
        const isWatched = toggleWatched(videoId, title);
        setBtnState(btn, isWatched);
      });

      anchor.appendChild(btn);
    });
  }

  // ===== Bouton sur le player vidéo =====

  function processPlayer() {
    const player = document.querySelector("#movie_player");
    if (!player || player.querySelector(".yw-player-btn")) return;

    const videoId = extractVideoId(window.location.href);
    if (!videoId) return;

    const btn = document.createElement("button");
    btn.className = "yw-player-btn";
    btn.style.display = "none";
    setBtnState(btn, watchedVideos.has(videoId));

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const titleEl = document.querySelector("h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer");
      const title = titleEl ? titleEl.textContent.trim() : null;
      const isWatched = toggleWatched(videoId, title);
      setBtnState(btn, isWatched);
    });

    player.addEventListener("mouseenter", () => (btn.style.display = "flex"));
    player.addEventListener("mouseleave", () => (btn.style.display = "none"));

    player.appendChild(btn);
  }

  // ===== Scan périodique =====

  function startScanning() {
    setInterval(() => {
      processThumbnails();
      processPlayer();
    }, 1000);
  }

  document.addEventListener("yt-navigate-finish", () => {
    document.querySelectorAll(".yw-player-btn").forEach((b) => b.remove());
    document.querySelectorAll("[data-yw]").forEach((el) =>
      el.removeAttribute("data-yw")
    );
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.watchedVideos) {
      watchedVideos = new Set(changes.watchedVideos.newValue || []);
      document.querySelectorAll(".yw-thumb-btn").forEach((btn) => {
        const link = btn.closest("[data-yw]");
        const videoId = link ? extractVideoId(link.href) : null;
        if (videoId) setBtnState(btn, watchedVideos.has(videoId));
      });
    }
  });

  async function init() {
    await loadWatchedVideos();
    await loadVideoTitles();
    processThumbnails();
    processPlayer();
    startScanning();
  }

  init();
})();
