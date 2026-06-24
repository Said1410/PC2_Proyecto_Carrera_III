import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplndexnmztcvkxqgtfg.supabase.co' // ¡Asegúrate que tenga https://!
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbG5kZXhubXp0Y3ZreHFndGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTMxNzksImV4cCI6MjA5NzgyOTE3OX0.8HSPgj-Eb1oFkxgKHVgT_fazq8G1b3cyZOCHPFtS-ag'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)