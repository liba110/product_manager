/*
  # Add progress column to products table

  1. New Column
    - `progress` (integer, default 0) - stores the calculated progress percentage

  2. Changes
    - Add progress column to track product completion
    - Set default value to 0 for existing products
*/

-- Add progress column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;