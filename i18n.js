const I18N = {
  fr: {
    videosWatched: "vidéos vues",
    recentTitle: "Dernières vidéos marquées",
    emptyState: "Aucune vidéo marquée",
    export: "Exporter",
    import: "Importer",
    clearAll: "Tout effacer",
    clearConfirm: "Effacer toutes les vidéos marquées ?",
    invalidFile: "Fichier invalide. Utilisez un fichier exporté par l'extension.",
    watched: "Vu",
    remove: "Retirer",
    markAsWatched: "Marquer comme vu",
  },
  en: {
    videosWatched: "videos watched",
    recentTitle: "Recently marked videos",
    emptyState: "No videos marked",
    export: "Export",
    import: "Import",
    clearAll: "Clear all",
    clearConfirm: "Clear all marked videos?",
    invalidFile: "Invalid file. Use a file exported by the extension.",
    watched: "Seen",
    remove: "Remove",
    markAsWatched: "Mark as watched",
  },
};

let __ywLang = "fr";

function setLang(lang) {
  __ywLang = lang;
  chrome.storage.local.set({ lang });
}

function t(key) {
  return I18N[__ywLang]?.[key] || I18N.fr[key] || key;
}

function loadLang() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ lang: "fr" }, (result) => {
      __ywLang = result.lang;
      resolve(__ywLang);
    });
  });
}
