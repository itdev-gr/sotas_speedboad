# Scripts

## Συμπίεση βίντεο (compress-videos.sh)

Μειώνει το μέγεθος των MP4 στο `public/videos/` (hero.mp4, hero2.mp4) με ffmpeg (H.264, CRF 28).

**Απαιτείται:** [ffmpeg](https://ffmpeg.org/download.html)

- **macOS:** Εγκατάστησε το [Homebrew](https://brew.sh) και μετά: `brew install ffmpeg`
- **Windows:** Κάνε λήψη από https://ffmpeg.org/download.html και πρόσθεσε το στο PATH

**Εκτέλεση:**

```bash
npm run compress-videos
```

ή απευθείας:

```bash
bash scripts/compress-videos.sh
```

Τα αρχεία αντικαθίστανται in-place με τις συμπιεσμένες εκδόσεις.
