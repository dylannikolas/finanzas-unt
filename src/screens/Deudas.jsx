import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Empty, Spinner, Badge } from '../components/ui/index.js'

function diasRestantes(fechaLimite) {
  if (!fechaLimite) return null
  const diff = new Date(fechaLimite) - new Date()
  return Math.ceil(diff / 86400000)
}

function iniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-yellow-100 text-yellow-600',
  'bg-pink-100 text-pink-600',
]

function avatarColor(nombre) {
  const i = nombre.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

// ── Panel de abono ─────────────────────────────────────
function ModalAbono({ prestamo, onClose, onGuardar }) {
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [desc,  setDesc]  = useState('')
  const [loading, setLoading] = useState(false)
  const pendiente = prestamo.monto_inicial - prestamo.monto_abonado

  const handleGuardar = async () => {
    if (!monto || +monto <= 0 || +monto > pendiente) return
    setLoading(true)
    await onGuardar({ prestamo_id: prestamo.id, monto: +monto, fecha, descripcion: desc })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
        <p className="font-medium text-gray-800 mb-1">Registrar abono</p>
        <p className="text-xs text-gray-400 mb-4">
          Pendiente: <span className="text-red-500 font-medium">S/ {pendiente.toFixed(2)}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Monto abonado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
              <input type="number" step="0.01" max={pendiente} placeholder="0.00"
                value={monto} onChange={e => setMonto(e.target.value)} className="input pl-9" />
            </div>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Descripción <span className="text-gray-300">(opcional)</span></label>
            <input type="text" placeholder='Ej: "Me pagó en YAPE"'
              value={desc} onChange={e => setDesc(e.target.value)} className="input" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Guardando...' : 'Guardar abono'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detalle de una persona ──────────────────────────────
function DetallePrestamo({ prestamo, onBack, onAbono, onSaldar }) {
  const pendiente  = prestamo.monto_inicial - prestamo.monto_abonado
  const porcentaje = Math.min(100, Math.round((prestamo.monto_abonado / prestamo.monto_inicial) * 100))
  const dias = diasRestantes(prestamo.fecha_limite)

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-brand-600 text-sm mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
        Deudas
      </button>

      {/* Hero */}
      <div className="card text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2 ${avatarColor(prestamo.persona)}`}>
          {iniciales(prestamo.persona)}
        </div>
        <p className="font-medium text-gray-800">{prestamo.persona}</p>
        <p className="text-3xl font-medium mt-2 text-red-500">S/ {pendiente.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {prestamo.direccion === 'dado' ? 'pendiente de cobro' : 'que debes'}
        </p>

        <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Abonado S/ {prestamo.monto_abonado.toFixed(2)} de S/ {prestamo.monto_inicial.toFixed(2)} total
        </p>

        {dias !== null && (
          <div className={`mt-3 text-xs px-3 py-2 rounded-xl ${
            dias < 0 ? 'bg-red-50 text-red-600' :
            dias < 7 ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-500'
          }`}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} días` :
             dias === 0 ? 'Vence hoy' :
             `Vence en ${dias} días`}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="card !p-0 overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-medium text-gray-600">Historial completo</p>
        </div>
        {/* Préstamos originales */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-50">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">➡️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Préstamo inicial</p>
            <p className="text-xs text-gray-400">{prestamo.fecha} · {prestamo.metodo}</p>
            {prestamo.descripcion && (
              <p className="text-xs text-gray-300 italic mt-0.5">"{prestamo.descripcion}"</p>
            )}
          </div>
          <p className="text-sm font-medium text-red-500">+S/ {prestamo.monto_inicial.toFixed(2)}</p>
        </div>

        {/* Abonos */}
        {prestamo.abono?.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-3">Sin abonos aún</p>
        )}
        {prestamo.abono?.map(a => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">✅</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Abono recibido</p>
              <p className="text-xs text-gray-400">{a.fecha}</p>
              {a.descripcion && <p className="text-xs text-gray-300 italic mt-0.5">"{a.descripcion}"</p>}
            </div>
            <p className="text-sm font-medium text-green-600">-S/ {a.monto.toFixed(2)}</p>
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
          <span className="text-xs font-medium text-gray-500">Pendiente total</span>
          <span className="text-base font-medium text-red-500">S/ {pendiente.toFixed(2)}</span>
        </div>
      </div>

      {/* Acciones */}
      {prestamo.estado !== 'saldado' && (
        <div className="flex gap-3">
          <button onClick={onSaldar} className="btn-secondary flex-1 text-sm">
            Marcar saldado
          </button>
          <button onClick={onAbono} className="btn-primary flex-1 text-sm">
            + Registrar abono
          </button>
        </div>
      )}
      {prestamo.estado === 'saldado' && (
        <div className="badge-green text-center py-3 rounded-xl text-sm">
          ✅ Este préstamo está saldado
        </div>
      )}
    </div>
  )
}

// ── Pantalla principal de Deudas ───────────────────────
export default function Deudas() {
  const navigate = useNavigate()
  const { prestamos, fetchPrestamos, agregarAbono } = useStore()
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('me-deben')
  const [detalle, setDetalle]     = useState(null)
  const [modalAbono, setModalAbono] = useState(null)

  useEffect(() => {
    fetchPrestamos().finally(() => setLoading(false))
  }, [])

  const meDeben   = prestamos.filter(p => p.direccion === 'dado'     && p.estado !== 'saldado')
  const yoDebo    = prestamos.filter(p => p.direccion === 'recibido' && p.estado !== 'saldado')
  const saldados  = prestamos.filter(p => p.estado === 'saldado')

  const totalMeDeben = meDeben.reduce((s, p) => s + (p.monto_inicial - p.monto_abonado), 0)
  const totalYoDebo  = yoDebo.reduce((s, p) => s + (p.monto_inicial - p.monto_abonado), 0)

  // Alertas de vencimiento próximo
  const alertas = [...meDeben, ...yoDebo].filter(p => {
    const d = diasRestantes(p.fecha_limite)
    return d !== null && d <= 7
  })

  const handleSaldar = async (p) => {
    await agregarAbono({
      prestamo_id: p.id,
      monto: p.monto_inicial - p.monto_abonado,
      fecha: new Date().toISOString().slice(0, 10),
      descripcion: 'Saldado completo'
    })
    setDetalle(null)
  }

  const lista = tab === 'me-deben' ? meDeben : tab === 'yo-debo' ? yoDebo : saldados

  if (loading) return <div className="screen px-4 pt-4 pb-20"><Spinner /></div>

  // Vista detalle
  if (detalle) {
    return (
      <div className="screen px-4 pt-4 pb-20">
        <DetallePrestamo
          prestamo={detalle}
          onBack={() => setDetalle(null)}
          onAbono={() => setModalAbono(detalle)}
          onSaldar={() => handleSaldar(detalle)}
        />
        {modalAbono && (
          <ModalAbono
            prestamo={modalAbono}
            onClose={() => setModalAbono(null)}
            onGuardar={async (datos) => {
              await agregarAbono(datos)
              const actualizado = prestamos.find(p => p.id === detalle.id)
              if (actualizado) setDetalle({ ...actualizado })
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="screen px-4 pt-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Deudas</h1>
        <button
          onClick={() => navigate('/nueva')}
          className="text-xs text-brand-600 border border-brand-100 bg-brand-50 px-3 py-1.5 rounded-lg"
        >
          + Préstamo
        </button>
      </div>

      {/* Alertas de vencimiento */}
      {alertas.map(p => {
        const d = diasRestantes(p.fecha_limite)
        return (
          <div key={p.id} className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-2 text-xs text-yellow-700">
            {p.persona} — {d <= 0 ? 'venció' : `vence en ${d} día${d !== 1 ? 's' : ''}`}
          </div>
        )
      })}

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-green-600 mb-1">Me deben</p>
          <p className="text-base font-medium text-green-700">S/ {totalMeDeben.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-red-500 mb-1">Yo debo</p>
          <p className="text-base font-medium text-red-600">S/ {totalYoDebo.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'me-deben', label: `Me deben (${meDeben.length})` },
          { key: 'yo-debo',  label: `Yo debo (${yoDebo.length})` },
          { key: 'saldados', label: `Saldados (${saldados.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-brand-500 text-white' : 'border border-gray-200 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <Empty
          mensaje={tab === 'saldados' ? 'Sin préstamos saldados' : 'Sin préstamos activos'}
          sub="Presiona + Préstamo para agregar uno"
        />
      ) : (
        <div className="card !p-0 overflow-hidden">
          {lista.map((p, i) => {
            const pendiente = p.monto_inicial - p.monto_abonado
            const pct = Math.min(100, Math.round((p.monto_abonado / p.monto_inicial) * 100))
            return (
              <div
                key={p.id}
                onClick={() => setDetalle(p)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 ${
                  i < lista.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(p.persona)}`}>
                  {iniciales(p.persona)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{p.persona}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{p.abono?.length || 0} abono{(p.abono?.length || 0) !== 1 ? 's' : ''}</p>
                    {p.fecha_limite && (() => {
                      const d = diasRestantes(p.fecha_limite)
                      return d !== null && d <= 14 ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d < 0 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                          {d < 0 ? `Venció` : `${d}d`}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${tab === 'saldados' ? 'text-green-600' : 'text-red-500'}`}>
                    S/ {pendiente.toFixed(2)}
                  </p>
                  <Badge estado={p.estado} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
