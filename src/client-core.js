/**
 * Pure client constants, locale dictionaries, theme-token styles, and selection helpers
 * for `dsh-default-model-lock`.
 */

export const PLUGIN_ID = 'dsh-default-model-lock'
export const SECTION_ID = 'default-model-lock'
export const LOCALE_NS = 'defaultModelLock'
export const SETTINGS_NAMESPACE = 'agent-default-model'

export const LOCALES = {
  en: {
    nav: 'Default model lock',
    title: 'Default model lock',
    description: 'New sessions start from this model. Switching models in a chat still applies to that session only.',
    lockActive: 'Lock is active',
    current: 'Current default',
    provider: 'Provider',
    model: 'Model',
    effort: 'Reasoning effort',
    providerDefault: 'Model default',
    chooseProvider: 'Select a provider',
    chooseModel: 'Select a model',
    save: 'Save',
    reset: 'Reset',
    saving: 'Saving…',
    saved: 'Saved. New sessions will use this selection.',
    saveFailed: 'Save failed. Refresh the page and try again.',
    loading: 'Loading the model configuration…',
    unavailable: 'This profile does not expose the agent-default-model configuration.',
    readOnly: 'This profile configuration is read-only.',
    catalogLoading: 'Loading the model catalog…',
    catalogError: 'The model catalog could not be loaded. Try again after the provider is available.',
    catalogPartial: 'Some providers could not be loaded: {names}.',
    retry: 'Retry',
    noModels: 'This provider has no available models.',
    unavailableValue: 'unavailable',
    scopeNote: 'Existing sessions keep their own recorded model. This setting only affects sessions created afterwards.',
    invalid: 'Choose a provider and a model before saving.',
  },
  zh: {
    nav: '默认模型锁定',
    title: '默认模型锁定',
    description: '新会话从这里选择的模型启动。聊天里切换模型仍只影响当前会话。',
    lockActive: '锁定已生效',
    current: '当前默认模型',
    provider: '供应商',
    model: '模型',
    effort: '推理档位',
    providerDefault: '模型默认',
    chooseProvider: '选择供应商',
    chooseModel: '选择模型',
    save: '保存',
    reset: '重置',
    saving: '保存中…',
    saved: '已保存。之后的新会话将使用该选择。',
    saveFailed: '保存失败，请刷新页面后重试。',
    loading: '正在读取模型配置…',
    unavailable: '当前 profile 没有暴露 agent-default-model 配置。',
    readOnly: '当前 profile 配置为只读。',
    catalogLoading: '正在加载模型目录…',
    catalogError: '模型目录加载失败，请等供应商恢复后重试。',
    catalogPartial: '部分供应商加载失败：{names}。',
    retry: '重试',
    noModels: '该供应商没有可用模型。',
    unavailableValue: '不可用',
    scopeNote: '已有会话保留各自记录的模型；这里只影响之后新建的会话。',
    invalid: '请先选择供应商和模型。',
  },
}

export const STYLES = {
  page: { maxWidth: 720, padding: '4px 0 32px', color: 'var(--dsw-alias-label-primary)' },
  title: { margin: '0 0 8px', fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
  description: { margin: '0 0 20px', fontSize: 13, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
  card: {
    border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 10,
    background: 'var(--dsw-alias-bg-layer-1)', padding: 16, marginBottom: 16,
  },
  status: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 600 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--dsw-alias-state-success-primary)', flex: '0 0 auto' },
  currentLabel: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 4 },
  current: {
    display: 'inline-block', padding: '2px 7px', borderRadius: 5,
    background: 'var(--dsw-alias-bg-layer-2)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 600 },
  select: {
    height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--dsw-alias-border-l1)',
    background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)',
  },
  note: { margin: '0 0 18px', fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
  actions: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 },
  primary: {
    height: 34, padding: '0 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-label-primary-foreground)', fontSize: 13, fontWeight: 600,
  },
  secondary: {
    height: 34, padding: '0 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    border: '1px solid var(--dsw-alias-border-l1)',
    background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)',
  },
  notice: { fontSize: 12, lineHeight: 1.5, color: 'var(--dsw-alias-label-secondary)' },
  warn: { fontSize: 12, lineHeight: 1.5, color: 'var(--dsw-alias-state-warn-primary)' },
  inlineNotice: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  error: { fontSize: 12, lineHeight: 1.5, color: 'var(--dsw-alias-state-error-primary)' },
  muted: { fontSize: 13, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
}

/** Normalize an unknown settings value into the three model-selection fields. */
export function selectionOf(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    provider: typeof source.provider === 'string' ? source.provider : '',
    model: typeof source.model === 'string' ? source.model : '',
    reasoningEffort: typeof source.reasoningEffort === 'string' ? source.reasoningEffort : '',
  }
}

/** Stable comparison key for a selection draft. */
export function keyOf(selection) {
  return JSON.stringify([selection.provider, selection.model, selection.reasoningEffort])
}
