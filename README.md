# access-guard

Multi-layer local access control for Vite and Electron apps. It detects local identity signals, matches them against a keyword blocklist, and denies access before the protected app starts.

> access-guard never uploads identity data. All matching is performed locally in the build process, injected HTML, or Electron process that uses the package.

## Install

```bash
npm install access-guard
```

## Usage

### Vite

```typescript
// vite.config.ts
import accessGuard from 'access-guard/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    accessGuard({
      blocklist: ['blocked-user', 'evil@example.com', 'blocked-host'],
    }),
  ],
})
```

The Vite plugin adds two protections:

| Layer | When | Mechanism |
| --- | --- | --- |
| **Build time** | `vite dev` / `vite build` | Detects Node-accessible identity and throws before Vite starts |
| **HTML runtime** | Browser page load | Injects a head-prepended inline script that checks build identity, browser signals, optional globals, and an optional same-origin endpoint before framework code runs |

### HTML runtime identity

Browsers cannot read OS usernames, Git config, or machine IDs. The injected HTML guard therefore checks:

- build-time identity embedded by the Vite plugin;
- browser-exposed signals such as user agent, platform, language, hardware concurrency, and vendor;
- optional sync globals such as `window.accessGuardIdentity` for Electron preload integration;
- optional same-origin JSON endpoint if you provide one.

```typescript
accessGuard({
  blocklist: ['blocked-host', 'blocked-user'],
  runtime: {
    global: 'accessGuardIdentity',
    endpoint: '/__access_guard_identity',
    timeoutMs: 700,
  },
})
```

Set `runtime: false` to keep only build-time embedded identity plus browser `navigator` signals.

### Electron main process

Use `access-guard/electron` in Electron main code when you want a real runtime check before creating the app window.

```typescript
import { app, BrowserWindow } from 'electron'
import { checkElectronAccess } from 'access-guard/electron'

await app.whenReady()

const guard = checkElectronAccess({
  blocklist: ['blocked-user', 'blocked-host', 'sha256:machine-hash-prefix'],
})

if (!guard.allowed) {
  const window = new BrowserWindow({ width: 480, height: 360 })
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(guard.denialHtml!)}`)
} else {
  const window = new BrowserWindow({ width: 1200, height: 800 })
  await window.loadFile('dist/index.html')
}
```

### Electron preload + HTML guard

If you already rely on the Vite-injected HTML guard, expose Electron identity from preload and let the HTML guard consume it before the app bundle runs.

```typescript
// preload.ts
import { exposeElectronIdentity } from 'access-guard/electron'

exposeElectronIdentity('accessGuardIdentity')
```

Or expose the same shape yourself:

```typescript
import { contextBridge } from 'electron'
import { getElectronIdentity } from 'access-guard/electron'

contextBridge.exposeInMainWorld('accessGuardIdentity', getElectronIdentity())
```

## Identity Detection

Node/Electron detection matches the blocklist against these fields using case-insensitive substring matching:

- `osUsername` — `os.userInfo().username`
- `gitName` — `git config user.name`
- `gitEmail` — `git config user.email`
- `hostname` — `os.hostname()`
- `homedir` — `os.userInfo().homedir`
- `platform` — `process.platform`
- `arch` — `process.arch`
- `release` — `os.release()`
- `machineId` — SHA-256 hash of OS machine UUID / machine-id where available
- `envUser` — `USER`, `USERNAME`, or `LOGNAME`

For example, the keyword `"john"` matches an OS username `john-doe`, Git name `John Smith`, email `john@example.com`, or home directory `/Users/john-doe`.

## API

### `accessGuard(options)` from `access-guard/vite`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `blocklist` | `string[]` | required | Keywords to match against identity values |
| `silent` | `boolean` | `false` | Hides matched keyword from errors and denial HTML |
| `runtime` | `object \| false` | default globals | Controls HTML runtime globals, endpoint, and timeout |

### `checkElectronAccess(options)` from `access-guard/electron`

Returns `{ allowed, identity, match, denialHtml }`. Use it in Electron main process before creating your normal application window.

### `getElectronIdentity()` from `access-guard/electron`

Returns the current Node/Electron identity snapshot.

### `exposeElectronIdentity(globalName?)` from `access-guard/electron`

Exposes the current identity snapshot to Electron renderer code via `contextBridge.exposeInMainWorld` when available, falling back to a frozen global. The Vite HTML guard reads `accessGuardIdentity` by default.

### `createPreloadScript(globalName?)` from `access-guard/electron`

Returns a small inline script that freezes the identity snapshot on `window[globalName]` for custom preload setups.

## License

MIT
