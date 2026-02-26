document.addEventListener("DOMContentLoaded", () => {
  const totalCountEl = document.getElementById("totalCount");
  const recentListEl = document.getElementById("recentList");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");

  function render(watchedVideos, videoTitles) {
    const videos = watchedVideos || [];
    const titles = videoTitles || {};
    totalCountEl.textContent = videos.length;

    recentListEl.innerHTML = "";

    if (videos.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = "Aucune vidéo marquée";
      recentListEl.appendChild(li);
      return;
    }

    const recent = videos.slice(-10).reverse();
    recent.forEach((videoId) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `https://www.youtube.com/watch?v=${videoId}`;
      a.textContent = titles[videoId] || videoId;
      a.target = "_blank";
      a.rel = "noopener";
      li.textContent = "\u2713 ";
      li.appendChild(a);
      recentListEl.appendChild(li);
    });
  }

  chrome.storage.local.get({ watchedVideos: [], videoTitles: {} }, (result) => {
    render(result.watchedVideos, result.videoTitles);
  });

  exportBtn.addEventListener("click", () => {
    chrome.storage.local.get({ watchedVideos: [], videoTitles: {} }, (result) => {
      const data = JSON.stringify({
        watchedVideos: result.watchedVideos,
        videoTitles: result.videoTitles,
        exportedAt: new Date().toISOString(),
      }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "youtube-watched-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Importer
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const videos = data.watchedVideos;
        const titles = data.videoTitles || {};
        if (!Array.isArray(videos)) throw new Error("Format invalide");

        // Fusionner avec les données existantes
        chrome.storage.local.get({ watchedVideos: [], videoTitles: {} }, (result) => {
          const merged = new Set([...result.watchedVideos, ...videos]);
          const mergedTitles = { ...result.videoTitles, ...titles };
          chrome.storage.local.set(
            { watchedVideos: [...merged], videoTitles: mergedTitles },
            () => render([...merged], mergedTitles)
          );
        });
      } catch {
        alert("Fichier invalide. Utilisez un fichier exporté par l'extension.");
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Effacer toutes les vidéos marquées ?")) {
      chrome.storage.local.set({ watchedVideos: [], videoTitles: {} }, () => {
        render([], {});
      });
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.watchedVideos || changes.videoTitles) {
      chrome.storage.local.get({ watchedVideos: [], videoTitles: {} }, (result) => {
        render(result.watchedVideos, result.videoTitles);
      });
    }
  });
});
