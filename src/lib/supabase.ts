import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dqxngfasbmgsnhejhhog.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeG5nZmFzYm1nc25oZWpoaG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNzE1MjAsImV4cCI6MjA0Mjg0NzUyMH0.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseProduct {
  id: string;
  name: string;
  image_url: string | null;
  categories: string[];
  created_at: string;
  updated_at: string;
  user_id: string | null;
}