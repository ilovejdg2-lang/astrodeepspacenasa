import { systemText } from '../systemText'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Resource } from '../../shared/types'
import { useSearchParams } from 'react-router-dom'
import { MissionChecklist } from '../components/resources/MissionChecklist'
import { Empty, Field, Modal } from '../components/ui'
import { planResourceUse } from '../domain/inventory'
import { formatMission, movementLabel, roleLabel } from '../domain/format'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'

type Tab = 'equipment' | 'supply' | 'checklist'

function stockLabel(quantity: number, english: boolean) {
  if (english) return quantity === 1 ? '1 unit' : `${quantity} units`
  return quantity === 1 ? '1 unidad' : `${quantity} unidades`
}

function kindLabel(kind: Resource['kind'], english: boolean) {
  if (kind === 'reusable') return english ? 'Reusable' : 'Reutilizable'
  return english ? 'Consumable' : 'Consumible'
}

export function ResourcesPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab')
  const tab: Tab = requestedTab === 'supply' || requestedTab === 'checklist' ? requestedTab : 'equipment'
  function setTab(next: Tab) {
    const updated = new URLSearchParams(params)
    updated.set('tab', next)
    setParams(updated)
  }
  const [selected, setSelected] = useState('oximeter')
  const [useOpen, setUseOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const rows = useMemo(
    () => state.resources.filter((item) => item.category === tab),
    [state.resources, tab],
  )
  const resource = rows.find((item) => item.id === selected) ?? null

  useEffect(() => {
    if (tab === 'checklist') return
    if (rows.some((item) => item.id === selected)) return
    setSelected(rows[0]?.id ?? '')
  }, [rows, selected, tab])

  const registered = state.resources.length
  const review = state.resources.filter((item) => item.status === 'review').length
  const movements = state.movements.length

  return (
    <div className="inv-page">
      <header className="inv-head">
        <div className="inv-head-row">
          <div>
            <p className="inv-kicker">{en ? 'Resources' : 'Recursos'}</p>
            <h1>{tab === 'checklist' ? (en ? 'Mission preparation' : 'Preparación de la misión') : (en ? 'Ship inventory' : 'Inventario de la nave')}</h1>
          </div>
          {tab !== 'checklist' ? (
            <button className="inv-add-btn" type="button" onClick={() => setAddOpen(true)}>
              {en ? 'Add' : 'Añadir'}
            </button>
          ) : null}
        </div>
        {tab === 'checklist' ? <p className="inv-lede">{en ? 'What is ready for this mission, and what is still open.' : 'Qué está listo para esta misión y qué sigue pendiente.'}</p> : null}
      </header>
      <div className="inv-cats" role="tablist" aria-label={en ? 'Categories' : 'Categorías'}>
        {([
          ['equipment', en ? 'Equipment' : 'Equipos'],
          ['supply', en ? 'Supplies' : 'Suministros'],
          ['checklist', en ? 'Preparation Checklist' : 'Lista de preparación'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'checklist' ? <MissionChecklist /> : <>
      <dl className="inv-metrics">
        <div><dt>{en ? 'Registered' : 'Registrados'}</dt><dd>{registered}</dd></div>
        <div><dt>{en ? 'To review' : 'Por revisar'}</dt><dd>{review}</dd></div>
        <div><dt>{en ? 'Movements' : 'Movimientos'}</dt><dd>{movements}</dd></div>
      </dl>
      <div className="inv-main">
        {rows.length === 0 ? (
          <Empty
            title={en ? 'Nothing in this category' : 'No hay recursos en esta categoría'}
            text={en ? 'The scenario does not include items here.' : 'Este escenario no incluye existencias en esta categoría.'}
          />
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>{en ? 'Resources' : 'Recursos'}</th>
                  <th>{en ? 'Available' : 'Disponible'}</th>
                  <th>{en ? 'Location' : 'Ubicación'}</th>
                  <th>{en ? 'Status' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} data-testid={`resource-${item.id}`} className={item.id === resource?.id ? 'is-selected' : undefined}>
                    <td>
                      <span className="inv-res">
                        <button type="button" aria-pressed={item.id === resource?.id} onClick={() => { setSelected(item.id); setEditing(item) }}>{systemText(item.name, lang)}</button>
                        <span>{kindLabel(item.kind, en)}</span>
                      </span>
                    </td>
                    <td>{stockLabel(item.quantity, en)}</td>
                    <td>{systemText(item.location, lang)}</td>
                    <td>
                      <span className="inv-status-cell">
                        <span className={item.status === 'review' ? 'inv-state is-review' : 'inv-state'}>{item.status === 'ready' ? (en ? 'Ready' : 'Listo') : (en ? 'Review' : 'Revisar')}</span>
                        <button type="button" className="inv-row-edit" onClick={() => { setSelected(item.id); setEditing(item) }}>{en ? 'Edit' : 'Editar'}</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {resource ? (
          <aside className="inv-detail">
            <h2>{systemText(resource.name, lang)}</h2>
            <p>{stockLabel(resource.quantity, en)} - {systemText(resource.location, lang)}</p>
            <div className="inv-detail-space" />
            <div className="inv-detail-actions">
              <button type="button" className="inv-btn is-pink" data-testid="open-use" onClick={() => setUseOpen(true)}>{en ? 'Record use' : 'Registrar uso'}</button>
              <button type="button" className="inv-btn is-sky" onClick={() => setEditing(resource)}>{en ? 'Edit record' : 'Editar ficha'}</button>
            </div>
          </aside>
        ) : (
          <aside className="inv-detail">
            <h2>{en ? 'No item selected' : 'Sin recurso seleccionado'}</h2>
            <p>{en ? 'Choose a row to see its record.' : 'Elegí una fila para ver su ficha.'}</p>
          </aside>
        )}
      </div>
      <section className="inv-moves">
        <h2>{en ? 'Movements' : 'Movimientos'}</h2>
        {state.movements.length === 0 ? (
          <p className="inv-moves-empty">{en ? 'There are no movements in this scenario yet.' : 'Todavía no hay movimientos en este escenario.'}</p>
        ) : (
          <ul>
            {[...state.movements].reverse().map((item) => {
              const name = state.resources.find((entry) => entry.id === item.resourceId)?.name ?? item.resourceId
              const reusable = state.resources.find((entry) => entry.id === item.resourceId)?.kind === 'reusable'
              const amount = item.type === 'use' && reusable
                ? (en ? 'use recorded, stock unchanged' : 'uso registrado, sin salida de inventario')
                : `${item.quantityDelta >= 0 ? '+' : ''}${item.quantityDelta}`
              return (
                <li key={item.id}>
                  {movementLabel(item.type)} · {systemText(name, lang)} · {formatMission(item.at)} · {amount} · {roleLabel(item.actor)}{item.note ? ` · ${systemText(item.note, lang)}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {resource ? <UseDialog open={useOpen} resource={resource} onClose={() => setUseOpen(false)} /> : null}
      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editing ? <EditDialog resource={editing} onClose={() => setEditing(null)} /> : null}
      </>}
    </div>
  )
}

function UseDialog({ open, resource, onClose }: { open: boolean; resource: Resource; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { dispatch } = useApp()
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const key = useRef('')
  useEffect(() => {
    if (!open) return
    setQuantity('1')
    setError('')
    setBusy(false)
    key.current = `use-${resource.id}-${crypto.randomUUID()}`
  }, [open, resource.id])
  return (
    <Modal open={open} title={`${en ? 'Record use' : 'Registrar uso'} · ${systemText(resource.name, lang)}`} description={resource.kind === 'reusable' ? (en ? 'This equipment does not lose units.' : 'Este equipo no pierde unidades.') : (en ? 'Use is deducted once and cannot go below zero.' : 'El uso se descuenta una sola vez y no puede dejar la existencia bajo cero.')} onClose={onClose}>
      <Field id="use-quantity" label={en ? 'Quantity' : 'Cantidad'} error={systemText(error, lang)}>
        <input id="use-quantity" data-testid="use-quantity" inputMode="numeric" value={quantity} aria-invalid={Boolean(error)} aria-describedby={error ? 'use-quantity-error' : undefined} onChange={(event) => setQuantity(event.target.value)} />
      </Field>
      <button className="btn btn-primary" type="button" data-testid="save-use" disabled={busy} onClick={() => {
        if (busy) return
        const parsed = Number(quantity)
        if (!Number.isInteger(parsed) || parsed < 1) {
          setError(en ? 'Enter an integer greater than zero.' : 'Indicá un entero mayor que cero.')
          return
        }
        const plan = planResourceUse(resource, parsed)
        if (!plan.ok) {
          setError(plan.error)
          return
        }
        setBusy(true)
        dispatch({ type: 'useResource', resourceId: resource.id, quantity: parsed, idempotencyKey: key.current, note: '' })
        onClose()
      }}>{busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Confirm use' : 'Confirmar uso')}</button>
    </Modal>
  )
}

function AddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [kind, setKind] = useState<Resource['kind']>('reusable')
  const [error, setError] = useState('')
  return (
    <Modal open={open} title={en ? 'Add resource' : 'Añadir recurso'} onClose={onClose}>
      <Field id="res-name" label={en ? 'Name' : 'Nombre'} error={systemText(error, lang)}><input id="res-name" value={name} aria-invalid={Boolean(error)} aria-describedby={error ? 'res-name-error' : undefined} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="res-location" label={en ? 'Location' : 'Ubicación'}><input id="res-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="res-qty" label={en ? 'Starting quantity' : 'Cantidad inicial'}><input id="res-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <Field id="res-kind" label={en ? 'Type' : 'Tipo'}>
        <select id="res-kind" value={kind} onChange={(event) => setKind(event.target.value as Resource['kind'])}>
          <option value="reusable">{en ? 'Reusable' : 'Reutilizable'}</option>
          <option value="consumable">{en ? 'Consumable' : 'Consumible'}</option>
        </select>
      </Field>
      <button className="btn btn-primary" type="button" onClick={() => {
        const parsed = Number(quantity)
        if (name.trim().length < 2 || location.trim().length < 2 || !Number.isInteger(parsed) || parsed < 0) { setError(en ? 'Check the name, location, and quantity.' : 'Revisá nombre, ubicación y cantidad.'); return }
        dispatch({ type: 'createResource', name, location, quantity: parsed, kind, category: kind === 'consumable' ? 'supply' : 'equipment', idempotencyKey: `new-${state.seq}-${name}` })
        onClose()
      }}>{en ? 'Save' : 'Guardar'}</button>
    </Modal>
  )
}

function EditDialog({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { dispatch } = useApp()
  const [name, setName] = useState(() => systemText(resource.name, lang))
  const [location, setLocation] = useState(() => systemText(resource.location, lang))
  const [status, setStatus] = useState(resource.status)
  const [category, setCategory] = useState(resource.category)
  const [quantity, setQuantity] = useState(String(resource.quantity))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setName(systemText(resource.name, lang))
    setLocation(systemText(resource.location, lang))
    setStatus(resource.status)
    setCategory(resource.category)
    setQuantity(String(resource.quantity))
    setError('')
    setBusy(false)
  }, [resource, lang])
  return (
    <Modal open title={en ? 'Edit record' : 'Editar ficha'} description={systemText(resource.name, lang)} onClose={onClose}>
      <Field id="edit-name" label={en ? 'Name' : 'Nombre'} error={systemText(error, lang)}><input id="edit-name" value={name} aria-invalid={Boolean(error)} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="edit-category" label={en ? 'Category' : 'Categoría'}>
        <select id="edit-category" value={category} onChange={(event) => setCategory(event.target.value as Resource['category'])}>
          <option value="equipment">{en ? 'Equipment' : 'Equipo'}</option>
          <option value="supply">{en ? 'Supply' : 'Suministro'}</option>
        </select>
      </Field>
      <Field id="edit-location" label={en ? 'Location' : 'Ubicación'}><input id="edit-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="edit-status" label={en ? 'Review status' : 'Estado de revisión'}>
        <select id="edit-status" value={status} onChange={(event) => setStatus(event.target.value as Resource['status'])}>
          <option value="ready">{en ? 'Ready' : 'Listo'}</option>
          <option value="review">{en ? 'Review' : 'Revisar'}</option>
        </select>
      </Field>
      <Field id="edit-qty" label={en ? 'Quantity' : 'Cantidad'}><input id="edit-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <button className="btn btn-primary" type="button" disabled={busy} onClick={() => {
        if (busy) return
        if (name.trim().length < 2 || location.trim().length < 2) {
          setError(en ? 'Name and location are required.' : 'Nombre y ubicación son obligatorios.')
          return
        }
        const parsed = Number(quantity)
        if (!Number.isInteger(parsed) || parsed < 0) {
          setError(en ? 'Quantity must be zero or a positive integer.' : 'La existencia debe ser un entero igual o mayor que cero.')
          return
        }
        setBusy(true)
        dispatch({ type: 'updateResource', resourceId: resource.id, name: name.trim(), location: location.trim(), status, category })
        if (parsed !== resource.quantity) {
          dispatch({ type: 'adjustResource', resourceId: resource.id, quantity: parsed, idempotencyKey: `adj-${resource.id}-${crypto.randomUUID()}`, note: en ? 'Manual adjustment' : 'Ajuste manual' })
        }
        onClose()
      }}>{en ? 'Save record' : 'Guardar ficha'}</button>
    </Modal>
  )
}
