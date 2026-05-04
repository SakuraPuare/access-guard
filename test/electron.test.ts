import { describe, it, expect, vi } from 'vitest'
import { checkElectronAccess, createPreloadScript, exposeElectronIdentity } from '../src/electron'

describe('electron helpers', () => {
  it('denies access when supplied runtime identity matches', () => {
    const onDenied = vi.fn()
    const result = checkElectronAccess({
      blocklist: ['blocked-host'],
      identity: { hostname: 'blocked-host.local' },
      onDenied,
    })

    expect(result.allowed).toBe(false)
    expect(result.match.field).toBe('hostname')
    expect(result.denialHtml).toContain('Access Denied')
    expect(onDenied).toHaveBeenCalledOnce()
  })

  it('allows access when supplied identity does not match', () => {
    const result = checkElectronAccess({ blocklist: ['blocked'], identity: { osUsername: 'alice' } })
    expect(result.allowed).toBe(true)
    expect(result.denialHtml).toBeNull()
  })

  it('creates a preload script that exposes a frozen global name', () => {
    const script = createPreloadScript('myIdentity')
    expect(script).toContain('Object.defineProperty(window')
    expect(script).toContain('myIdentity')
    expect(script).toContain('writable: false')
  })

  it('exposes identity on globalThis when electron contextBridge is unavailable', () => {
    const globalName = `accessGuardTest${Date.now()}`
    const identity = exposeElectronIdentity(globalName)
    expect((globalThis as unknown as Record<string, unknown>)[globalName]).toEqual(identity)
  })
})
