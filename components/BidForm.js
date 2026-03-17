'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function BidForm({ orderId, onSuccess }) {
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('bids')
      .insert({
        order_id: orderId,
        creator_id: user.id,
        message,
        price: parseFloat(price),
        status: 'pending'
      })

    if (error) {
      alert('Ошибка: ' + error.message)
      setLoading(false)
      return
    }

    setMessage('')
    setPrice('')
    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">📬 Оставить отклик</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ваша цена (руб)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Например: 1500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Сообщение заказчику</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Расскажите о своём опыте, сроках и почему вы лучший выбор..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Отправка...' : 'Отправить отклик'}
        </button>
      </div>
    </form>
  )
}