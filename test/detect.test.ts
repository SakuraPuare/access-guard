import { describe, it, expect } from 'vitest'
import { detectIdentity, normalizeIdentity } from '../src/core/detect'

describe('detectIdentity', () => {
  it('returns all supported identity fields', () => {
    const identity = detectIdentity()
    expect(identity).toHaveProperty('osUsername')
    expect(identity).toHaveProperty('gitName')
    expect(identity).toHaveProperty('gitEmail')
    expect(identity).toHaveProperty('hostname')
    expect(identity).toHaveProperty('homedir')
    expect(identity).toHaveProperty('platform')
    expect(identity).toHaveProperty('arch')
    expect(identity).toHaveProperty('release')
    expect(identity).toHaveProperty('machineId')
    expect(identity).toHaveProperty('envUser')
  })

  it('osUsername is a non-empty string', () => {
    const identity = detectIdentity()
    expect(typeof identity.osUsername).toBe('string')
    expect(identity.osUsername.length).toBeGreaterThan(0)
  })

  it('normalizes partial identities', () => {
    const identity = normalizeIdentity({ osUsername: 'alice' })
    expect(identity.osUsername).toBe('alice')
    expect(identity.gitEmail).toBe('')
    expect(identity.machineId).toBe('')
  })
})
