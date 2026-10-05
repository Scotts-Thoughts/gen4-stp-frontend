# Silencing the Electron CSP warning and the signalR `hello` warning

These two console warnings show up in every GameHook-based Electron frontend. Neither
is an actual bug — they're noise from the dev environment. This doc explains what each
one is and how to silence it. Both fixes are small and portable; copy them into any of
the other frontends.

---

## 1. Electron "Insecure Content-Security-Policy" warning

### What you see

```
Electron Security Warning (Insecure Content-Security-Policy) This renderer process has
either no Content Security Policy set or a policy with "unsafe-eval" enabled. This
exposes users of this app to unnecessary security risks.
...
This warning will not show up once the app is packaged.
```

### Why it happens

Electron logs this warning whenever a renderer has **no** Content-Security-Policy *or*
a CSP that allows `unsafe-eval`. Our frontends load the **Vue development build**, which
relies on `eval` (i.e. `unsafe-eval`) to compile templates at runtime. So a strict CSP
that would satisfy the warning isn't viable — it would break Vue. As the message itself
notes, the warning **only appears in development** and never in a packaged build.

### Why the obvious fix doesn't work

Setting the env var in `main.js` does **not** work:

```js
// main.js — INEFFECTIVE, do not use
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
```

The warning is emitted by the **renderer** process, which does not inherit the main
process's environment. The variable has to be visible to the renderer.

### The fix

Set the flag in the renderer, **before the page's `load` event fires** (that's when
Electron runs its security check). The simplest reliable place is an inline script at the
very top of the page's `<head>`, before any other scripts:

```html
<!-- index.html -->
<head>
    <meta charset="utf-8">
    <title>...</title>
    <!-- Silence Electron's dev-only insecure-CSP warning. The Vue dev build needs
         `unsafe-eval`, so a strict CSP isn't viable; this never shows once packaged. -->
    <script>window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;</script>
    <link rel="stylesheet" href="style.css">
</head>
```

Electron's check honors either `process.env.ELECTRON_DISABLE_SECURITY_WARNINGS` or the
`window.ELECTRON_DISABLE_SECURITY_WARNINGS` global. The `window` global is the one we can
set from the renderer, so that's what we use.

### Applying to another frontend

1. Open that frontend's `index.html` (the HTML loaded into the BrowserWindow).
2. Add the `<script>window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;</script>` line as
   the **first** thing inside `<head>`, before any `<script>`/`<link>` tags.
3. Reload. The warning is gone.

> Note: this only hides the dev warning. If you ever want to actually *resolve* it (rather
> than silence it), you'd ship the Vue **runtime build** + precompiled templates and set a
> real CSP without `unsafe-eval`. That's a bigger change and unnecessary for an internal
> overlay.

---

## 2. signalR `No client method with the name 'hello' found` warning

### What you see

```
[2026-06-17T20:43:24.385Z] Warning: No client method with the name 'hello' found.
```

### Why it happens

GameHook's SignalR hub invokes a `hello` message on the client (a handshake/keep-alive).
SignalR dispatches incoming server calls to handlers registered with
`connection.on('<name>', ...)`. If no handler is registered for `hello`, SignalR logs this
warning every time the server sends it. We don't need the message — we just need a handler
to exist so the dispatcher stops complaining.

### The fix

Register a no-op handler next to the other `.on(...)` registrations where the SignalR
client is set up (in this project, `app/packages/gameHookMapperClient.js`):

```js
this._signalrClient.on('UiBuilderScreenSaved', (id) => { this.onUiBuilderScreenSaved(id) })
// GameHook sends a 'hello' keep-alive/handshake we don't use; register a
// no-op handler so SignalR doesn't log a "No client method 'hello' found" warning.
this._signalrClient.on('hello', () => {})
```

### Applying to another frontend

1. Find where that frontend builds its SignalR client — look for
   `new signalR.HubConnectionBuilder()` and the block of `.on('...')` registrations.
   (Often a `gameHookMapperClient.js` or similar.)
2. Add `<client>.on('hello', () => {})` alongside the existing `.on(...)` calls, where
   `<client>` is whatever the connection is stored in (e.g. `this._signalrClient`,
   `connection`, `hubConnection`).
3. Reload. The warning is gone.

> Alternative: you can also raise the log level with
> `.configureLogging(signalR.LogLevel.Error)` so warnings are suppressed wholesale — but
> that hides *all* warnings, not just `hello`. The no-op handler is the targeted fix and is
> preferred.
