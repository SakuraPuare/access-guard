import { describe, it, expect } from 'vitest'
import { generateGuardScript } from '../src/html'

describe('generateGuardScript', () => {
  it('injects build identity and default runtime globals', () => {
    const script = generateGuardScript({
      identity: { osUsername: 'builder' },
      blocklist: ['builder'],
      silent: false,
    })

    expect(script).toContain('var buildIdentity={"osUsername":"builder"}')
    expect(script).toContain('accessGuardIdentity')
    expect(script).toContain('readBrowserIdentity')
    expect(script).toContain('Access Denied')
  })

  it('supports explicit runtime endpoint and global', () => {
    const script = generateGuardScript({
      blocklist: ['blocked'],
      silent: true,
      runtime: { global: 'myIdentity', endpoint: '/__identity', timeoutMs: 123 },
    })

    expect(script).toContain('myIdentity')
    expect(script).toContain('/__identity')
    expect(script).toContain('var timeoutMs=123')
  })

  it('can disable privileged runtime globals and endpoint', () => {
    const script = generateGuardScript({ blocklist: ['blocked'], silent: true, runtime: false })

    expect(script).toContain('var runtimeGlobals=[]')
    expect(script).toContain('var endpoint=""')
  })
})
