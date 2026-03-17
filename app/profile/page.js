'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import useSWR from 'swr'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ orders: 0, accepted: 0, spent: 0, earned: 0  })
  const [loading, setLoading] = useState(true)

  // ✅ Функция загрузки статистики (ОБЪЯВЛЕНА ПЕРЕД useEffect)
  const loadStats = async (userId, userRole) => {
    console.log('Загрузка статистики...', userId, userRole)
    
    if (userRole === 'seller') {
      // ДЛЯ ПРОДАВЦА: считаем заказы и сколько заплатил
      const ordersResult = await supabase
        .from('orders')
        .select('id, status, budget, commission')
        .eq('seller_id', userId)
      
      const ordersData = ordersResult.data || []
      const orderIds = ordersData.map(function(o) { return o.id })
      
      let bidsData = []
      if (orderIds.length > 0) {
        const bidsResult = await supabase
          .from('bids')
          .select('id, status, order_id')
          .in('order_id', orderIds)
        
        bidsData = bidsResult.data || []
      }
      
      const acceptedCount = bidsData.filter(function(b) { return b.status === 'accepted' }).length
      const ordersCount = ordersData.length
      
      // Seller заплатил: budget + commission (комиссия сверху)
      const totalSpent = ordersData.reduce(function(sum, o) {
        return sum + o.budget + (o.commission || 0)
      }, 0)
      
      console.log('Seller stats:', { ordersCount, acceptedCount, totalSpent })
      
      setStats({
        orders: ordersCount,
        accepted: acceptedCount,
        spent: totalSpent
      })
      
    } else {
      // ДЛЯ КРЕАТОРА: считаем отклики
      const bidsResult = await supabase
        .from('bids')
        .select('id, status, price')
        .eq('creator_id', userId)
      
      const bidsData = bidsResult.data || []
      const acceptedCount = bidsData.filter(function(b) { return b.status === 'accepted' }).length
      const bidsCount = bidsData.length
      
      // ✅ Считаем заработок (только принятые отклики)
      const totalEarned = bidsData.filter(function(b) { return b.status === 'accepted' })
      .reduce(function(sum, b) {
      return sum + (b.price || 0)
      }, 0)

      console.log('Creator stats:', { bidsCount, acceptedCount, totalEarned })
      
      setStats({
        orders: bidsCount,
        accepted: acceptedCount,
        earned: totalEarned  // ← Добавили заработок
      })
    }
  }

  useEffect(() => {
    const initProfile = async () => {
      console.log('Загрузка профиля...')
      
      const sessionResult = await supabase.auth.getSession()
      const session = sessionResult.data?.session
      
      if (!session?.user) {
        console.log('Нет сессии')
        setLoading(false)
        return
      }
      
      console.log('User:', session.user.email)
      setUser(session.user)
      
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      const profileData = profileResult.data
      console.log('Profile:', profileData)
      setProfile(profileData)
      
      await loadStats(session.user.id, profileData?.role)
      
      setLoading(false)
    }
    
    initProfile()
  }, [])

  const fetchMyItems = async () => {
    if (!user || !profile) return []
    
    if (profile.role === 'seller') {
      const result = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
      
      return result.data || []
    } else {
      
      const bidsResult = await supabase
        .from('bids')
        .select('*, orders:order_id(*)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      const bidsData = bidsResult.data || []
      return bidsData.map(function(b) { return b.orders })
    }
  }

  const swrResult = useSWR(
    profile ? 'myItems' : null, 
    fetchMyItems, 
    { refreshInterval: 5000 }
  )
  
  const myItems = swrResult.data
  const error = swrResult.error
  const isLoading = swrResult.isLoading

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {profile?.role === 'seller' ? '🛒 Продавец' : '🎨 Креатор'}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-400">Рейтинг: {profile?.rating || 0}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/" className="text-blue-600 hover:underline">
                На главную
              </Link>
              <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className={'grid gap-4 mb-6 ' + (profile?.role === 'seller' ? 'grid-cols-3' : 'grid-cols-2')}>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600">
              {profile?.role === 'seller' ? 'Заказов' : 'Откликов'}
            </p>
            <p className="text-3xl font-bold">{stats.orders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600">Принятых откликов</p>
            <p className="text-3xl font-bold">{stats.accepted}</p>
          </div>
            {profile?.role === 'seller' && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600">Заплачено (вкл. комиссию)</p>
            <p className="text-3xl font-bold text-orange-600">{stats.spent} руб.</p>
          </div>
          )}
            {profile?.role === 'creator' && (
          <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600">Заработано</p>
          <p className="text-3xl font-bold text-green-600">{stats.earned} руб.</p>
        </div>

          )}
        </div>    

        {profile?.role === 'seller' && (
          <div className="mb-6">
            <Link 
              href="/create-order" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700"
            >
              + Новый заказ
            </Link>
          </div>
        )}


        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {profile?.role === 'seller' ? '📦 Мои заказы' : '📬 Мои отклики'}
          </h2>
          
          {!myItems || myItems.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {profile?.role === 'seller' 
                ? 'У вас пока нет заказов' 
                : 'У вас пока нет откликов'}
            </p>
          ) : (
            <div className="space-y-4">
              {myItems.map(function(item) {
                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-green-600 font-bold">{item.budget} руб.</span>
                      <span className={'px-3 py-1 rounded text-sm ' + (
                        item.status === 'open' ? 'bg-green-100 text-green-800' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {item.status === 'open' ? 'Открыт' :
                         item.status === 'in_progress' ? 'В работе' :
                         item.status === 'completed' ? 'Завершён' :
                         'Отменён'}
                      </span>
                    </div>
                    <Link 
                      href={'/orders/' + item.id}
                      className="block mt-4 text-blue-600 hover:underline"
                    >
                      Подробнее
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}