document.addEventListener("DOMContentLoaded", () => {
  const totalCountEl = document.getElementById("totalCount");
  const recentListEl = document.getElementById("recentList");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");

  function render(watchedVideos) {
    const videos = watchedVideos || [];
    totalCountEl.textContent = videos.length;

    recentListEl.innerHTML = "";

    if (videos.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = "Aucune vidéo marquée";
      recentListEl.appendChild(li);
      return;
    }

    // Afficher les 10 dernières (les plus récemment ajoutées)
    const recent = videos.slice(-10).reverse();
    recent.forEach((videoId) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `https://www.youtube.com/watch?v=${videoId}`;
      a.textContent = videoId;
      a.target = "_blank";
      a.rel = "noopener";
      li.textContent = "✓ ";
      li.appendChild(a);
      recentListEl.appendChild(li);
    });
  }

  // Charger et afficher
  chrome.storage.local.get({ watchedVideos: [] }, (result) => {
    render(result.watchedVideos);
  });

  // Exporter en JSON
  exportBtn.addEventListener("click", () => {
    chrome.storage.local.get({ watchedVideos: [] }, (result) => {
      const data = JSON.stringify({ watchedVideos: result.watchedVideos, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "youtube-watched-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Tout effacer
  clearBtn.addEventListener("click", () => {
    if (confirm("Êtes-vous sûr de vouloir effacer toutes les vidéos marquées ?")) {
      chrome.storage.local.set({ watchedVideos: [] }, () => {
        render([]);
      });
    }
  });

  // Mettre à jour si le stockage change
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.watchedVideos) {
      render(changes.watchedVideos.newValue || []);
    }
  });
});
