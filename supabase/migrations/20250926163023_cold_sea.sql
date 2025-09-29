/*
  # Add Performance Indexes

  1. Indexes
    - Add index on `updated_at` for faster ordering
    - Add index on `created_at` for faster ordering
    - Add index on `name` for faster searching

  2. Performance
    - These indexes will prevent statement timeouts
    - Queries will be much faster
*/

-- Add index on updated_at for faster ordering (most important)
CREATE INDEX IF NOT EXISTS products_updated_at_idx ON products (updated_at DESC);

-- Add index on created_at for faster ordering
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);

-- Add index on name for faster searching
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);

-- Add index on user_id if you plan to filter by user
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products (user_id);