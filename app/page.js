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
      console.log('🔍 Инициализация авторизации...')
      
      const sessionResult = await supabase.auth.getSession()
      const session = sessionResult.data?.session
      
      console.log('📦 Session:', session)
      
      if (session?.user) {
        console.log('✅ Сессия найдена:', session.user.email)
        setUser(session.user)
        await loadUserRole(session.user.id)
      } else {
        console.log('⚠️ Сессия не найдена')
      }
      
      setRoleLoading(false)
    }

    const loadUserRole = async (userId) => {
      console.log('🔍 Загрузка роли для:', userId)
      
      const profileResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
      
      const profileData = profileResult.data
      console.log('📦 Profile Data:', profileData)
      
      const profile = profileData?.[0]
      console.log('✅ Profile:', profile)
      
      if (profile?.role) {
        setUserRole(profile.role)
        console.log('✅ Role установлен:', profile.role)
      }
    }

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event)
      
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
    setUser(null)
    setUserRole(null)
    setRoleLoading(true)
    window.location.reload()
  }

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-white-500 flex items-center justify-center">
        <div className="text-xl text-white">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-xl text-white bg-red-600 px-6 py-4 rounded-lg">
          Ошибка: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            🔥 Биржа AI-карточек
          </h1>
          <div className="flex gap-4">
            {user ? (
              <>
                {userRole === 'seller' ? (
                  <Link href="/create-order" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    + Создать заказ
                  </Link>
                ) : (
                  <span className="text-white px-4 py-2 bg-white/20 rounded">🎨 Креатор</span>
                )}
                <Link href="/profile" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
                  Профиль
                </Link>
                <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Войти
                </Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-10 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-white text-lg">😕 Пока нет заказов</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {orders.map(function(order) {
              return (
                <div key={order.id} className="border rounded-lg p-4 shadow-lg hover:shadow-xl transition bg-white/95 backdrop-blur-sm">
                  <h2 className="font-bold text-lg text-gray-800">{order.title}</h2>
                  <p className="text-gray-600 mt-2">{order.description}</p>
                  <p className="text-green-600 font-bold mt-4">💰 {order.budget} руб.</p>
                  <Link 
                    href={'/orders/' + order.id}
                    className="block mt-4 text-blue-600 hover:underline"
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