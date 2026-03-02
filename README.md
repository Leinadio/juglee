# Juglee — YouTube Watch Tracker

A Chrome extension (Manifest V3) that lets you manually mark YouTube videos as watched and displays a visual badge on their thumbnails so you never lose track of what you've already seen.

---

## Features

- **Mark videos as watched** — Click the button that appears on hover over any thumbnail or directly on the video player
- **Visual badges** — A green checkmark badge appears on thumbnails of watched videos across all YouTube surfaces: homepage, search, channel pages, playlists, and Shorts
- **Quick access from popup** — See your 10 most recently marked videos with direct links to YouTube
- **Export / Import** — Back up your watch history as JSON or restore it on another device
- **Auto-cleanup** — Automatically removes the oldest entries when local storage reaches 9 MB
- **Bilingual UI** — Switch between French and English from the popup
- **100% local** — All data is stored in your browser via `chrome.storage.local`. Nothing is ever sent to a server.

---

## Installation

> The extension is not yet published on the Chrome Web Store. You can load it manually.

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `juglee-extension` folder
5. The extension icon will appear in your toolbar — pin it for easy access

---

## How It Works

### Marking a video

Hover over any YouTube thumbnail — a small button appears in the bottom-left corner. Click it to toggle the watched state.

- **Unwatched** → button shows an eye icon + label
- **Watched** → button turns green with a checkmark

The same button is available in the top-left corner of the video player while watching.

### Popup

Click the extension icon to open the popup:

- Total number of watched videos
- The 10 most recently marked videos (clickable links)
- Language toggle (FR / EN)
- **Export** — Downloads your history as a timestamped JSON file
- **Import** — Merges a previously exported JSON file with your current history
- **Clear all** — Deletes all watched video records (with confirmation)

---

## Storage

Data is stored in `chrome.storage.local` with the following structure:
The storage limit is 10 MB. When the data exceeds **9 MB**, the oldest entries are automatically removed to stay within bounds.

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist watched videos and user preferences locally |
| `*://*.youtube.com/*` | Inject buttons and badges on YouTube pages |

No other permissions are requested. No external network requests are made.

---
