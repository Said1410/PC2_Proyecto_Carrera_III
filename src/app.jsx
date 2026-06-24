import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', badgeNumber: '', area: 'DEMUNA' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isRegister) {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password 
      })
      
      if (authError) { alert(authError.message); setLoading(false); return }

      // 2. Registrar datos en tu tabla 'officers'
      const { error: dbError } = await supabase.from('officers').insert({
        full_name: formData.fullName,
        badge_number: formData.badgeNumber,
        area: formData.area,
        email: formData.email
      })

      if (dbError) alert("Error guardando datos de oficial: " + dbError.message)
      else alert("Registro exitoso. Ya puedes ingresar.")
    } else {
      // Login simple
      const { error } = await supabase.auth.signInWithPassword({ 
        email: formData.email, 
        password: formData.password 
      })
      if (error) alert(error.message)
    }
    setLoading(false)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4">
          <h1 className="text-xl font-bold text-white text-center">{isRegister ? 'Registro de Oficial' : 'Acceso Municipal'}</h1>
          
          <input type="email" placeholder="Email institucional" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <input type="password" placeholder="Contraseña" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          
          {isRegister && (
            <>
              <input type="text" placeholder="Nombre Completo" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white" onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
              <input type="text" placeholder="Número de Fotocheck" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white" onChange={(e) => setFormData({...formData, badgeNumber: e.target.value})} required />
            </>
          )}

          <button className="w-full py-3 bg-teal-500 rounded-xl font-bold text-slate-950">{loading ? 'Procesando...' : (isRegister ? 'Registrar' : 'Ingresar')}</button>
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="w-full text-xs text-slate-400 underline">{isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo oficial? Regístrate'}</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold">Dashboard Operativo</h1>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 text-rose-400 text-sm">Cerrar Sesión</button>
    </div>
  )
}