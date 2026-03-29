import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // ── Auth ─────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ── Wallets ──────────────────────────────────────
  wallets: [],
  setWallets: (wallets) => set({ wallets }),

  saldoTotal: () => get().wallets.reduce((acc, w) => acc + w.saldo, 0),

  fetchWallets: async () => {
    const { data, error } = await supabase
      .from('wallet')
      .select('*')
      .order('metodo')
    if (!error) set({ wallets: data })
  },

  actualizarSaldoLocal: (metodo, delta) =>
    set(state => ({
      wallets: state.wallets.map(w =>
        w.metodo === metodo ? { ...w, saldo: w.saldo + delta } : w
      )
    })),

  // ── Transacciones ────────────────────────────────
  transacciones: [],
  fetchTransacciones: async (mes = null) => {
    let query = supabase
      .from('transaccion')
      .select('*')
      .is('deleted_at', null)
      .order('fecha', { ascending: false })

    if (mes) {
      const start = `${mes}-01`
      const end = `${mes}-31`
      query = query.gte('fecha', start).lte('fecha', end)
    }

    const { data, error } = await query
    if (!error) set({ transacciones: data })
  },

  agregarTransaccion: async (datos) => {
    const user = get().user
    const payload = { ...datos, user_id: user.id }
    const { data, error } = await supabase
      .from('transaccion')
      .insert(payload)
      .select()
      .single()

    if (error) return { error }

    set(state => ({ transacciones: [data, ...state.transacciones] }))
    // El trigger de Supabase actualiza el wallet, solo refrescamos local
    get().actualizarSaldoLocal(datos.metodo, datos.tipo === 'ingreso' ? datos.monto : -datos.monto)
    return { data }
  },

  eliminarTransaccion: async (id) => {
    const { error } = await supabase
      .from('transaccion')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      set(state => ({
        transacciones: state.transacciones.filter(t => t.id !== id)
      }))
    }
    return { error }
  },

  // ── Préstamos ────────────────────────────────────
  prestamos: [],
  fetchPrestamos: async () => {
    const { data, error } = await supabase
      .from('prestamo')
      .select('*, abono(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (!error) set({ prestamos: data })
  },

  agregarPrestamo: async (datos) => {
    const user = get().user
    const payload = { ...datos, user_id: user.id }
    const { data, error } = await supabase
      .from('prestamo')
      .insert(payload)
      .select()
      .single()

    if (error) return { error }

    // El préstamo también genera un movimiento en transacciones
    await get().agregarTransaccion({
      fecha: datos.fecha,
      monto: datos.monto_inicial,
      metodo: datos.metodo,
      categoria: 'Prestamo',
      tipo: datos.direccion === 'dado' ? 'egreso' : 'ingreso',
      descripcion: `Préstamo ${datos.direccion === 'dado' ? 'a' : 'de'} ${datos.persona}`,
    })

    set(state => ({ prestamos: [{ ...data, abono: [] }, ...state.prestamos] }))
    return { data }
  },

  agregarAbono: async ({ prestamo_id, monto, fecha, descripcion }) => {
    const user = get().user
    const { data, error } = await supabase
      .from('abono')
      .insert({ prestamo_id, monto, fecha, descripcion, user_id: user.id })
      .select()
      .single()

    if (error) return { error }

    // Refrescar lista de préstamos para ver estado actualizado
    await get().fetchPrestamos()
    return { data }
  },

  // ── UI state ─────────────────────────────────────
  mesActivo: new Date().toISOString().slice(0, 7), // 'YYYY-MM'
  setMesActivo: (mes) => set({ mesActivo: mes }),
}))
