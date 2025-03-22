/*
  # WordWave Schema

  1. New Tables
    - `books` - Stores book information
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `author` (text, not null)
      - `cover_url` (text)
      - `summary` (text)
      - `category` (text)
      - `rating` (numeric)
      - `downloads` (integer)
      - `formats` (text array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `user_books` - Tracks user's interactions with books
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `book_id` (uuid, foreign key to books)
      - `progress` (integer)
      - `is_favorite` (boolean)
      - `last_read` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Books are viewable by everyone
    - Only authenticated users can manage their own book relationships
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  cover_url text,
  summary text,
  category text,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  downloads integer DEFAULT 0,
  formats text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_books table for tracking user's book interactions
CREATE TABLE IF NOT EXISTS user_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  book_id uuid REFERENCES books NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_favorite boolean DEFAULT false,
  last_read timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- Policies for books table
CREATE POLICY "Books are viewable by everyone"
  ON books
  FOR SELECT
  USING (true);

-- Fixed policy for INSERT - using WITH CHECK instead of USING
CREATE POLICY "Only admins can insert books"
  ON books
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Fixed policy for UPDATE - using WITH CHECK in addition to USING
CREATE POLICY "Only admins can update books"
  ON books
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policies for user_books table
CREATE POLICY "Users can view their own book relationships"
  ON user_books
  FOR SELECT
  USING (auth.uid() = user_id);

-- Fixed policy for ALL operations - using WITH CHECK in addition to USING
CREATE POLICY "Users can insert their own book relationships"
  ON user_books
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book relationships"
  ON user_books
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book relationships"
  ON user_books
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();