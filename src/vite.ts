import type { Plugin } from 'vite'
import { detectIdentity, matchBlocklist } from './core'
import { generateGuardScript } from './html'

export interface AccessGuardOptions {
  /** Keywords to match against OS username, git name, and git email (case-insensitive substring match) */
  blocklist: string[]
  /** Don't reveal the matched keyword in error messages (default: false) */
  silent?: boolean
}

export default function accessGuard(options: AccessGuardOptions): Plugin {
  const { blocklist, silent = false } = options

  if (!blocklist || blocklist.length === 0) {
    return { name: 'access-guard' }
  }

  const identity = detectIdentity()
  const result = matchBlocklist(identity, blocklist)

  return {
    name: 'access-guard',
    enforce: 'pre',

    configResolved() {
      if (!result.matched) return

      const lines = [
        '',
        '\x1b[41m\x1b[37m ACCESS DENIED \x1b[0m',
        '',
        '\x1b[31mYou are not authorized to use this project.\x1b[0m',
        '',
      ]

      if (!silent) {
        lines.push(
          `  OS Username : ${identity.osUsername || '(unknown)'}`,
          `  Git Name    : ${identity.gitName || '(unknown)'}`,
          `  Git Email   : ${identity.gitEmail || '(unknown)'}`,
          '',
          `  Matched     : \x1b[31m${result.keyword}\x1b[0m (in ${result.field})`,
          '',
        )
      }

      throw new Error(lines.join('\n'))
    },

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          // Strip the outer <script> tags since Vite adds them via the tag property
          children: generateGuardScript(identity, blocklist, silent)
            .replace(/^<script>\n?/, '')
            .replace(/\n?<\/script>$/, ''),
          injectTo: 'head-prepend' as const,
        },
      ]
    },
  }
}
