/*
  # Add index to products table for performance

  1. Performance Optimization
    - Add index on `updated_at` column for faster ORDER BY queries
    - This resolves the "statement timeout" error when loading products

  2. Changes
    - Create descending index on `updated_at` column to match query pattern
    - Use IF NOT EXISTS to prevent errors if index already exists
*/

-- Add index on updated_at column for faster ordering
CREATE INDEX IF NOT EXISTS products_updated_at_idx ON products (updated_at DESC);