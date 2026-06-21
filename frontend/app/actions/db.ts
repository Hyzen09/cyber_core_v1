'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Using the service role key from the python backend to bypass RLS
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3dtY3F3dWR5YnhicHhjb2F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0NTg4NCwiZXhwIjoyMDk2ODIxODg0fQ.L9GcPISzuZa8M8_5spid9XTu6dJjNEbcFdWNb7FYDwc"
const supabase = createClient(supabaseUrl, supabaseKey)

export async function fetchChatsAction(userId: string) {
  const { data, error } = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function loadChatAction(chatId: string) {
  const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getChatDetailsAction(chatId: string) {
  const { data, error } = await supabase.from('chats').select('*').eq('id', chatId).single()
  if (error) throw error
  return data
}

export async function renameChatAction(chatId: string, title: string) {
  const { error } = await supabase.from('chats').update({ title }).eq('id', chatId)
  if (error) throw error
  return true
}

export async function deleteChatAction(chatId: string) {
  await supabase.from('messages').delete().eq('chat_id', chatId)
  const { error } = await supabase.from('chats').delete().eq('id', chatId)
  if (error) throw error
  return true
}

export async function createChatAction(title: string, userId: string, agent_id?: string) {
  const insertData: any = { title, user_id: userId }
  if (agent_id) insertData.agent_id = agent_id
  
  const { data, error } = await supabase.from('chats').insert([insertData]).select().single()
  if (error) throw error
  return data
}
