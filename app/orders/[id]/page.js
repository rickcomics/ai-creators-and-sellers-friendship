'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id

  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [order, setOrder] = useState(null)
  const [bids, setBids] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newBidPrice, setNewBidPrice] = useState('')
  const [newBidMessage, setNewBidMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ Функция загрузки заказа
  const loadOrder = async (id) => {
    const result = await supabase
      .from('orders')
      .select('*, profiles:seller_id(username, rating)')
      .eq('id', id)
      .single()
    
    const orderData = result.data
    console.log('Заказ:', orderData)
    setOrder(orderData)
  }

  // ✅ Функция загрузки откликов
  const loadBids = async (orderId) => {
    const result = await supabase
      .from('bids')
      .select('*, profiles:creator_id(username, rating)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    
    const bidsData = result.data || []
    console.log('Отклики:', bidsData)
    setBids(bidsData)
  }

  // ✅ Функция загрузки сообщений
  const loadMessages = async (orderId) => {
    const result = await supabase
      .from('messages')
      .select('*, profiles:sender_id(username)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    
    const messagesData = result.data || []
    console.log('Сообщения:', messagesData)
    setMessages(messagesData)
  }

  // ✅ Отправка отклика
  const handleSendBid = async (e) => {
    e.preventDefault()
    
    if (!newBidPrice || !newBidMessage) {
      alert('Заполните цену и сообщение')
      return
    }

    const result = await supabase
      .from('bids')
      .insert({
        order_id: orderId,
        creator_id: user.id,
        price: parseFloat(newBidPrice),
        message: newBidMessage,
        status: 'pending'
      })

    if (result.error) {
      alert('Ошибка: ' + result.error.message)
      return
    }

    alert('Отклик отправлен!')
    setNewBidPrice('')
    setNewBidMessage('')
    await loadBids(orderId)
  }

  // ✅ Принятие отклика
  const handleAcceptBid = async (bidId) => {
    if (!confirm('Принять этот отклик?')) return

    const result = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId)

    if (result.error) {
      alert('Ошибка: ' + result.error.message)
      return
    }

    await supabase
      .from('orders')
      .update({ status: 'in_progress' })
      .eq('id', orderId)

    alert('Отклик принят! Заказ в работе.')
    await loadBids(orderId)
    await loadOrder(orderId)
  }

  // ✅ Завершение заказа
  const handleCompleteOrder = async () => {
    if (!confirm('Завершить заказ?')) return

    const result = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (result.error) {
      alert('Ошибка: ' + result.error.message)
      return
    }

    alert('Заказ завершён!')
    await loadOrder(orderId)
  }

  // ✅ Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      alert('Введите сообщение')
      return
    }

    const result = await supabase
      .from('messages')
      .insert({
        order_id: orderId,
        sender_id: user.id,
        content: newMessage
      })

    if (result.error) {
      alert('Ошибка: ' + result.error.message)
      return
    }

    setNewMessage('')
    await loadMessages(orderId)
  }

  // ✅ useEffect ТЕПЕРЬ после всех функций
  useEffect(() => {
    const initPage = async () => {
      console.log('Загрузка страницы заказа...', orderId)
      
      const sessionResult = await supabase.auth.getSession()
      const session = sessionResult.data?.session
      
      if (!session?.user) {
        console.log('Нет сессии, редирект на login')
        router.push('/login')
        return
      }
      
      setUser(session.user)
      
      const profileResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = profileResult.data?.role
      console.log('Роль пользователя:', role)
      setUserRole(role)
      
      await loadOrder(orderId)
      await loadBids(orderId)
      await loadMessages(orderId)
      
      setLoading(false)
    }
    
    initPage()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">Заказ не найден</div>
      </div>
    )
  }

  const isSeller = userRole === 'seller' && order.seller_id === user.id
  const isCreator = userRole === 'creator'
  const userHasBid = bids.some(function(b) { return b.creator_id === user.id })

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Навигация */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← На главную
          </Link>
        </div>

        {/* Информация о заказе */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{order.title}</h1>
              <p className="text-gray-600 mt-2">{order.description}</p>
            </div>
            <span className={'px-4 py-2 rounded font-medium ' + (
              order.status === 'open' ? 'bg-green-100 text-green-800' :
              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            )}>
              {order.status === 'open' ? 'Открыт' :
               order.status === 'in_progress' ? 'В работе' :
               order.status === 'completed' ? 'Завершён' :
               'Отменён'}
            </span>
          </div>
          {/* Информация о бюджете и комиссии (только для продавца) */}
          <div className="flex justify-between items-center">
            
              <div>
                <p className="text-green-600 font-bold text-xl">{order.budget} руб.</p>
                  <p className="text-sm text-gray-500">
                    Комиссия сервиса: {order.commission || 0} руб. (5%)
                  </p>
                <p className="text-sm text-blue-600 font-medium">
                    Креатор получит: {order.budget} руб.
                </p>
                  <p className="text-sm text-orange-600 font-medium">
                    Продавец платит: {order.budget + (order.commission || 0)} руб.
                </p>
              </div>
          
            {isSeller && order.status === 'in_progress' && (
              <button
                onClick={handleCompleteOrder}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Завершить заказ
              </button>
            )}
          </div>
        </div>

        {/* Отклики (только для seller) */}
        {isSeller && order.status === 'open' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Отклики креаторов</h2>
            
            {bids.length === 0 ? (
              <p className="text-gray-500">Пока нет откликов</p>
            ) : (
              <div className="space-y-4">
                {bids.map(function(bid) {
                  return (
                    <div key={bid.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{bid.profiles?.username || 'Креатор'}</p>
                          <p className="text-gray-600 mt-1">{bid.message}</p>
                          <p className="text-green-600 font-bold mt-2">{bid.price} руб.</p>
                        </div>
                        <div>
                          <span className={'px-3 py-1 rounded text-sm ' + (
                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {bid.status === 'pending' ? 'Ожидает' :
                             bid.status === 'accepted' ? 'Принят' :
                             'Отклонён'}
                          </span>
                        </div>
                      </div>
                      {bid.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptBid(bid.id)}
                          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Принять отклик
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Форма отклика (только для creator) */}
        {isCreator && order.status === 'open' && !userHasBid && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Оставить отклик</h2>
            
            <form onSubmit={handleSendBid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Цена (руб)</label>
                <input
                  type="number"
                  value={newBidPrice}
                  onChange={(e) => setNewBidPrice(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="1000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Сообщение</label>
                <textarea
                  value={newBidMessage}
                  onChange={(e) => setNewBidMessage(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Опишите ваш подход к задаче..."
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
              >
                Отправить отклик
              </button>
            </form>
          </div>
        )}

        {/* Если creator уже оставил отклик */}
        {isCreator && order.status === 'open' && userHasBid && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <p className="text-gray-600">Вы уже оставили отклик на этот заказ</p>
            <p className="text-sm text-gray-500 mt-2">Ожидайте решения продавца</p>
          </div>
        )}

        {/* Чат */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Чат</h2>
          
          {/* Сообщения */}
          <div className="border rounded-lg p-4 mb-4 h-64 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">Нет сообщений</p>
            ) : (
              <div className="space-y-2">
                {messages.map(function(msg) {
                  const isOwnMessage = msg.sender_id === user.id
                  return (
                    <div
                      key={msg.id}
                      className={'p-3 rounded ' + (
                        isOwnMessage ? 'bg-blue-100 ml-8' : 'bg-gray-200 mr-8'
                      )}
                    >
                      <p className="text-sm font-bold text-gray-600">
                        {msg.profiles?.username || (isOwnMessage ? 'Вы' : 'Собеседник')}
                      </p>
                      <p className="mt-1">{msg.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Форма отправки */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Введите сообщение..."
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Отправить
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}