import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(rootDir, relativePath), 'utf8'))
}

test('package manifest and bundle metadata are publication-ready', () => {
  const pkg = readJson('package.json')
  assert.equal(pkg.name, 'dsh-default-model-lock')
  assert.equal(pkg.private, undefined)
  assert.equal(pkg.license, 'MIT')
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh?.client?.platform, 'web')
  assert.ok(pkg.files.includes('client.js'))
  assert.ok(pkg.files.includes('src'))
  assert.ok(pkg.files.includes('docs'))
  assert.equal(typeof pkg.scripts?.build, 'string')
  assert.equal(typeof pkg.scripts?.test, 'string')
})

test('bundle patch points at the published package name', () => {
  const patch = readFileSync(resolve(rootDir, 'cordis.patch.yml'), 'utf8')
  assert.match(patch, /name: 'dsh-default-model-lock'/)
})

test('locale metadata and detail documents are complete', () => {
  const en = readJson('locale/en.json')
  const zh = readJson('locale/zh.json')
  assert.ok(en.meta?.title && en.meta.description && en.meta.detail)
  assert.ok(zh.meta?.title && zh.meta.description && zh.meta.detail)
  assert.equal(en.meta.detail, 'docs/DETAIL.md')
  assert.equal(zh.meta.detail, 'docs/DETAIL.zh.md')
  assert.match(readFileSync(resolve(rootDir, 'docs/DETAIL.md'), 'utf8').trim(), /^!\[[^\]]+\]\(preview\.svg\)$/)
  assert.match(readFileSync(resolve(rootDir, 'docs/DETAIL.zh.md'), 'utf8').trim(), /^!\[[^\]]+\]\(preview\.zh\.svg\)$/)
})

test('icon is a self-contained 36px SVG', () => {
  const icon = readFileSync(resolve(rootDir, 'icon.svg'), 'utf8')
  assert.match(icon, /viewBox="0 0 36 36"/)
  assert.doesNotMatch(icon, /<(?:script|style|text|image|foreignObject)\b/i)
})
