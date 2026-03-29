// Chip selector (para método de pago, categoría, tipo)
export function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? 'chip-on' : ''}`}
    >
      {label}
    </button>
  )
}

// Badge de estado
const BADGE = {
  pendiente: 'badge-yellow',
  parcial:   'badge-blue',
  saldado:   'badge-green',
  ingreso:   'badge-green',
  egreso:    'badge-red',
  dado:      'badge-blue',
  recibido:  'badge-yellow',
}

export function Badge({ estado }) {
  return (
    <span className={BADGE[estado] || 'badge-gray'}>
      {estado}
    </span>
  )
}

// Monto formateado
export function Monto({ valor, tipo, className = '' }) {
  const formatted = `S/ ${Math.abs(valor).toFixed(2)}`
  const isPositive = tipo === 'ingreso' || valor > 0
  return (
    <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-500'} ${className}`}>
      {isPositive ? '+' : '-'}{formatted}
    </span>
  )
}

// Spinner de carga
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Pantalla vacía
export function Empty({ mensaje = 'Sin registros', sub = '' }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-4xl mb-3">📭</div>
      <p className="font-medium text-sm">{mensaje}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  )
}

// Alerta
export function Alerta({ mensaje, tipo = 'info' }) {
  const COLORS = {
    info:    'bg-blue-50 text-blue-700 border-blue-100',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    success: 'bg-green-50 text-green-700 border-green-100',
    danger:  'bg-red-50 text-red-700 border-red-100',
  }
  return (
    <div className={`rounded-xl p-3 border text-xs mb-3 ${COLORS[tipo]}`}>
      {mensaje}
    </div>
  )
}

// Tarjeta métrica
export function MetricCard({ label, valor, color = 'text-gray-800' }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{valor}</p>
    </div>
  )
}
