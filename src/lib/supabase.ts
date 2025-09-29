import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://glvzfaigecydhgyqhihq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdnpmYWlnZWN5ZGhneXFoaWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTcwMzcsImV4cCI6MjA3Mzg3MzAzN30.c5EB_7bj1pyarMZoTAje0v-XWGYB8FUZjUG_2kpDg8w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    statement_timeout: 20000, // Increase timeout to 20 seconds
  },
});

export interface DatabaseProduct {
  id: string;
  name: string;
  image_url: string | null;
  categories: string[];
  created_at: string;
  updated_at: string;
  user_id: string | null;
}