/*
  # Fix Reviews Schema

  1. Changes
    - Add foreign key relationship between reviews and auth.users (if not exists)
    - Enable RLS on reviews table
    - Add policies for:
      - Anyone can read reviews
      - Authenticated users can create reviews
      - Users can update/delete their own reviews
    - Add performance indexes

  2. Security
    - Enable RLS
    - Add appropriate policies for CRUD operations
*/

-- Check and add foreign key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_user_id_fkey'
  ) THEN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Create policies
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'reviews_book_id_idx'
  ) THEN
    CREATE INDEX reviews_book_id_idx ON reviews(book_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'reviews_user_id_idx'
  ) THEN
    CREATE INDEX reviews_user_id_idx ON reviews(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'reviews_created_at_idx'
  ) THEN
    CREATE INDEX reviews_created_at_idx ON reviews(created_at DESC);
  END IF;
END $$;