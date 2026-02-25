import { describe, it, expect } from 'vitest'
import { detectIdentity } from '../src/core/detect'

describe('detectIdentity', () => {
  it('returns an object with osUsername, gitName, gitEmail', () => {
    const identity = detectIdentity()
    expect(identity).toHaveProperty('osUsername')
    expect(identity).toHaveProperty('gitName')
    expect(identity).toHaveProperty('gitEmail')
  })

  it('osUsername is a non-empty string', () => {
    const identity = detectIdentity()
    expect(typeof identity.osUsername).toBe('string')
    expect(identity.osUsername.length).toBeGreaterThan(0)
  })

  it('gitName and gitEmail are strings', () => {
    const identity = detectIdentity()
    expect(typeof identity.gitName).toBe('string')
    expect(typeof identity.gitEmail).toBe('string')
  })
})
