/*
  # Enhanced Search Performance Migration
  
  1. New Features
    - Add normalized columns for case-insensitive search
    - Add function to automatically maintain these columns
    - Maintain data consistency across all books
  
  2. Changes
    - Add title_lower and author_lower columns to books table
    - Create trigger to update normalized columns on insert/update
    - Backfill existing data
  
  3. Performance
    - Create appropriate indexes for the new columns
    - Optimize for case-insensitive search performance
*/

-- Add normalized columns for case-insensitive searching
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS title_lower text GENERATED ALWAYS AS (lower(title)) STORED,
ADD COLUMN IF NOT EXISTS author_lower text GENERATED ALWAYS AS (lower(author)) STORED;

-- Add indexes on normalized columns for faster searching
CREATE INDEX IF NOT EXISTS idx_books_title_lower_trgm ON books USING gin (title_lower gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_lower_trgm ON books USING gin (author_lower gin_trgm_ops);

-- Ensure the pg_trgm extension is enabled (if not already)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update existing search function to use the normalized columns
CREATE OR REPLACE FUNCTION search_books(search_query text)
RETURNS SETOF books AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM books
  WHERE 
    title_lower LIKE '%' || lower(search_query) || '%' OR
    author_lower LIKE '%' || lower(search_query) || '%'
  ORDER BY 
    CASE 
      WHEN title_lower = lower(search_query) THEN 0
      WHEN title_lower LIKE lower(search_query) || '%' THEN 1
      WHEN title_lower LIKE '%' || lower(search_query) || '%' THEN 2
      WHEN author_lower = lower(search_query) THEN 3
      WHEN author_lower LIKE lower(search_query) || '%' THEN 4
      ELSE 5
    END,
    title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 