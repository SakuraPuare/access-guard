import type { UserIdentity } from './detect'

export interface MatchResult {
  matched: boolean
  keyword: string | null
  identity: string | null
  field: keyof UserIdentity | null
}

const NO_MATCH: MatchResult = { matched: false, keyword: null, identity: null, field: null }

export function matchBlocklist(identity: UserIdentity, blocklist: string[]): MatchResult {
  const fields = ['osUsername', 'gitName', 'gitEmail'] as const

  for (const keyword of blocklist) {
    const k = keyword.trim().toLowerCase()
    if (!k) continue

    for (const field of fields) {
      const value = identity[field]
      if (value && value.toLowerCase().includes(k)) {
        return { matched: true, keyword, identity: value, field }
      }
    }
  }

  return NO_MATCH
}
