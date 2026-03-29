import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

const CATEGORIAS = ['Alimentacion', 'Transporte', 'Universidad', 'Ocio', 'Salud', 'Ropa', 'Servicios', 'Otro']
const METODOS    = ['efectivo', 'yape', 'tarjeta']
const RECURRENTE = ['no', 'mensual', 'semanal']

function ChipGroup({ opciones, valor, onChange, renderLabel }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map(op => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={`chip ${valor === op ? 'chip-on' : ''}`}
        >
          {renderLabel ? renderLabel(op) : op}
        </button>
      ))}
    </div>
  )
}

export default function NuevaOperacion() {
  const navigate = useNavigate()
  const { agregarTransaccion, agregarPrestamo } = useStore()

  const [modo, setModo] = useState('transaccion') // 'transaccion' | 'prestamo'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Campos transacción
  const [tipo,        setTipo]        = useState('egreso')
  const [monto,       setMonto]       = useState('')
  const [metodo,      setMetodo]      = useState('efectivo')
  const [categoria,   setCategoria]   = useState('Alimentacion')
  const [fecha,       setFecha]       = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [recurrente,  setRecurrente]  = useState('no')

  // Campos préstamo
  const [pDireccion,  setPDireccion]  = useState('dado')
  const [pPersona,    setPPersona]    = useState('')
  const [pMonto,      setPMonto]      = useState('')
  const [pMetodo,     setPMetodo]     = useState('efectivo')
  const [pFecha,      setPFecha]      = useState(new Date().toISOString().slice(0, 10))
  const [pFechaLimite,setPFechaLimite]= useState('')
  const [pDescripcion,setPDescripcion]= useState('')

  const handleTransaccion = async () => {
    if (!monto || isNaN(monto) || +monto <= 0) return setError('Ingresa un monto válido')
    setError(null)
    setLoading(true)
    const { error } = await agregarTransaccion({
      tipo, monto: +monto, metodo, categoria, fecha, descripcion, recurrente
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/')
  }

  const handlePrestamo = async () => {
    if (!pPersona.trim())         return setError('Ingresa el nombre de la persona')
    if (!pMonto || +pMonto <= 0)  return setError('Ingresa un monto válido')
    setError(null)
    setLoading(true)
    const { error } = await agregarPrestamo({
      persona:       pPersona.trim(),
      direccion:     pDireccion,
      monto_inicial: +pMonto,
      metodo:        pMetodo,
      fecha:         pFecha,
      fecha_limite:  pFechaLimite || null,
      descripcion:   pDescripcion,
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/deudas')
  }

  return (
    <div className="screen px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <h1 className="text-lg font-medium text-gray-800">Nueva operación</h1>
      </div>

      {/* Toggle modo */}
      <div className="flex gap-2 mb-6">
        {['transaccion', 'prestamo'].map(m => (
          <button
            key={m}
            onClick={() => { setModo(m); setError(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              modo === m ? 'bg-brand-500 text-white' : 'border border-gray-200 text-gray-400'
            }`}
          >
            {m === 'transaccion' ? '💸 Transacción' : '🤝 Préstamo'}
          </button>
        ))}
      </div>

      {/* ── FORMULARIO TRANSACCIÓN ── */}
      {modo === 'transaccion' && (
        <div className="space-y-4">
          <div>
            <label className="label">Tipo *</label>
            <ChipGroup opciones={['ingreso','egreso']} valor={tipo} onChange={setTipo} />
          </div>

          <div>
            <label className="label">Monto *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
              <input
                type="number" step="0.01" min="0"
                placeholder="0.00"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="input pl-9 text-lg font-medium"
              />
            </div>
          </div>

          <div>
            <label className="label">Método de pago *</label>
            <ChipGroup
              opciones={METODOS} valor={metodo} onChange={setMetodo}
              renderLabel={m => ({ efectivo: '💵 Efectivo', yape: '📱 YAPE', tarjeta: '💳 Tarjeta' }[m])}
            />
          </div>

          <div>
            <label className="label">Categoría *</label>
            <ChipGroup opciones={CATEGORIAS} valor={categoria} onChange={setCategoria} />
          </div>

          <div>
            <label className="label">Fecha *</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">
              Recurrente
              <span className="text-gray-300 ml-1">(opcional)</span>
            </label>
            <ChipGroup opciones={RECURRENTE} valor={recurrente} onChange={setRecurrente} />
          </div>

          <div>
            <label className="label">
              Descripción
              <span className="text-gray-300 ml-1">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Menú del comedor con los compas..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="input resize-none"
            />
          </div>
        </div>
      )}

      {/* ── FORMULARIO PRÉSTAMO ── */}
      {modo === 'prestamo' && (
        <div className="space-y-4">
          <div>
            <label className="label">¿Qué pasó? *</label>
            <ChipGroup
              opciones={['dado','recibido']} valor={pDireccion} onChange={setPDireccion}
              renderLabel={d => d === 'dado' ? '➡️ Yo presté' : '⬅️ Me prestaron'}
            />
          </div>

          <div>
            <label className="label">Persona *</label>
            <input
              type="text" placeholder="Nombre de la persona"
              value={pPersona} onChange={e => setPPersona(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Monto *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={pMonto} onChange={e => setPMonto(e.target.value)}
                className="input pl-9 text-lg font-medium"
              />
            </div>
          </div>

          <div>
            <label className="label">Método *</label>
            <ChipGroup
              opciones={METODOS} valor={pMetodo} onChange={setPMetodo}
              renderLabel={m => ({ efectivo: '💵 Efectivo', yape: '📱 YAPE', tarjeta: '💳 Tarjeta' }[m])}
            />
          </div>

          <div>
            <label className="label">Fecha *</label>
            <input type="date" value={pFecha} onChange={e => setPFecha(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">
              Fecha límite de pago
              <span className="text-gray-300 ml-1">(opcional)</span>
            </label>
            <input type="date" value={pFechaLimite} onChange={e => setPFechaLimite(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">
              Descripción
              <span className="text-gray-300 ml-1">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Para materiales del proyecto grupal..."
              value={pDescripcion} onChange={e => setPDescripcion(e.target.value)}
              className="input resize-none"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Botón registrar */}
      <button
        onClick={modo === 'transaccion' ? handleTransaccion : handlePrestamo}
        disabled={loading}
        className="btn-primary mt-6"
      >
        {loading ? 'Guardando...' : modo === 'transaccion' ? 'Registrar transacción' : 'Registrar préstamo'}
      </button>
    </div>
  )
}
