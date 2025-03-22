/*
  # Add Book Interactions Schema
  
  1. New Features
    - Like system for books
    - Save functionality for user's library
    - Automatic likes count tracking
  
  2. Changes
    - Add likes_count to books table
    - Create user_likes table for tracking likes
    - Add is_saved column to user_books table
    - Add RLS policies for likes
    - Add trigger for updating likes count
  
  3. Security
    - Enable RLS on user_likes table
    - Add policies for viewing and managing likes
*/

/*
  # Search Performance Optimization

  1. Create indexes for book search:
    - Index on books.title for faster title search
    - Index on books.author for faster author search
    - Note: These indexes specifically optimize for partial match (ILIKE) queries
*/

-- Create indexes to optimize search performance
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING gin (author gin_trgm_ops);

-- Ensure the pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add likes count to books table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE books ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
END $$;

-- Create user_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on user_likes
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

-- Add policies for user_likes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can view likes'
  ) THEN
    CREATE POLICY "Users can view likes"
      ON user_likes FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can like books'
  ) THEN
    CREATE POLICY "Users can like books"
      ON user_likes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can unlike books'
  ) THEN
    CREATE POLICY "Users can unlike books"
      ON user_likes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add is_saved column to user_books if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_books' AND column_name = 'is_saved'
  ) THEN
    ALTER TABLE user_books ADD COLUMN is_saved boolean DEFAULT false;
  END IF;
END $$;

-- Create or replace function to update likes count
CREATE OR REPLACE FUNCTION update_book_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE books 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.book_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE books 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.book_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_book_likes_count ON user_likes;
CREATE TRIGGER update_book_likes_count
  AFTER INSERT OR DELETE ON user_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_book_likes_count();