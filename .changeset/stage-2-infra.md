---
"@jrocha-io/audio": minor
"@jrocha-io/logging": minor
"@jrocha-io/model-fetch": minor
"@jrocha-io/tts": patch
---

Stage 2: infra packages.

- `@jrocha-io/audio`: `AudioPlayer` port + `WebAudioPlayer` (single persistent AudioContext) + PCM normalization (peak/gain, Int16→Float32).
- `@jrocha-io/logging`: `Logger` port + Console/Dom/Multi sinks + `mirrorConsole` (captures the sherpa `exit(-1)` reason).
- `@jrocha-io/model-fetch`: `ModelFetcher` DAO — fetch + Cache API + streaming progress + first-download timestamp, all deps injectable.

`@jrocha-io/tts`: moved `peakOf`/`gainFromPeak` to `@jrocha-io/audio` (their natural home). Pre-publish, no consumers.
