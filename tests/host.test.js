import assert from 'node:assert/strict'
import test from 'node:test'

import { apply, inject, name } from '../index.js'
import { installDefaultModelLock } from '../src/host.js'

test('host plugin exports the expected Cordis entry shape', () => {
  assert.equal(name, 'default-model-lock')
  assert.deepEqual(inject, ['agentDefaultModel'])
  assert.equal(typeof apply, 'function')
})

test('installs a saveSelection no-op and restores the original method on teardown', async () => {
  let saved = false
  const service = {
    currentSelection() { return { provider: 'magpie', model: 'auto/deepseek-v4.1-flash', reasoningEffort: 'max' } },
    async saveSelection() { saved = true },
  }
  let cleanup
  const ctx = {
    get(serviceName) { return serviceName === 'agentDefaultModel' ? service : undefined },
    effect(factory) { cleanup = factory(); return cleanup },
  }

  installDefaultModelLock(ctx)
  assert.deepEqual(service.currentSelection(), { provider: 'magpie', model: 'auto/deepseek-v4.1-flash', reasoningEffort: 'max' })
  await service.saveSelection({ provider: 'other', model: 'other' })
  assert.equal(saved, false, 'saveSelection must be a no-op while the lock is installed')

  cleanup()
  await service.saveSelection({ provider: 'other', model: 'other' })
  assert.equal(saved, true, 'the original saveSelection must return after cleanup')
})
