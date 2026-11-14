import { ClipboardCheck, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEMO_PROTOCOLS } from '../../shared/protocols'
import { ageLabel, movementLabel } from '../domain/format'
import { useApp } from '../state/store'
import { ResourceMark } from '../components/Avatars'
import { Badge, Empty, Field, Modal } from '../components/ui'
import type { Resource } from '../../shared/types'

type Tab = 'equipment' | 'supply' | 'protocol'

export function ResourcesPage() {
  const { state } = useApp()
  const [tab, setTab] = useState<Tab>('equipment')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('oximeter')
  const [useOpen, setUseOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const resource = state.resources.find((item) => item.id === selected) ?? state.resources[0]
  const rows = useMemo(() => state.resources.filter((item) => {
    if (tab === 'protocol') return false
    if (item.category !== tab) return false
    const haystack = `${item.name} ${item.location}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [state.resources, tab, query])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Recursos</p>
          <h1>Inventario de la nave</h1>
          <p className="lede">El equipo reutilizable no se descuenta al usarlo. Un suministro no puede quedar bajo cero. Tenerlo a bordo no es una indicación médica.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setAddOpen(true)}><Plus aria-hidden="true" size={18} strokeWidth={1.75} /> Añadir recurso</button>
      </header>
      <div className="spread">
        <div className="chips" role="tablist" aria-label="Categorías">
          {([['equipment', 'Equipos'], ['supply', 'Suministros'], ['protocol', 'Protocolos']] as const).map(([id, label]) => (
            <button key={id} type="button" className="chip" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <Field id="search-resource" label="Buscar">
          <input id="search-resource" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o ubicación" />
        </Field>
      </div>
      <dl className="quiet-metrics">
        <div className="metric"><dt>Registrados</dt><dd>{state.resources.length}</dd></div>
        <div className="metric"><dt>Por revisar</dt><dd>{state.resources.filter((item) => item.status === 'review').length}</dd></div>
        <div className="metric"><dt>Movimientos</dt><dd>{state.movements.length}</dd></div>
      </dl>
      {tab === 'protocol' ? (
        <div className="stack">
          {DEMO_PROTOCOLS.map((protocol) => (
            <article key={protocol.id} className="panel">
              <h2>{protocol.title}</h2>
              <p>{protocol.summary}</p>
              <ol>{protocol.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <p className="callout callout-amber">{protocol.limitation}</p>
            </article>
          ))}
        </div>
      ) : rows.length === 0 ? <Empty title="Sin resultados" text="No hay recursos con ese nombre en esta categoría." /> : (
        <div className="split">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Recurso</th><th>Disponible</th><th>Ubicación</th><th>Estado</th></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} data-testid={`resource-${item.id}`} aria-selected={item.id === resource?.id}>
                    <td><button type="button" className="btn btn-ghost" onClick={() => setSelected(item.id)}>{item.name}</button><span className="muted">{item.kind === 'reusable' ? 'Reutilizable' : 'Consumible'}</span></td>
                    <td>{item.quantity} {item.unitLabel}</td>
                    <td>{item.location}</td>
                    <td><Badge tone={item.status === 'ready' ? 'ok' : 'amber'}>{item.status === 'ready' ? 'Listo' : 'Por revisar'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resource ? <ResourceDetail resource={resource} onUse={() => setUseOpen(true)} onEdit={() => setEditOpen(true)} reviewed={ageLabel(state.clock.simulatedAt, resource.lastReviewAt)} /> : null}
        </div>
      )}
      <section className="panel">
        <h2>Movimientos</h2>
        {state.movements.length === 0 ? <p className="muted">Todavía no hay movimientos en este escenario.</p> : (
          <ul>{[...state.movements].reverse().slice(0, 8).map((item) => <li key={item.id}>{movementLabel(item.type)} · {state.resources.find((resource) => resource.id === item.resourceId)?.name ?? item.resourceId} · {item.quantityDelta >= 0 ? '+' : ''}{item.quantityDelta} · quedan {item.quantityAfter}. {item.note}</li>)}</ul>
        )}
      </section>
      {resource ? <UseDialog open={useOpen} resource={resource} onClose={() => setUseOpen(false)} /> : null}
      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {resource ? <EditDialog open={editOpen} resource={resource} onClose={() => setEditOpen(false)} /> : null}
    </div>
  )
}

function ResourceDetail({ resource, onUse, onEdit, reviewed }: { resource: Resource; onUse: () => void; onEdit: () => void; reviewed: string }) {
  return (
    <aside className="detail">
      <ResourceMark id={resource.id} />
      <h2>{resource.name}</h2>
      <p>{resource.quantity} {resource.unitLabel} · {resource.location}</p>
      <p className="muted">Última revisión {reviewed}. Usos registrados: {resource.useCount}.</p>
      <p className="callout callout-amber">Disponibilidad no equivale a indicación médica.</p>
      <div className="row">
        <button className="btn btn-primary" type="button" data-testid="open-use" onClick={onUse}><ClipboardCheck aria-hidden="true" size={18} strokeWidth={1.75} /> Registrar uso</button>
        <button className="btn" type="button" onClick={onEdit}><Pencil aria-hidden="true" size={18} strokeWidth={1.75} /> Editar ficha</button>
      </div>
    </aside>
  )
}

function UseDialog({ open, resource, onClose }: { open: boolean; resource: Resource; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  return (
    <Modal open={open} title={`Usar ${resource.name}`} description={resource.kind === 'reusable' ? 'Este equipo no pierde unidades.' : 'El consumo se descuenta una sola vez.'} onClose={onClose}>
      <Field id="use-quantity" label="Cantidad" error={error}>
        <input id="use-quantity" data-testid="use-quantity" inputMode="numeric" value={quantity} aria-invalid={Boolean(error)} aria-describedby={error ? 'use-quantity-error' : undefined} onChange={(event) => setQuantity(event.target.value)} />
      </Field>
      <button className="btn btn-primary" type="button" data-testid="save-use" onClick={() => {
        const parsed = Number(quantity)
        if (!Number.isInteger(parsed) || parsed < 1) { setError('Indicá un entero mayor que cero.'); return }
        dispatch({ type: 'useResource', resourceId: resource.id, quantity: parsed, idempotencyKey: `use-${resource.id}-${state.seq}-${parsed}`, note: '' })
        onClose()
      }}>Confirmar uso</button>
    </Modal>
  )
}

function AddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [kind, setKind] = useState<Resource['kind']>('reusable')
  const [error, setError] = useState('')
  return (
    <Modal open={open} title="Añadir recurso" onClose={onClose}>
      <Field id="res-name" label="Nombre" error={error}><input id="res-name" value={name} aria-invalid={Boolean(error)} aria-describedby={error ? 'res-name-error' : undefined} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="res-location" label="Ubicación"><input id="res-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="res-qty" label="Cantidad inicial"><input id="res-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <Field id="res-kind" label="Tipo">
        <select id="res-kind" value={kind} onChange={(event) => setKind(event.target.value as Resource['kind'])}>
          <option value="reusable">Reutilizable</option>
          <option value="consumable">Consumible</option>
        </select>
      </Field>
      <button className="btn btn-primary" type="button" onClick={() => {
        const parsed = Number(quantity)
        if (name.trim().length < 2 || location.trim().length < 2 || !Number.isInteger(parsed) || parsed < 0) { setError('Revisá nombre, ubicación y cantidad.'); return }
        dispatch({ type: 'createResource', name, location, quantity: parsed, kind, category: kind === 'consumable' ? 'supply' : 'equipment', idempotencyKey: `new-${state.seq}-${name}` })
        onClose()
      }}>Guardar</button>
    </Modal>
  )
}

function EditDialog({ open, resource, onClose }: { open: boolean; resource: Resource; onClose: () => void }) {
  const { dispatch } = useApp()
  const [name, setName] = useState(resource.name)
  const [location, setLocation] = useState(resource.location)
  const [status, setStatus] = useState(resource.status)
  const [quantity, setQuantity] = useState(String(resource.quantity))
  return (
    <Modal open={open} title="Editar ficha" description="Cambiar la cantidad crea un ajuste. El nombre y la ubicación no descuentan stock." onClose={onClose}>
      <Field id="edit-name" label="Nombre"><input id="edit-name" value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="edit-location" label="Ubicación"><input id="edit-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="edit-status" label="Estado">
        <select id="edit-status" value={status} onChange={(event) => setStatus(event.target.value as Resource['status'])}>
          <option value="ready">Listo</option>
          <option value="review">Por revisar</option>
        </select>
      </Field>
      <button className="btn" type="button" onClick={() => { dispatch({ type: 'updateResource', resourceId: resource.id, name, location, status }); onClose() }}>Guardar ficha</button>
      <Field id="edit-qty" label="Ajustar existencia"><input id="edit-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <button className="btn btn-amber" type="button" onClick={() => { dispatch({ type: 'adjustResource', resourceId: resource.id, quantity: Number(quantity), idempotencyKey: `adj-${resource.id}-${quantity}-${resource.quantity}`, note: 'Ajuste manual' }); onClose() }}>Ajustar cantidad</button>
    </Modal>
  )
}
