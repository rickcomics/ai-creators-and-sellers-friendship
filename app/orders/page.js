'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import useSWR from 'swr'

export default function OrdersPage() {
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState(null) 
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 Orders: Инициализация авторизации...')
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('✅ Orders: User:', session.user.email)
        setUser(session.user)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
        
        const role = profileData?.[0]?.role
        console.log('✅ Orders: Role:', role)
        setUserRole(role)
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const { data: orders, error, isLoading } = useSWR('orders', fetchOrders, {
    refreshInterval: 10000,
    revalidateOnFocus: true
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">Ошибка: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Все заказы</h1>
          <div className="flex gap-4">
            {userRole === 'seller' ? (
              <Link href="/create-order" className="bg-blue-600 text-white px-4 py-2 rounded">
                + Создать заказ
              </Link>
            ) : (
              <span className="text-gray-400 px-4 py-2">🎨 Креатор</span>
            )}
            <Link href="/profile" className="bg-gray-600 text-white px-4 py-2 rounded">
              Профиль
            </Link>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
              Выйти
            </button>
          </div>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">😕 Пока нет заказов</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {orders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition bg-white">
                <h2 className="font-bold text-lg">{order.title}</h2>
                <p className="text-gray-600 mt-2">{order.description}</p>
                <p className="text-green-600 font-bold mt-4">💰 {order.budget} руб.</p>
                <Link href={`/orders/${order.id}`} className="block mt-4 text-blue-600 hover:underline">
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}