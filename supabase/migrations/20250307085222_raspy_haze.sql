/*
  # Initial Schema for Maktabati Project

  1. Tables Created
    - profiles (user profiles and preferences)
    - books (main books catalog)
    - user_books (tracks user's book interactions)
    - book_links (stores download and read URLs)
    - reviews (user reviews and ratings)
    - collections (user-created book collections)
    - collection_books (many-to-many relationship for collections)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up foreign key relationships

  3. Indexes
    - Add performance indexes for common queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  bio text,
  preferences jsonb DEFAULT '{"theme": "dark", "emailNotifications": true, "readingReminders": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Books Table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  author text NOT NULL,
  cover_url text,
  summary text,
  category text,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  downloads integer DEFAULT 0,
  formats text[] DEFAULT '{}'::text[],
  file_size text,
  page_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Books are viewable by everyone'
  ) THEN
    CREATE POLICY "Books are viewable by everyone"
      ON books FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Only admins can insert books'
  ) THEN
    CREATE POLICY "Only admins can insert books"
      ON books FOR INSERT
      WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Only admins can update books'
  ) THEN
    CREATE POLICY "Only admins can update books"
      ON books FOR UPDATE
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Book Links Table
CREATE TABLE IF NOT EXISTS book_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  download_url text,
  read_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id)
);

ALTER TABLE book_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'book_links' AND policyname = 'Book links are viewable by everyone'
  ) THEN
    CREATE POLICY "Book links are viewable by everyone"
      ON book_links FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'book_links' AND policyname = 'Only admins can insert book links'
  ) THEN
    CREATE POLICY "Only admins can insert book links"
      ON book_links FOR INSERT
      WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'book_links' AND policyname = 'Only admins can update book links'
  ) THEN
    CREATE POLICY "Only admins can update book links"
      ON book_links FOR UPDATE
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- User Books Table
CREATE TABLE IF NOT EXISTS user_books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_favorite boolean DEFAULT false,
  last_read timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_books' AND policyname = 'Users can view their own book relationships'
  ) THEN
    CREATE POLICY "Users can view their own book relationships"
      ON user_books FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_books' AND policyname = 'Users can insert their own book relationships'
  ) THEN
    CREATE POLICY "Users can insert their own book relationships"
      ON user_books FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_books' AND policyname = 'Users can update their own book relationships'
  ) THEN
    CREATE POLICY "Users can update their own book relationships"
      ON user_books FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_books' AND policyname = 'Users can delete their own book relationships'
  ) THEN
    CREATE POLICY "Users can delete their own book relationships"
      ON user_books FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone'
  ) THEN
    CREATE POLICY "Reviews are viewable by everyone"
      ON reviews FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Authenticated users can create reviews'
  ) THEN
    CREATE POLICY "Authenticated users can create reviews"
      ON reviews FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update their own reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews"
      ON reviews FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can delete their own reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews"
      ON reviews FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Public collections are viewable by everyone'
  ) THEN
    CREATE POLICY "Public collections are viewable by everyone"
      ON collections FOR SELECT
      USING (is_public OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can create collections'
  ) THEN
    CREATE POLICY "Users can create collections"
      ON collections FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can update their own collections'
  ) THEN
    CREATE POLICY "Users can update their own collections"
      ON collections FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can delete their own collections'
  ) THEN
    CREATE POLICY "Users can delete their own collections"
      ON collections FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Collection Books Table
CREATE TABLE IF NOT EXISTS collection_books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, book_id)
);

ALTER TABLE collection_books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collection_books' AND policyname = 'Collection books are viewable by collection viewers'
  ) THEN
    CREATE POLICY "Collection books are viewable by collection viewers"
      ON collection_books FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM collections
          WHERE id = collection_id
          AND (is_public OR auth.uid() = user_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collection_books' AND policyname = 'Users can add books to their collections'
  ) THEN
    CREATE POLICY "Users can add books to their collections"
      ON collection_books FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM collections
          WHERE id = collection_id
          AND auth.uid() = user_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collection_books' AND policyname = 'Users can remove books from their collections'
  ) THEN
    CREATE POLICY "Users can remove books from their collections"
      ON collection_books FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM collections
          WHERE id = collection_id
          AND auth.uid() = user_id
        )
      );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS books_title_idx ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS books_author_idx ON books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS books_category_idx ON books(category);
CREATE INDEX IF NOT EXISTS books_rating_idx ON books(rating DESC);
CREATE INDEX IF NOT EXISTS books_downloads_idx ON books(downloads DESC);

CREATE INDEX IF NOT EXISTS user_books_user_id_idx ON user_books(user_id);
CREATE INDEX IF NOT EXISTS user_books_book_id_idx ON user_books(book_id);
CREATE INDEX IF NOT EXISTS user_books_last_read_idx ON user_books(last_read DESC);

CREATE INDEX IF NOT EXISTS reviews_book_id_idx ON reviews(book_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS collections_is_public_idx ON collections(is_public);

CREATE INDEX IF NOT EXISTS collection_books_collection_id_idx ON collection_books(collection_id);
CREATE INDEX IF NOT EXISTS collection_books_book_id_idx ON collection_books(book_id);

-- Create function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();