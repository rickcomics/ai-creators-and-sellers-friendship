'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    console.log('🔍 Вход:', email)

    // ✅ ПРАВИЛЬНАЯ ДЕСТРУКТУРИЗАЦИЯ
    const {  data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('📦 User:', user)
    console.log('❌ Error:', error)

    if (error) {
      alert('Ошибка: ' + error.message)
      setLoading(false)
    } else {
      console.log('✅ Успешный вход!')
      setTimeout(() => {
        router.push('/')
      }, 500)
    }
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <form onSubmit={handleLogin} className="max-w-md mx-auto p-6 space-y-4" suppressHydrationWarning>
        <h1 className="text-2xl font-bold">Вход</h1>
        
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="password"
          name="password"
          id="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
        
        <Link href="/register" className="block text-center text-blue-600 hover:underline">
          Нет аккаунта? Зарегистрироваться
        </Link>
      </form>
    </div>
  )
}