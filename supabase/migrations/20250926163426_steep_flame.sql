/*
  # Create fresh products table with optimized schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `image_url` (text, nullable)
      - `categories` (jsonb, default empty array)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)
      - `user_id` (uuid, nullable for future auth)

  2. Security
    - Enable RLS on `products` table
    - Add policy for public access (temporary for development)

  3. Performance
    - Add indexes on frequently queried columns
    - Optimize for fast reads and writes
*/

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with optimized structure
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  image_url text,
  categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for development)
CREATE POLICY "Allow public access to products"
  ON products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add performance indexes
CREATE INDEX products_created_at_idx ON products (created_at DESC);
CREATE INDEX products_updated_at_idx ON products (updated_at DESC);
CREATE INDEX products_name_idx ON products (name);
CREATE INDEX products_user_id_idx ON products (user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();