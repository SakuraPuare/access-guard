import { describe, expect, it } from 'vitest'
import accessGuard from '../src/vite'

describe('vite plugin', () => {
  it('injects the runtime guard into index html', () => {
    const plugin = accessGuard({ blocklist: ['definitely-not-current-user'], runtime: { global: 'customIdentity' } })
    const tags = plugin.transformIndexHtml()

    expect(tags).toHaveLength(1)
    expect(tags[0].injectTo).toBe('head-prepend')
    expect(tags[0].children).toContain('customIdentity')
    expect(tags[0].children).toContain('readBrowserIdentity')
  })

  it('throws during config resolution when build identity is blocked', () => {
    const plugin = accessGuard({ blocklist: [process.env.USER || ''] })

    expect(() => plugin.configResolved()).toThrow('ACCESS DENIED')
  })
})
