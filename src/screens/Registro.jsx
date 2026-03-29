import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Empty, Spinner } from '../components/ui/index.jsx'
import { exportarCSV, exportarExcel } from '../lib/exportar.js'

const FILTROS = [
  { label: 'Todos',      key: 'all' },
  { label: 'Ingresos',   key: 'ingreso' },
  { label: 'Egresos',    key: 'egreso' },
  { label: 'YAPE',       key: 'yape' },
  { label: 'Efectivo',   key: 'efectivo' },
  { label: 'Tarjeta',    key: 'tarjeta' },
  { label: 'Recurrentes',key: 'recurrente' },
]

const MESES = [
  '2026-03','2026-02','2026-01','2025-12','2025-11','2025-10',
]

function agruparPorFecha(lista) {
  const map = {}
  lista.forEach(t => {
    if (!map[t.fecha]) map[t.fecha] = []
    map[t.fecha].push(t)
  })
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatFecha(fecha) {
  const hoy = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (fecha === hoy) return 'Hoy'
  if (fecha === ayer) return 'Ayer'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function totalDia(txs) {
  return txs.reduce((s, t) => s + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0)
}

export default function Registro() {
  const { transacciones, fetchTransacciones, eliminarTransaccion, mesActivo, setMesActivo } = useStore()
  const [filtro, setFiltro] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchTransacciones(mesActivo).finally(() => setLoading(false))
  }, [mesActivo])

  const filtradas = transacciones
    .filter(t => !t.deleted_at)
    .filter(t => {
      if (filtro === 'all') return true
      if (filtro === 'recurrente') return t.recurrente !== 'no'
      return t.tipo === filtro || t.metodo === filtro || t.categoria?.toLowerCase() === filtro
    })
    .filter(t => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return t.categoria?.toLowerCase().includes(q) ||
             t.descripcion?.toLowerCase().includes(q) ||
             t.metodo?.toLowerCase().includes(q)
    })

  const ingresos = filtradas.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
  const egresos  = filtradas.filter(t => t.tipo === 'egreso' ).reduce((s, t) => s + t.monto, 0)
  const balance  = ingresos - egresos
  const grupos   = agruparPorFecha(filtradas)

  const handleDelete = async (id) => {
    await eliminarTransaccion(id)
    setConfirmDelete(null)
  }

  return (
    <div className="screen px-4 pt-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Registro</h1>
        <select
          value={mesActivo}
          onChange={e => setMesActivo(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600"
        >
          {MESES.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar por categoría o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="text-gray-400 text-xs">✕</button>
        )}
      </div>

      {/* Chips de filtro */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`chip flex-shrink-0 ${filtro === f.key ? 'chip-on' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-green-600 mb-1">Ingresos</p>
          <p className="text-sm font-medium text-green-700">S/ {ingresos.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-red-500 mb-1">Egresos</p>
          <p className="text-sm font-medium text-red-600">S/ {egresos.toFixed(2)}</p>
        </div>
        <div className={`${balance >= 0 ? 'bg-brand-50' : 'bg-red-50'} rounded-xl p-3 text-center`}>
          <p className={`text-[10px] mb-1 ${balance >= 0 ? 'text-brand-600' : 'text-red-500'}`}>Balance</p>
          <p className={`text-sm font-medium ${balance >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : ''}S/ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista agrupada por fecha */}
      {loading ? <Spinner /> : grupos.length === 0 ? (
        <Empty mensaje="Sin transacciones" sub="Presiona + para agregar una" />
      ) : (
        grupos.map(([fecha, txs]) => {
          const tot = totalDia(txs)
          return (
            <div key={fecha} className="mb-3">
              <div className="flex justify-between items-center mb-1.5 px-1">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  {formatFecha(fecha)}
                </span>
                <span className={`text-[11px] font-medium ${tot >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tot >= 0 ? '+' : ''}S/ {tot.toFixed(2)}
                </span>
              </div>
              <div className="card !mb-0 !p-0 overflow-hidden">
                {txs.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < txs.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    {/* Ícono categoría */}
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                      {t.tipo === 'ingreso' ? '💰' : t.categoria === 'Alimentacion' ? '🍽️' : t.categoria === 'Transporte' ? '🚌' : t.categoria === 'Universidad' ? '📚' : '📦'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-700 truncate">{t.categoria}</p>
                        {t.recurrente !== 'no' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600 flex-shrink-0">↻</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{t.metodo}</p>
                      {t.descripcion && (
                        <p className="text-xs text-gray-300 italic truncate">"{t.descripcion}"</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-medium ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.tipo === 'ingreso' ? '+' : '-'}S/ {t.monto.toFixed(2)}
                      </p>
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
                      >
                        eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Exportar */}
      {filtradas.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => exportarCSV(filtradas)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            CSV
          </button>
          <button onClick={() => exportarExcel(filtradas)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
            Excel
          </button>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-medium text-gray-800 mb-1">¿Eliminar transacción?</p>
            <p className="text-sm text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
