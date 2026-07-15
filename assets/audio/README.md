# 🎵 Audio Assets — El Buen Pastor Himnario

Place hymn audio files in this folder using the naming convention:

```
hymn_{id}.mp3
```

**Examples:**
- `hymn_1.mp3`  → Hymn #1
- `hymn_2.mp3`  → Hymn #2
- `hymn_101.mp3` → Hymn #101

## Supported Formats
- `.mp3` (recommended)
- `.m4a`
- `.wav`

## Audio Credits

Audio recordings are sourced from YouTube channels and credited
in the hymn metadata via the `audioCredit` field:

```js
audioCredit: {
  name: 'Himnario El Buen Pastor Cantado',   // Channel name
  url: 'https://youtube.com/@himnarioelbuenpastorcantad5969'  // Channel URL
}
```

Credits are also exported to:
- **Google Sheets** — `Audio Credit` and `Credit URL` columns
- **Google Doc** — Italic credit line below lyrics
- **Markdown / PDF** — 🎵 credit line with link

## After Adding Files
After placing audio files here, register them in:
`data/audioRegistry.ts`

The EBP Hymn Automator (EXE) will handle this automatically
when you use the "Browse Audio" button and "Sync to App".
