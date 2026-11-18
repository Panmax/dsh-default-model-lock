/**
 * Host-side shared default model lock for `dsh-default-model-lock`.
 * Wraps the live AgentDefaultModel service so model-picker saves cannot rewrite the deployment default.
 */

export const name = 'default-model-lock'
export const inject = ['agentDefaultModel']

/** Cordis exposes a service's raw instance under this global symbol. */
const originalSymbol = Symbol.for('cordis.original')

/**
 * Wrap `saveSelection` on the live AgentDefaultModel service instance.
 * Session-local selection still flows through `agent.model.select()`; only the shared default write is dropped.
 * @param {any} ctx Cordis plugin context.
 */
export function installDefaultModelLock(ctx) {
  const service = ctx.get('agentDefaultModel')
  if (!service) throw new Error('dsh-default-model-lock: agentDefaultModel is unavailable')
  const target = service[originalSymbol] ?? service
  const saveDescriptor = Object.getOwnPropertyDescriptor(target, 'saveSelection')
  const originalSave = target.saveSelection
  if (typeof originalSave !== 'function') {
    throw new Error('dsh-default-model-lock: agentDefaultModel is missing saveSelection()')
  }
  if (!Object.isExtensible(target)) {
    throw new Error('dsh-default-model-lock: agentDefaultModel service is not extensible')
  }

  const saveSelection = async function () {}

  Object.defineProperty(target, 'saveSelection', {
    configurable: true,
    writable: true,
    enumerable: saveDescriptor?.enumerable ?? false,
    value: saveSelection,
  })

  ctx.effect(() => () => {
    if (Object.getOwnPropertyDescriptor(target, 'saveSelection')?.value === saveSelection) {
      if (saveDescriptor) Object.defineProperty(target, 'saveSelection', saveDescriptor)
      else delete target.saveSelection
    }
  }, 'default-model-lock: restore agentDefaultModel')
}

/**
 * Plugin entry point.
 * @param {any} ctx Cordis plugin context.
 */
export function apply(ctx) {
  installDefaultModelLock(ctx)
}
