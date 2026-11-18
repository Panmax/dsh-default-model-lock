import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createClientPlugin } from '../src/client-entry.js'
import { generateClientBundle } from '../scripts/build-client.mjs'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

function makeReact() {
  return {
    createElement(type, props, ...children) {
      return { type, props: Object.assign({}, props || {}, { children: children.length === 1 ? children[0] : children }) }
    },
    useCallback(fn) { return fn },
    useEffect() {},
    useState(initial) { return [initial, () => {}] },
    useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot() },
  }
}

test('built client.js stays in sync with its sources', () => {
  const disk = readFileSync(resolve(rootDir, 'client.js'), 'utf8')
  assert.equal(disk, generateClientBundle())
})

test('client plugin registers the settings section and icon', () => {
  const registrations = []
  let Section
  const form = {
    subscribe() { return () => {} },
    getSnapshot() {
      return {
        status: 'ready',
        value: { provider: 'magpie', model: 'auto/deepseek-v4.1-flash', reasoningEffort: 'max' },
        revision: 1,
        writable: true,
      }
    },
  }
  const ctx = {
    effect(factory) { return factory() },
    locale: { register() {}, bind() { return key => key } },
    configForms: {
      get() { return form },
      whileServed(_namespaces, register) { return register(new Set(_namespaces)) },
    },
    remote: {
      session: {
        async modelCatalog() {
          return {
            ok: true,
            value: {
              groups: [{
                id: 'magpie',
                name: 'Magpie',
                models: [{
                  id: 'auto/deepseek-v4.1-flash',
                  name: 'DeepSeek V4.1 Flash',
                  reasoning: { efforts: [{ id: 'max', name: 'Max' }], defaultEffort: 'max' },
                }],
              }],
              failures: [],
            },
          }
        },
      },
    },
    slots: {
      inject(name, register) { return register() },
      register(spec, component) {
        registrations.push(`${spec.name}:${spec.id}`)
        if (spec.name === 'settings.section') Section = component
        return () => {}
      },
    },
  }

  const plugin = createClientPlugin(makeReact())
  assert.equal(plugin.name, 'dsh-default-model-lock')
  assert.deepEqual(plugin.inject, ['slots', 'locale', 'remote', 'remote.session', 'configForms'])
  plugin.apply(ctx)

  assert.ok(registrations.includes('settings.section:default-model-lock'))
  assert.ok(registrations.includes('settings.section.icon:default-model-lock'))

  const tree = Section({ t: key => key, form, loadCatalog: ctx.remote.session.modelCatalog })
  const rendered = JSON.stringify(tree)
  for (const expected of ['title', 'current', 'provider', 'model', 'effort', 'save', 'reset']) {
    assert.ok(rendered.includes(expected), `missing rendered label: ${expected}`)
  }
})
