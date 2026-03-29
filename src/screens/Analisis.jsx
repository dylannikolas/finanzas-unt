import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Spinner } from '../components/ui/index.jsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const CAT_COLORS = ['#1D9E75','#378ADD','#BA7517','#E24B4A','#9C27B0','#888780']

const MESES_LABELS = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic',
}

function InsightCard({ texto, color = 'blue' }) {
  const MAP = {
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    red:    'bg-red-50 border-red-100 text-red-700',
  }
  return (
    <div className={`border rounded-xl px-3 py-2.5 text-xs mb-2 ${MAP[color]}`}>
      {texto}
    </div>
  )
}

export default function Analisis() {
  const { transacciones, fetchTransacciones } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar últimos 6 meses
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        return fetchTransacciones(d.toISOString().slice(0, 7))
      })
    ).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="screen px-4 pt-4 pb-20"><Spinner /></div>

  const activas = transacciones.filter(t => !t.deleted_at)

  // Datos por mes para barras
  const mesMap = {}
  activas.forEach(t => {
    const mes = t.fecha.slice(0, 7)
    if (!mesMap[mes]) mesMap[mes] = { ingreso: 0, egreso: 0 }
    mesMap[mes][t.tipo] += t.monto
  })
  const barData = Object.entries(mesMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([mes, v]) => ({
      mes: MESES_LABELS[mes.slice(5, 7)],
      Ingreso: +v.ingreso.toFixed(2),
      Egreso:  +v.egreso.toFixed(2),
      Ahorro:  +(v.ingreso - v.egreso).toFixed(2),
    }))

  // Mes actual
  const mesActual = new Date().toISOString().slice(0, 7)
  const txMes = activas.filter(t => t.fecha.startsWith(mesActual))
  const ingresos = txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
  const egresos  = txMes.filter(t => t.tipo === 'egreso' ).reduce((s, t) => s + t.monto, 0)
  const promDiario = egresos / new Date().getDate()

  // Categorías
  const catMap = {}
  txMes.filter(t => t.tipo === 'egreso').forEach(t => {
    catMap[t.categoria] = (catMap[t.categoria] || 0) + t.monto
  })
  const pieData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))

  // Método de pago
  const metMap = {}
  txMes.forEach(t => { metMap[t.metodo] = (metMap[t.metodo] || 0) + 1 })
  const totalOps = txMes.length
  const metData = Object.entries(metMap).map(([met, n]) => ({
    met, pct: Math.round((n / totalOps) * 100)
  })).sort((a, b) => b.pct - a.pct)

  // Insights automáticos
  const insights = []
  if (egresos > 0 && pieData[0]) {
    const topPct = Math.round((pieData[0].value / egresos) * 100)
    insights.push({ texto: `El ${topPct}% de tus gastos son en ${pieData[0].name}`, color: 'blue' })
  }
  if (metData[0]) insights.push({ texto: `Usas ${metData[0].met} en el ${metData[0].pct}% de tus operaciones`, color: 'blue' })
  if (ingresos > 0) {
    const pct = Math.round((egresos / ingresos) * 100)
    if (pct < 70) insights.push({ texto: `Ahorras el ${100 - pct}% de tus ingresos — excelente ritmo`, color: 'green' })
    else if (pct > 90) insights.push({ texto: `Gastas el ${pct}% de tus ingresos — revisa tu presupuesto`, color: 'red' })
  }
  if (barData.length >= 2) {
    const actual = barData[barData.length - 1].Egreso
    const anterior = barData[barData.length - 2].Egreso
    if (anterior > 0) {
      const diff = Math.round(((actual - anterior) / anterior) * 100)
      insights.push({
        texto: diff < 0
          ? `Bajaste tus gastos un ${Math.abs(diff)}% vs el mes anterior`
          : `Subiste tus gastos un ${diff}% vs el mes anterior`,
        color: diff < 0 ? 'green' : 'yellow'
      })
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-2 text-xs shadow-sm">
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: S/ {p.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="screen px-4 pt-4 pb-20">
      <h1 className="text-lg font-medium text-gray-800 mb-4">Análisis</h1>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">🧠 Análisis automático</p>
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      {/* Métricas clave */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Ahorro mes</p>
          <p className={`text-sm font-medium ${(ingresos - egresos) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            S/ {(ingresos - egresos).toFixed(0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-400 mb-1">% gasto</p>
          <p className="text-sm font-medium text-gray-700">
            {ingresos > 0 ? Math.round((egresos / ingresos) * 100) : 0}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Prom. diario</p>
          <p className="text-sm font-medium text-gray-700">S/ {promDiario.toFixed(1)}</p>
        </div>
      </div>

      {/* Gráfico ingreso vs egreso por mes */}
      {barData.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">Ingreso vs Egreso — últimos meses</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Ingreso" fill="#1D9E75" radius={[3,3,0,0]} />
              <Bar dataKey="Egreso"  fill="#E24B4A" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evolución del ahorro */}
      {barData.length > 1 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">Ahorro mensual</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Ahorro" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3, fill: '#1D9E75' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribución por categoría */}
      {pieData.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">Distribución de gastos</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.slice(0, 5).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  <span className="text-xs text-gray-500 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {egresos > 0 ? Math.round((d.value / egresos) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uso por método de pago */}
      {metData.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">Uso por método de pago</p>
          {metData.map((m, i) => (
            <div key={m.met} className="mb-2.5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 capitalize">{m.met}</span>
                <span className="font-medium text-gray-700">{m.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${m.pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {txMes.length === 0 && (
        <div className="text-center py-12 text-gray-300">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">Sin datos para analizar</p>
          <p className="text-xs mt-1">Registra transacciones para ver tu análisis</p>
        </div>
      )}
    </div>
  )
}
