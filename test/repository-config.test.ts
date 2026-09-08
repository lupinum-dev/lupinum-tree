// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vite-plus/test'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const repositoryRoot = new URL('..', import.meta.url)

describe('repository operations', () => {
  it('keeps this app private to npm with complete verification commands', async () => {
    const packageJson = JSON.parse(await read('package.json'))

    expect(packageJson.private).toBe(true)
    expect(packageJson.scripts).toMatchObject({
      'audit:all': 'pnpm audit',
      'docs:build': 'pnpm build',
      verify: 'vp check && vp test && pnpm build',
      'release:verify': 'pnpm audit:all && pnpm verify',
    })
    expect(packageJson.scripts).not.toHaveProperty('publish')
  })

  it('enforces dependency quarantine and pinned GitHub Actions', async () => {
    const [workspace, ci] = await Promise.all([
      read('pnpm-workspace.yaml'),
      read('.github/workflows/ci.yml'),
    ])

    expect(workspace).toContain('minimumReleaseAge: 1440')
    expect(workspace).toContain('minimumReleaseAgeStrict: true')
    expect(ci).not.toMatch(/uses:\s*[^\n]+@(v\d+|main|master)\b/u)
    expect(ci).toContain('persist-credentials: false')
    expect(ci).toContain('pnpm verify')
    expect(ci).toContain('pull_request:')
    expect(ci).not.toContain('pull_request: { branches: [main] }')
  })

  it('keeps deployment static and rooted in this repository', async () => {
    const vercel = JSON.parse(await read('vercel.json'))

    expect(vercel).toMatchObject({
      framework: 'vite',
      buildCommand: 'pnpm build',
      outputDirectory: 'dist',
    })
    expect(vercel).not.toHaveProperty('functions')
  })

  it('builds when the Vercel baseline is missing and skips an unchanged source', async () => {
    const runIgnoreCheck = (previousSha?: string) =>
      spawnSync(process.execPath, ['scripts/vercel-ignore.mjs'], {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          VERCEL_GIT_PREVIOUS_SHA: previousSha ?? '',
        },
      }).status

    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }).stdout.trim()

    expect(runIgnoreCheck()).toBe(1)
    expect(runIgnoreCheck('0000000000000000000000000000000000000000')).toBe(1)
    expect(runIgnoreCheck(head)).toBe(0)
  })

  it('keeps the Vercel deployment boundary aligned with the static app', async () => {
    const [ignoreScript, stylesheet] = await Promise.all([
      read('scripts/vercel-ignore.mjs'),
      read('src/style.css'),
    ])

    for (const path of [
      "'src'",
      "'public'",
      "'index.html'",
      "'scripts/prerender.mjs'",
      "'vite.config.ts'",
      "'vercel.json'",
      "'package.json'",
      "'pnpm-lock.yaml'",
      "'pnpm-workspace.yaml'",
    ]) {
      expect(ignoreScript).toContain(path)
    }

    expect(stylesheet).toContain("@import 'tailwindcss' source(none);")
    expect(stylesheet).toContain("@source '.';")
    expect(stylesheet).toContain("@source '../index.html';")
  })
})
