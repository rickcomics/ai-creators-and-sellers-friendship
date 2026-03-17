// lib/auth-helpers.js
import { supabase } from './supabase'

// ✅ Получаем сессию при инициализации
export async function getSession() {
  const { session } = await supabase.auth.getSession()
  return session
}

// ✅ Слушаем изменения авторизации
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// ✅ Проверяем авторизацию
export async function requireAuth(router) {
  const { session } = await supabase.auth.getSession()
  
  if (!session) {
    router.push('/login')
    return null
  }
  
  return session.user
}