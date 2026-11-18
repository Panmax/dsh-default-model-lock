/**
 * Browser client entry logic for `dsh-default-model-lock`.
 * Bundled with `src/client-core.js` into root `client.js` for `window.__ModuleLoader__`.
 */

import {
  keyOf,
  LOCALES,
  LOCALE_NS,
  PLUGIN_ID,
  SECTION_ID,
  selectionOf,
  SETTINGS_NAMESPACE,
  STYLES,
} from './client-core.js'

/**
 * Build the Cordis client plugin definition given `React` from the browser module table.
 * @param {any} React React runtime supplied by the DSH client module loader.
 */
export function createClientPlugin(React) {
  const h = React.createElement
  const { useCallback, useEffect, useState, useSyncExternalStore } = React

  /** Small lock glyph for the Settings navigation row. */
  function LockIcon(props) {
    const size = props.size || 16
    return h('svg', {
      width: size, height: size, viewBox: '0 0 36 36', 'aria-hidden': true,
      style: { display: 'block' },
    },
    h('path', { d: 'M12 16V12a6 6 0 0 1 12 0v4', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' }),
    h('rect', { x: 8, y: 16, width: 20, height: 14, rx: 3, fill: 'currentColor' }),
    h('circle', { cx: 18, cy: 22, r: 2, fill: 'var(--dsw-alias-bg-base)' }),
    h('rect', { x: 17, y: 22.5, width: 2, height: 5, rx: 1, fill: 'var(--dsw-alias-bg-base)' }))
  }

  /** Settings section over the official agent-default-model config form. */
  function DefaultModelLockSection(props) {
    const { t, form, loadCatalog } = props
    const styles = STYLES

    const formState = useSyncExternalStore(
      useCallback(listener => form.subscribe(listener), [form]),
      useCallback(() => form.getSnapshot(), [form]),
    )
    const [catalog, setCatalog] = useState({ status: 'loading', groups: [], failures: [] })
    const [draft, setDraft] = useState(null)
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState(null)
    const [catalogAttempt, setCatalogAttempt] = useState(0)

    const saved = selectionOf(formState.value)
    const savedKey = keyOf(saved)

    useEffect(() => {
      if (formState.status === 'ready' && draft === null) setDraft(saved)
    }, [formState.status, draft, savedKey])

    useEffect(() => {
      let live = true
      setCatalog({ status: 'loading', groups: [], failures: [] })
      loadCatalog().then(value => {
        if (!live) return
        setCatalog({ status: 'ready', groups: Array.isArray(value.groups) ? value.groups : [], failures: Array.isArray(value.failures) ? value.failures : [] })
      }).catch(error => {
        if (live) setCatalog({ status: 'error', groups: [], failures: [], message: String(error) })
      })
      return () => { live = false }
    }, [loadCatalog, catalogAttempt])

    const current = draft || saved
    const dirty = draft !== null && keyOf(current) !== savedKey
    const groups = catalog.groups || []
    const group = groups.find(candidate => candidate.id === current.provider)
    const models = group && Array.isArray(group.models) ? group.models : []
    const model = models.find(candidate => candidate.id === current.model)
    const efforts = model && model.reasoning && Array.isArray(model.reasoning.efforts) ? model.reasoning.efforts : []
    const readOnly = formState.status === 'ready' && !formState.writable
    const catalogReady = catalog.status === 'ready'
    const canSave = formState.status === 'ready' && formState.writable && catalogReady
      && current.provider !== '' && current.model !== '' && dirty && !saving
    const reloadCatalog = () => setCatalogAttempt(value => value + 1)
    const failedNames = Array.isArray(catalog.failures) ? catalog.failures.map(failure => failure.name || failure.id).join(', ') : ''

    const edit = (patch) => {
      setNotice(null)
      setDraft(Object.assign({}, current, patch))
    }

    const providerOptions = groups.map(candidate => ({ id: candidate.id, name: candidate.name || candidate.id }))
    if (current.provider !== '' && !providerOptions.some(option => option.id === current.provider)) {
      providerOptions.unshift({ id: current.provider, name: t('unavailableValue') })
    }
    const modelOptions = models.map(candidate => ({ id: candidate.id, name: candidate.name || candidate.id }))
    if (current.model !== '' && !modelOptions.some(option => option.id === current.model)) {
      modelOptions.unshift({ id: current.model, name: t('unavailableValue') })
    }
    const effortOptions = efforts.map(candidate => ({ id: candidate.id, name: candidate.name || candidate.id }))
    if (current.reasoningEffort !== '' && !effortOptions.some(option => option.id === current.reasoningEffort)) {
      effortOptions.unshift({ id: current.reasoningEffort, name: t('unavailableValue') })
    }

    const save = async () => {
      if (!canSave) return
      setSaving(true)
      setNotice(null)
      const ops = [
        { op: 'set', path: ['provider'], value: current.provider },
        { op: 'set', path: ['model'], value: current.model },
        current.reasoningEffort === ''
          ? { op: 'unset', path: ['reasoningEffort'] }
          : { op: 'set', path: ['reasoningEffort'], value: current.reasoningEffort },
      ]
      try {
        const accepted = await form.mutate(ops, formState.revision)
        setNotice(accepted ? 'saved' : 'saveFailed')
        if (accepted) setDraft(current)
      } catch (_error) {
        setNotice('saveFailed')
      } finally {
        setSaving(false)
      }
    }

    if (formState.status === 'loading') return h('div', { style: styles.page }, h('p', { style: styles.muted }, t('loading')))
    if (formState.status === 'unavailable') return h('div', { style: styles.page }, h('p', { style: styles.muted }, t('unavailable')))

    const currentText = [saved.provider, saved.model, saved.reasoningEffort].filter(Boolean).join(' / ') || '—'
    const invalid = dirty && (current.provider === '' || current.model === '')

    return h('div', { style: styles.page },
      h('h2', { style: styles.title }, t('title')),
      h('p', { style: styles.description }, t('description')),
      h('section', { style: styles.card },
        h('div', { style: styles.status },
          h('span', { style: styles.dot, 'aria-hidden': true }),
          t('lockActive')),
        h('div', { style: styles.currentLabel }, t('current')),
        h('code', { style: styles.current }, currentText),
        h('p', { style: styles.note }, t('scopeNote')),
        h('div', { style: styles.field },
          h('label', { htmlFor: 'default-model-lock-provider', style: styles.label }, t('provider')),
          h('select', {
            id: 'default-model-lock-provider', style: styles.select, value: current.provider,
            disabled: readOnly || !catalogReady,
            onChange: event => {
              const nextProvider = event.target.value
              const nextGroup = groups.find(candidate => candidate.id === nextProvider)
              const nextModel = nextGroup && Array.isArray(nextGroup.models) ? nextGroup.models[0] : undefined
              edit({
                provider: nextProvider,
                model: nextModel ? nextModel.id : '',
                reasoningEffort: nextModel && nextModel.reasoning ? nextModel.reasoning.defaultEffort || '' : '',
              })
            },
          },
          h('option', { value: '' }, t('chooseProvider')),
          ...providerOptions.map(option => h('option', { key: option.id, value: option.id }, option.name)))),
        h('div', { style: styles.field },
          h('label', { htmlFor: 'default-model-lock-model', style: styles.label }, t('model')),
          h('select', {
            id: 'default-model-lock-model', style: styles.select, value: current.model,
            disabled: readOnly || !catalogReady || current.provider === '',
            onChange: event => {
              const nextModel = models.find(candidate => candidate.id === event.target.value)
              edit({
                model: event.target.value,
                reasoningEffort: nextModel && nextModel.reasoning ? nextModel.reasoning.defaultEffort || '' : '',
              })
            },
          },
          h('option', { value: '' }, t('chooseModel')),
          ...modelOptions.map(option => h('option', { key: option.id, value: option.id }, option.name)))),
        h('div', { style: styles.field },
          h('label', { htmlFor: 'default-model-lock-effort', style: styles.label }, t('effort')),
          h('select', {
            id: 'default-model-lock-effort', style: styles.select, value: current.reasoningEffort,
            disabled: readOnly || !catalogReady || !model || efforts.length === 0,
            onChange: event => edit({ reasoningEffort: event.target.value }),
          },
          h('option', { value: '' }, t('providerDefault')),
          ...effortOptions.map(option => h('option', { key: option.id, value: option.id }, option.name)))),
        catalog.status === 'loading' ? h('p', { style: styles.muted }, t('catalogLoading')) : null,
        catalog.status === 'error' ? h('div', { style: styles.inlineNotice },
          h('span', { style: styles.error }, t('catalogError')),
          h('button', { type: 'button', style: styles.secondary, onClick: reloadCatalog }, t('retry'))) : null,
        catalog.status === 'ready' && failedNames !== '' ? h('div', { style: styles.inlineNotice },
          h('span', { style: styles.warn }, t('catalogPartial', { names: failedNames })),
          h('button', { type: 'button', style: styles.secondary, onClick: reloadCatalog }, t('retry'))) : null,
        catalog.status === 'ready' && groups.length === 0 ? h('p', { style: styles.muted }, t('noModels')) : null,
        readOnly ? h('p', { style: styles.muted }, t('readOnly')) : null,
        h('div', { style: styles.actions },
          h('button', {
            type: 'button', style: Object.assign({}, styles.primary, canSave ? {} : { opacity: 0.5, cursor: 'not-allowed' }),
            disabled: !canSave, onClick: save,
          }, saving ? t('saving') : t('save')),
          h('button', {
            type: 'button', style: styles.secondary, disabled: !dirty || saving,
            onClick: () => { setNotice(null); setDraft(saved) },
          }, t('reset')),
          notice ? h('span', { role: 'status', style: notice === 'saveFailed' ? styles.error : styles.notice }, t(notice)) : null),
        invalid ? h('p', { style: styles.error }, t('invalid')) : null))
  }

  return {
    name: PLUGIN_ID,
    inject: ['slots', 'locale', 'remote', 'remote.session', 'configForms'],
    apply(ctx) {
      ctx.effect(() => ctx.locale.register(LOCALE_NS, LOCALES), 'default-model-lock: dictionaries')
      const t = ctx.locale.bind(LOCALE_NS)
      const form = ctx.configForms.get(SETTINGS_NAMESPACE)
      const loadCatalog = async () => {
        const response = await ctx.remote.session.modelCatalog()
        if (!response.ok) throw new Error(response.error && response.error.message ? response.error.message : 'model catalog unavailable')
        return response.value
      }
      ctx.effect(() => ctx.configForms.whileServed([SETTINGS_NAMESPACE], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: SECTION_ID, order: 25,
        label: () => t('nav'), locale: LOCALE_NS,
        inject: () => ({ form, loadCatalog }),
      }, DefaultModelLockSection))), 'default-model-lock: settings section')
      ctx.effect(() => ctx.configForms.whileServed([SETTINGS_NAMESPACE], () => ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon', id: SECTION_ID,
      }, LockIcon))), 'default-model-lock: settings icon')
    },
  }
}
