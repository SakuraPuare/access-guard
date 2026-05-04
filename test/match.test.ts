import { describe, it, expect } from 'vitest'
import { matchBlocklist } from '../src/core/match'
import type { UserIdentity } from '../src/core/detect'

const identity: UserIdentity = {
  osUsername: 'john-doe',
  gitName: 'John Doe',
  gitEmail: 'john@example.com',
  hostname: 'johns-macbook',
  homedir: '/Users/john-doe',
  platform: 'darwin',
  arch: 'arm64',
  release: '25.0.0',
  machineId: 'sha256:abc123',
  envUser: 'john',
}

describe('matchBlocklist', () => {
  it('returns no match for empty blocklist', () => {
    const result = matchBlocklist(identity, [])
    expect(result.matched).toBe(false)
    expect(result.keyword).toBeNull()
  })

  it('matches OS username by substring', () => {
    const result = matchBlocklist(identity, ['john-doe'])
    expect(result.matched).toBe(true)
    expect(result.field).toBe('osUsername')
    expect(result.keyword).toBe('john-doe')
  })

  it('matches git name by substring', () => {
    const result = matchBlocklist(identity, ['john doe'])
    expect(result.matched).toBe(true)
    expect(result.field).toBe('gitName')
  })

  it('matches git email by substring', () => {
    const result = matchBlocklist(identity, ['@example.com'])
    expect(result.matched).toBe(true)
    expect(result.field).toBe('gitEmail')
  })

  it('matches host and machine fields', () => {
    expect(matchBlocklist(identity, ['macbook']).field).toBe('hostname')
    expect(matchBlocklist(identity, ['abc123']).field).toBe('machineId')
    expect(matchBlocklist(identity, ['/users/john']).field).toBe('homedir')
  })

  it('is case-insensitive', () => {
    const result = matchBlocklist(identity, ['JOHN-DOE'])
    expect(result.matched).toBe(true)
  })

  it('matches partial substring', () => {
    const result = matchBlocklist(identity, ['john'])
    expect(result.matched).toBe(true)
  })

  it('returns no match when nothing matches', () => {
    const result = matchBlocklist(identity, ['alice', 'bob', 'charlie'])
    expect(result.matched).toBe(false)
  })

  it('skips empty and whitespace-only keywords', () => {
    const result = matchBlocklist(identity, ['', '  ', '\t'])
    expect(result.matched).toBe(false)
  })

  it('trims keywords before matching', () => {
    const result = matchBlocklist(identity, ['  john-doe  '])
    expect(result.matched).toBe(true)
  })

  it('returns identity value in result', () => {
    const result = matchBlocklist(identity, ['example.com'])
    expect(result.matched).toBe(true)
    expect(result.identity).toBe('john@example.com')
  })

  it('handles identity with empty fields', () => {
    const partial: UserIdentity = {
      osUsername: 'user',
      gitName: '',
      gitEmail: '',
      hostname: '',
      homedir: '',
      platform: '',
      arch: '',
      release: '',
      machineId: '',
      envUser: '',
    }
    const result = matchBlocklist(partial, ['user'])
    expect(result.matched).toBe(true)
    expect(result.field).toBe('osUsername')
  })

  it('does not match empty identity fields', () => {
    const empty: UserIdentity = {
      osUsername: '',
      gitName: '',
      gitEmail: '',
      hostname: '',
      homedir: '',
      platform: '',
      arch: '',
      release: '',
      machineId: '',
      envUser: '',
    }
    const result = matchBlocklist(empty, ['anything'])
    expect(result.matched).toBe(false)
  })
})
