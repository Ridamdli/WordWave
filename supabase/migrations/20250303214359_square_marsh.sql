/*
  # Create book links and reviews tables

  1. New Tables
    - `book_links`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key to books)
      - `download_url` (text)
      - `read_url` (text)
      - `created_at` (timestamp)
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `book_id` (uuid, foreign key to books)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create book_links table
CREATE TABLE IF NOT EXISTS book_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books NOT NULL,
  download_url text,
  read_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  book_id uuid REFERENCES books NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  username text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE book_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for book_links table
CREATE POLICY "Book links are viewable by everyone"
  ON book_links
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert book links"
  ON book_links
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update book links"
  ON book_links
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policies for reviews table
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for profiles table
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create trigger to create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add sample data for testing
INSERT INTO book_links (book_id, download_url, read_url)
SELECT 
  id, 
  'https://example.com/download/' || id || '.pdf',
  'https://example.com/read/' || id
FROM books
ON CONFLICT (book_id) DO NOTHING;