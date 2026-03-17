'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateOrder() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Проверка авторизации...')
      
      // 1. Получаем сессию
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('❌ Нет сессии, редирект на login')
        router.push('/login')
        return
      }
      
      console.log('✅ User:', session.user.email)
      setUser(session.user)
      
      // 2. Получаем роль из profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
      
      const role = profileData?.[0]?.role
      console.log('✅ Role:', role)
      setUserRole(role)
      
      // 3. Проверяем что роль = seller
      if (role !== 'seller') {
        console.log('❌ Не seller, редирект на profile')
        alert('Только продавцы могут создавать заказы!')
        router.push('/profile')
        return
      }
      
      console.log('✅ Доступ разрешён')
      setChecking(false)
    }
    
    checkAuth()
  }, [router])

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  const budgetNum = parseFloat(budget)
  const commission = budgetNum * 0.05  // 5%
  const totalToPay = budgetNum + commission  // ← Бюджет + комиссия сверху

  const result = await supabase
    .from('orders')
    .insert({
      seller_id: user.id,
      title,
      description,
      budget: budgetNum,           // ← Креатор получит эту сумму
      commission: commission,      // ← Комиссия платформы
      status: 'open'
    })

  if (result.error) {
    alert('Ошибка: ' + result.error.message)
    setLoading(false)
    return
  }

  alert('Заказ создан!\nБюджет: ' + budgetNum + ' руб.\nКомиссия: ' + commission + ' руб.\nИтого к оплате: ' + totalToPay + ' руб.')
  router.push('/profile')
}

  // Ждём пока проверка завершится
  if (checking) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Проверка доступа...</div>
      </div>
    )
  }

  // Если не seller — не показываем форму
  if (userRole !== 'seller') {
    return null
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Создать заказ</h1>
          <Link href="/profile" className="text-blue-600 hover:underline">
            ← В профиль
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Карточка для шампуня"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Описание задачи</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Опишите что нужно сделать..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Бюджет (руб)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Опубликовать заказ'}
          </button>
        </form>
      </div>
    </div>
  )
}