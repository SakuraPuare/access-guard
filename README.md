# access-guard

Multi-layer developer access control for build tools. Detect OS username, Git identity, and match against a keyword blocklist to deny unauthorized access at both build time and runtime.

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
      blocklist: ['blocked-user', 'evil@example.com'],
    }),
  ],
})
```

## How It Works

access-guard provides two layers of protection:

| Layer | When | Mechanism |
|-------|------|-----------|
| **Build time** | `vite dev` / `vite build` | Detects identity and throws an error to halt the process |
| **Runtime** | Browser page load | Injects an inline script into `index.html` that checks identity before any framework code runs |

### Identity Detection

The following identity sources are checked against the blocklist using **case-insensitive substring matching**:

- **OS username** — `os.userInfo().username`
- **Git name** — `git config user.name`
- **Git email** — `git config user.email`

For example, the keyword `"john"` would match a user with OS username `john-doe`, git name `John Smith`, or email `john@example.com`.

## API

### `accessGuard(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blocklist` | `string[]` | *required* | Keywords to match against user identities |
| `silent` | `boolean` | `false` | When `true`, hides the matched keyword from error output |

## License

MIT
