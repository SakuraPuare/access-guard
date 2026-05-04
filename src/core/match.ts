import type { IdentityField, UserIdentity } from './detect'

export interface MatchResult {
  matched: boolean
  keyword: string | null
  identity: string | null
  field: IdentityField | null
}

const NO_MATCH: MatchResult = { matched: false, keyword: null, identity: null, field: null }

export const IDENTITY_FIELDS = [
  'osUsername',
  'gitName',
  'gitEmail',
  'hostname',
  'homedir',
  'platform',
  'arch',
  'release',
  'machineId',
  'envUser',
] as const satisfies readonly IdentityField[]

export function matchBlocklist(identity: UserIdentity, blocklist: string[]): MatchResult {
  for (const keyword of blocklist) {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) continue

    for (const field of IDENTITY_FIELDS) {
      const value = identity[field]
      if (value && value.toLowerCase().includes(normalizedKeyword)) {
        return { matched: true, keyword, identity: value, field }
      }
    }
  }

  return NO_MATCH
}
