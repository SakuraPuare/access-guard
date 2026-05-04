import os from 'node:os'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'

export interface UserIdentity {
  osUsername: string
  gitName: string
  gitEmail: string
  hostname: string
  homedir: string
  platform: string
  arch: string
  release: string
  machineId: string
  envUser: string
}

export type IdentityField = keyof UserIdentity

const EMPTY_IDENTITY: UserIdentity = {
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

function readGitConfig(key: string): string {
  try {
    return execSync(`git config ${key}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function readCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000 }).trim()
  } catch {
    return ''
  }
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return ''
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function readMachineSeed(): string {
  switch (process.platform) {
    case 'darwin':
      return readCommand('ioreg -rd1 -c IOPlatformExpertDevice | awk -F\'"\' \'/IOPlatformUUID/{print $4}\'')
    case 'win32':
      return readCommand('wmic csproduct get UUID')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .find(line => !/^uuid$/i.test(line)) ?? ''
    case 'linux':
      return readCommand('cat /etc/machine-id') || readCommand('cat /var/lib/dbus/machine-id')
    default:
      return ''
  }
}

export function detectIdentity(): UserIdentity {
  const identity = { ...EMPTY_IDENTITY }

  try {
    const userInfo = os.userInfo()
    identity.osUsername = userInfo.username || ''
    identity.homedir = userInfo.homedir || ''
  } catch {
    // may fail in some sandboxed environments
  }

  identity.gitName = readGitConfig('user.name')
  identity.gitEmail = readGitConfig('user.email')
  identity.hostname = os.hostname?.() || ''
  identity.platform = process.platform
  identity.arch = process.arch
  identity.release = os.release?.() || ''
  identity.envUser = firstEnv('USER', 'USERNAME', 'LOGNAME')

  const machineSeed = readMachineSeed()
  identity.machineId = machineSeed ? `sha256:${hash(machineSeed)}` : ''

  return identity
}

export function normalizeIdentity(input: Partial<UserIdentity> = {}): UserIdentity {
  return { ...EMPTY_IDENTITY, ...input }
}
