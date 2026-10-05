---
name: verify
description: Run the gen4 overlay against a SuperShuckie replay and observe its state at runtime.
---

# Verifying the overlay at runtime

Needs SuperShuckie (HTTP API on 127.0.0.1:30158) and PokeAByte (localhost:8085) already running with the ROM loaded.

## Launch (isolated from real splits and settings)

Splits are written to `./splits` relative to the cwd, and settings live in localStorage, so run from a scratch dir with a copied profile:

```bash
mkdir -p $SCRATCH/run && cp -r "$APPDATA/gen4-overlay-app" $SCRATCH/userdata
cd $SCRATCH/run && A:/Programs/gen4-stp-frontend/node_modules/electron/dist/electron.exe "A:\Programs\gen4-stp-frontend" \
  --user-data-dir="<windows path to $SCRATCH/userdata>" --remote-debugging-port=9333 &
```

Load the mapper if PokeAByte reports MAPPER_NOT_LOADED:
`curl -X PUT -H "Content-Type: application/json" -d '"ST/gen4/pokemon_platinum_ne.xml"' http://localhost:8085/mapper-service/change-mapper`

## Drive

- Overlay control server, 127.0.0.1:30159: `/status`, `/set-starter?species=`, `/set-evolution?enabled=true&species=`, `/reload`, `/quit`.
- Emulator, 127.0.0.1:30158: `/enumerate-replays`, `/load-replay?name=` (loads paused), `/go-to-frame?frame=`, `/set-paused?paused=false`, `/set-playback-speed?speed=`, `/stats`.
- Mapper values: `GET http://localhost:8085/mapper` (`properties` list of `{path, value}`).
- Renderer state and screenshots: `node cdp.mjs eval "<expr>"` / `node cdp.mjs shot out.png` (next to this file; needs Node 22). The Vue instance is `document.querySelector('#app').__vue_app__._instance.proxy`.

To reach an event quickly, bisect with `/go-to-frame` on a mapper value, then jump ~1500 frames before it and unpause.

## Gotchas

- `/set-starter` with a Wormadam/Shaymin form writes the form byte to the emulator; use the base species when a replay is playing.
- Burmy evolves at about frame 638k-641k in the p-wormadam-line-* replays. The form byte is not stable for up to ~1.3s after the species changes.
- Timing-dependent bugs may not reproduce on every run; repeat a few times.
- Unload the mapper and `/quit` the overlay when done; the emulator is left paused inside the replay.
