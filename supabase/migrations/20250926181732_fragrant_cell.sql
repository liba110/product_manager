/*
  # Add index for products created_at column

  1. Performance Optimization
    - Add index on `created_at` column in `products` table
    - This will significantly speed up queries that order by creation date
    - Prevents statement timeout errors when fetching products

  2. Changes
    - Creates index `products_created_at_idx` on `created_at DESC`
    - Uses `IF NOT EXISTS` to prevent errors if index already exists
*/

-- Add index for created_at column to speed up ORDER BY queries
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);