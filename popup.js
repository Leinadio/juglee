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
