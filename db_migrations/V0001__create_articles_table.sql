
-- Таблица статей для всех разделов (народная медицина, официальная медицина, бессмертие)
CREATE TABLE IF NOT EXISTS t_p30629249_ai_longevity_researc.articles (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL, -- 'folk', 'official', 'immortality', 'oracle'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_section_idx ON t_p30629249_ai_longevity_researc.articles(section);
CREATE INDEX IF NOT EXISTS articles_created_idx ON t_p30629249_ai_longevity_researc.articles(created_at DESC);
