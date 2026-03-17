'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Register() {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('seller')  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    
    // ✅ ПРАВИЛЬНО: data: { user } (не username!)
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role }  // ← Это ОТПРАВЛЯЕМ (из useState)
      }
    })

    console.log('📦 User:', user)
    console.log('❌ Error:', error)

    if (error) {
      alert(error.message)
      return
    }

    alert('Регистрация успешна! Проверь почту.')
    router.push('/login')
  }

  return (
    <form onSubmit={handleRegister} className="max-w-md mx-auto p-6 space-y-4" suppressHydrationWarning>
      <h1 className="text-2xl font-bold">Регистрация</h1>
      
      <input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="seller">Я продавец (заказываю карточки)</option>
        <option value="creator">Я креатор (делаю карточки)</option>
      </select>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Зарегистрироваться
      </button>
    </form>
  )
}