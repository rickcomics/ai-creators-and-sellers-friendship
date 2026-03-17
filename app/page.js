'use client'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const sessionResult = await supabase.auth.getSession()
      const session = sessionResult.data?.session
      
      if (session?.user) {
        setUser(session.user)
        await loadUserRole(session.user.id)
      }
      
      setRoleLoading(false)
    }

    const loadUserRole = async (userId) => {
      const profileResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
      
      const profile = profileResult.data?.[0]
      
      if (profile?.role) {
        setUserRole(profile.role)
      }
    }

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        loadUserRole(session.user.id)
      }
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
      }
    })

    const subscription = authListener.data.subscription

    initAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchOrders = async () => {
    const result = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (result.error) throw result.error
    return result.data || []
  }

  const swrResult = useSWR('orders', fetchOrders, {
    refreshInterval: 10000,
    revalidateOnFocus: true
  })
  
  const orders = swrResult.data
  const error = swrResult.error
  const isLoading = swrResult.isLoading

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Загрузка
  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center .bg-gradient-to-br {
    --tw-gradient-position: to bottom right in oklab;
    background-image: linear-gradient(var(--tw-gradient-stops));
    )">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    )
  }

  // Ошибка
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center .bg-gradient-to-br .bg-gradient-to-br {
    --tw-gradient-position: to bottom right in oklab;
    background-image: linear-gradient(var(--tw-gradient-stops));
}">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <p className="text-red-600">Ошибка: {error.message}</p>
        </div>
      </div>
    )
  }

  // Основная страница
  return (
    <div className="min-h-screen .bg-gradient-to-br {
    --tw-gradient-position: to bottom right in oklab;
    background-image: linear-gradient(var(--tw-gradient-stops))}">
      <div className="max-w-6xl mx-auto">
        
        {/* Шапка */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white">🔥 Биржа AI-карточек</h1>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  {userRole === 'seller' ? (
                    <Link href="/create-order" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
                      + Создать заказ
                    </Link>
                  ) : (
                    <span className="text-white bg-white/20 px-5 py-2 rounded-lg">🎨 Креатор</span>
                  )}
                  <Link href="/profile" className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-medium transition">
                    Профиль
                  </Link>
                  <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition">
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
                    Войти
                  </Link>
                  <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Заказы */}
        {!orders || orders.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-10 text-center shadow-xl">
            <p className="text-white text-xl">😕 Пока нет заказов</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(function(order) {
              return (
                <div key={order.id} className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition">
                  <h2 className="font-bold text-xl text-gray-800 mb-3">{order.title}</h2>
                  <p className="text-gray-600 mb-4">{order.description}</p>
                  <p className="text-green-600 font-bold text-lg mb-4">💰 {order.budget} руб.</p>
                  <Link 
                    href={'/orders/' + order.id}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Подробнее →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
