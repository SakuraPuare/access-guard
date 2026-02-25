import os from 'node:os'
import { execSync } from 'node:child_process'

export interface UserIdentity {
  osUsername: string
  gitName: string
  gitEmail: string
}

function readGitConfig(key: string): string {
  try {
    return execSync(`git config ${key}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

export function detectIdentity(): UserIdentity {
  let osUsername = ''
  try {
    osUsername = os.userInfo().username
  } catch {
    // may fail in some sandboxed environments
  }

  return {
    osUsername,
    gitName: readGitConfig('user.name'),
    gitEmail: readGitConfig('user.email'),
  }
}
