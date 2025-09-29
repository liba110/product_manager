/*
  # Create products table for cross-browser persistence

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `image_url` (text, nullable)
      - `categories` (jsonb) - stores the task categories and completion status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, nullable) - for future user authentication

  2. Security
    - Enable RLS on `products` table
    - Add policy for public access (since no auth yet)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  image_url text,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- For now, allow public access since we don't have authentication
-- In production, you'd want to add proper user authentication
CREATE POLICY "Allow public access to products"
  ON products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);