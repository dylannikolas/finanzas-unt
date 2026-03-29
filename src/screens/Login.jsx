import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async () => {
    if (!email || !password) return setMsg({ tipo: 'error', texto: 'Completa todos los campos' })
    setLoading(true)
    setMsg(null)
    const fn = modo === 'login' ? signIn : signUp
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) setMsg({ tipo: 'error', texto: error.message })
    else if (modo === 'register') setMsg({ tipo: 'ok', texto: 'Revisa tu correo para confirmar tu cuenta' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-medium">F</span>
          </div>
          <h1 className="text-xl font-medium text-gray-800">FinanzasUNT</h1>
          <p className="text-sm text-gray-400 mt-1">Control de finanzas universitarias</p>
        </div>

        <div className="card">
          {/* Tabs login / register */}
          <div className="flex gap-2 mb-5">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setModo(m); setMsg(null) }}
                className={`flex-1 py-2 rounded-xl text-sm transition-colors ${
                  modo === m ? 'bg-brand-500 text-white' : 'text-gray-400 border border-gray-200'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Correo electrónico</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>

          {msg && (
            <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${msg.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {msg.texto}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-4">
            {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">o</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button onClick={signInWithGoogle} className="btn-secondary flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  )
}
