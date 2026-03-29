import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

async function crearWalletsInicial(userId) {
  const { data } = await supabase
    .from('wallet')
    .select('id')
    .eq('user_id', userId)

  if (data && data.length === 0) {
    await supabase.from('wallet').insert([
      { user_id: userId, metodo: 'efectivo', saldo: 0 },
      { user_id: userId, metodo: 'yape',     saldo: 0 },
      { user_id: userId, metodo: 'tarjeta',  saldo: 0 },
    ])
  }
}

export function useAuth() {
  const setUser = useStore(s => s.setUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) await crearWalletsInicial(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    return { error }
  }

  const signOut = () => supabase.auth.signOut()

  return { loading, signIn, signUp, signInWithGoogle, signOut }
}