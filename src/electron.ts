import { detectIdentity, matchBlocklist, normalizeIdentity } from './core'
import type { MatchResult, UserIdentity } from './core'
import { generateDenialHtml } from './html'

export interface ElectronAccessGuardOptions {
  blocklist: string[]
  silent?: boolean
  identity?: Partial<UserIdentity>
  onDenied?: (result: MatchResult, identity: UserIdentity) => void
}

export interface ElectronAccessGuardResult {
  allowed: boolean
  identity: UserIdentity
  match: MatchResult
  denialHtml: string | null
}

interface ElectronContextBridge {
  exposeInMainWorld(name: string, api: unknown): void
}

interface ElectronModule {
  contextBridge?: ElectronContextBridge
}

export function checkElectronAccess(options: ElectronAccessGuardOptions): ElectronAccessGuardResult {
  const { blocklist, silent = false } = options
  const identity = options.identity ? normalizeIdentity(options.identity) : detectIdentity()
  const match = matchBlocklist(identity, blocklist)
  const allowed = !match.matched
  const denialHtml = allowed ? null : generateDenialHtml(match.keyword || '', silent)

  if (!allowed) {
    options.onDenied?.(match, identity)
  }

  return { allowed, identity, match, denialHtml }
}

export function getElectronIdentity(): UserIdentity {
  return detectIdentity()
}

export function exposeElectronIdentity(globalName = 'accessGuardIdentity'): UserIdentity {
  const identity = detectIdentity()
  const contextBridge = loadContextBridge()

  if (contextBridge) {
    contextBridge.exposeInMainWorld(globalName, identity)
    return identity
  }

  const root = globalThis as typeof globalThis & { window?: Record<string, unknown> }
  const target = root.window && typeof root.window === 'object' ? root.window : root
  Object.defineProperty(target, globalName, {
    value: identity,
    enumerable: false,
    configurable: false,
    writable: false,
  })

  return identity
}

export function createPreloadScript(globalName = 'accessGuardIdentity'): string {
  const identity = detectIdentity()
  return `;Object.defineProperty(window, ${JSON.stringify(globalName)}, { value: ${JSON.stringify(identity)}, enumerable: false, configurable: false, writable: false });`
}

function loadContextBridge(): ElectronContextBridge | null {
  try {
    const cjsRequire = Function('try { return typeof require === \"function\" ? require : null } catch (_) { return null }')() as
      | ((id: string) => unknown)
      | null

    if (!cjsRequire) return null

    const electron = cjsRequire('electron') as ElectronModule
    return electron.contextBridge || null
  } catch {
    return null
  }
}
