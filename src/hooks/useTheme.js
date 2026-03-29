import { useEffect, useState } from 'react'

export function useTheme() {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem('tema')
    if (guardado) return guardado
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
  })

  useEffect(() => {
    const root = document.documentElement
    if (tema === 'oscuro') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('tema', tema)
  }, [tema])

  const toggleTema = () => setTema(t => t === 'claro' ? 'oscuro' : 'claro')

  return { tema, toggleTema }
}