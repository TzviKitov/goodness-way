-- Run once in Neon SQL Editor if db:push fails after a partial push
-- (search_vector was created as text instead of tsvector).

DROP INDEX IF EXISTS articles_search_vector_idx;

ALTER TABLE articles DROP COLUMN IF EXISTS search_vector;

-- Then run: npm run db:push
