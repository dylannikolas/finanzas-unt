import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const METODO_ICO  = { efectivo: '💵', yape: '📱', tarjeta: '💳' }
const METODO_LABEL = { efectivo: 'Efectivo', yape: 'YAPE', tarjeta: 'Tarjeta' }

export default function Ajustes() {
  const { wallets, fetchWallets } = useStore()
  const { tema, toggleTema } = useTheme()
  const { signOut } = useAuth()
  const user = useStore(s => s.user)

  const [editando, setEditando] = useState(null) // metodo que se está editando
  const [nuevoSaldo, setNuevoSaldo] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchWallets() }, [])

  const handleEditar = (wallet) => {
    setEditando(wallet.metodo)
    setNuevoSaldo(wallet.saldo.toFixed(2))
    setMsg(null)
  }

  const handleGuardar = async () => {
    if (!nuevoSaldo || isNaN(nuevoSaldo) || +nuevoSaldo < 0)
      return setMsg({ tipo: 'error', texto: 'Ingresa un monto válido' })

    setLoading(true)
    const { error } = await supabase
      .from('wallet')
      .update({ saldo: +nuevoSaldo, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('metodo', editando)

    setLoading(false)
    if (error) return setMsg({ tipo: 'error', texto: error.message })

    await fetchWallets()
    setEditando(null)
    setNuevoSaldo('')
    setMsg({ tipo: 'ok', texto: `Saldo de ${METODO_LABEL[editando]} actualizado` })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleCancelar = () => {
    setEditando(null)
    setNuevoSaldo('')
    setMsg(null)
  }

  return (
    <div className="screen px-4 pt-4 pb-20">
      <h1 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-5">Ajustes</h1>

      {/* Mensaje feedback */}
      {msg && (
        <div className={`text-xs px-3 py-2.5 rounded-xl mb-4 ${
          msg.tipo === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-100'
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {msg.texto}
        </div>
      )}

      {/* ── Saldos ── */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        Saldos actuales
      </p>
      <div className="card dark:bg-gray-900 dark:border-gray-800 !p-0 overflow-hidden mb-5">
        {wallets.map((w, i) => (
          <div
            key={w.metodo}
            className={`px-4 py-3.5 ${i < wallets.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
          >
            {editando === w.metodo ? (
              /* Modo edición */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{METODO_ICO[w.metodo]}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {METODO_LABEL[w.metodo]}
                  </span>
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoSaldo}
                    onChange={e => setNuevoSaldo(e.target.value)}
                    className="input pl-9 text-lg font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCancelar} className="btn-secondary flex-1 py-2 text-sm">
                    Cancelar
                  </button>
                  <button onClick={handleGuardar} disabled={loading} className="btn-primary flex-1 py-2 text-sm">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              /* Modo visualización */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg">
                    {METODO_ICO[w.metodo]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {METODO_LABEL[w.metodo]}
                    </p>
                    <p className="text-xs text-gray-400">Saldo actual</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                    S/ {w.saldo.toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleEditar(w)}
                    className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 active:bg-gray-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Apariencia ── */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        Apariencia
      </p>
      <div className="card dark:bg-gray-900 dark:border-gray-800 !p-0 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              {tema === 'claro' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-yellow-500">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-blue-400">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Tema</p>
              <p className="text-xs text-gray-400">{tema === 'claro' ? 'Modo claro activo' : 'Modo oscuro activo'}</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={toggleTema}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              tema === 'oscuro' ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
              tema === 'oscuro' ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* ── Cuenta ── */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        Cuenta
      </p>
      <div className="card dark:bg-gray-900 dark:border-gray-800 !p-0 overflow-hidden mb-5">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-medium text-sm">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Sesión activa</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-gray-800"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-red-500">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span className="text-sm text-red-500 font-medium">Cerrar sesión</span>
        </button>
      </div>

      {/* Versión */}
      <p className="text-center text-xs text-gray-300 dark:text-gray-700 mt-4">
        FinanzasUNT v0.1.0
      </p>
    </div>
  )
}