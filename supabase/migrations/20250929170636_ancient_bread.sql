/*
  # Disable RLS and fix products table access

  1. Security Changes
    - Disable RLS on products table
    - Drop existing policies
    - Allow public access to all operations

  2. Table Structure
    - Ensure products table has correct structure
    - Add any missing columns
*/

-- Disable RLS on products table
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public access to products" ON products;
DROP POLICY IF EXISTS "Users can read own data" ON products;
DROP POLICY IF EXISTS "Users can insert own data" ON products;
DROP POLICY IF EXISTS "Users can update own data" ON products;
DROP POLICY IF EXISTS "Users can delete own data" ON products;

-- Ensure the table structure is correct
DO $$
BEGIN
  -- Check if categories column exists and is jsonb
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'categories' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE products ALTER COLUMN categories TYPE jsonb USING categories::jsonb;
  END IF;
END $$;