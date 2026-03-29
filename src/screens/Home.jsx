import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { MetricCard, Spinner } from '../components/ui/index.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const METODO_ICO = { efectivo: '💵', yape: '📱', tarjeta: '💳' }
const CAT_COLORS = ['#1D9E75','#378ADD','#BA7517','#888780','#E24B4A','#9C27B0']

function saludFinanciera(gastos, ingresos) {
  if (ingresos === 0) return { label: 'Sin datos', color: 'text-gray-400', score: 0 }
  const pct = (gastos / ingresos) * 100
  if (pct < 60) return { label: 'Excelente', color: 'text-green-600', score: 90 }
  if (pct < 80) return { label: 'Bien',      color: 'text-green-600', score: 72 }
  if (pct < 95) return { label: 'Cuidado',   color: 'text-yellow-600', score: 45 }
  return          { label: 'Riesgo',          color: 'text-red-500',  score: 20 }
}

export default function Home() {
  const navigate = useNavigate()
  const { wallets, transacciones, fetchWallets, fetchTransacciones, saldoTotal } = useStore()

  useEffect(() => {
    fetchWallets()
    const mes = new Date().toISOString().slice(0, 7)
    fetchTransacciones(mes)
  }, [])

  const mes = transacciones.filter(t => !t.deleted_at)
  const ingresos = mes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
  const egresos  = mes.filter(t => t.tipo === 'egreso' ).reduce((s, t) => s + t.monto, 0)
  const balance  = ingresos - egresos

  // Agrupar por categoría para el pie
  const catMap = {}
  mes.filter(t => t.tipo === 'egreso').forEach(t => {
    catMap[t.categoria] = (catMap[t.categoria] || 0) + t.monto
  })
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

  const salud = saludFinanciera(egresos, ingresos)
  const total = saldoTotal()
  const ultimas = mes.slice(0, 4)

  return (
    <div className="screen px-4 pt-4 pb-20">
      {/* Saludo */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-medium text-gray-800">Hola 👋</h1>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <span className="badge-green text-xs">Sincronizado</span>
      </div>

      {/* Salud financiera */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-400">Salud financiera</p>
            <p className={`text-sm font-medium mt-0.5 ${salud.color}`}>{salud.label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Score</p>
            <p className={`text-2xl font-medium ${salud.color}`}>{salud.score}<span className="text-sm text-gray-300">/100</span></p>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${salud.score}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {ingresos > 0 ? `Gastas el ${Math.round((egresos/ingresos)*100)}% de tus ingresos este mes` : 'Sin datos este mes'}
        </p>
      </div>

      {/* Saldo total */}
      <div className="card text-center">
        <p className="text-xs text-gray-400 mb-1">Saldo total consolidado</p>
        <p className="text-3xl font-medium text-gray-800">S/ {total.toFixed(2)}</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {wallets.map(w => (
            <div key={w.metodo} className="bg-gray-50 rounded-xl p-2 text-center">
              <p className="text-base">{METODO_ICO[w.metodo]}</p>
              <p className="text-[10px] text-gray-400">{w.metodo}</p>
              <p className="text-xs font-medium text-gray-700">S/ {w.saldo.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas del mes */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCard label="Ingresos" valor={`S/ ${ingresos.toFixed(2)}`} color="text-green-600" />
        <MetricCard label="Egresos"  valor={`S/ ${egresos.toFixed(2)}`}  color="text-red-500" />
        <MetricCard label="Ahorro"   valor={`S/ ${balance.toFixed(2)}`}  color={balance >= 0 ? 'text-brand-600' : 'text-red-500'} />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCard label="% gasto" valor={ingresos > 0 ? `${Math.round((egresos/ingresos)*100)}%` : '-'} />
        <MetricCard label="Prom. diario" valor={`S/ ${(egresos / new Date().getDate()).toFixed(1)}`} />
        <MetricCard label="Operaciones" valor={mes.length} />
      </div>

      {/* Gráfico de categorías */}
      {pieData.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-600 mb-3">Distribución de gastos</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={90} height={90}>
              <PieChart>
                <Pie data={pieData} cx={40} cy={40} innerRadius={25} outerRadius={42} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  <span className="text-xs text-gray-500 flex-1 truncate">{d.name}</span>
                  <span className="text-xs text-gray-700 font-medium">{Math.round((d.value/egresos)*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Últimas operaciones */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-600">Últimas operaciones</p>
          <button onClick={() => navigate('/registro')} className="text-xs text-brand-600">Ver todas</button>
        </div>
        {ultimas.length === 0
          ? <p className="text-xs text-gray-400 text-center py-4">Sin operaciones este mes</p>
          : ultimas.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{t.categoria}</p>
                <p className="text-xs text-gray-400">{t.metodo} · {t.fecha}</p>
              </div>
              <span className={`text-sm font-medium ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                {t.tipo === 'ingreso' ? '+' : '-'}S/ {t.monto.toFixed(2)}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
