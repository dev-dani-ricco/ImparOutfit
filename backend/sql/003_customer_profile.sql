CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_photo_url TEXT,
  age SMALLINT CHECK (age BETWEEN 13 AND 120),
  profession TEXT,
  body_shape TEXT CHECK (body_shape IN ('Ampulheta', 'Triângulo', 'Triângulo invertido', 'Retângulo', 'Oval')),
  mannequin_top TEXT,
  mannequin_bottom TEXT,
  bust_cm NUMERIC(5,2) CHECK (bust_cm > 0),
  waist_cm NUMERIC(5,2) CHECK (waist_cm > 0),
  hips_cm NUMERIC(5,2) CHECK (hips_cm > 0),
  height_cm NUMERIC(5,2) CHECK (height_cm BETWEEN 80 AND 250),
  avatar_config JSONB NOT NULL DEFAULT '{"renderer":"parametric-v1"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO customer_profiles(user_id)
SELECT id
  FROM users
 WHERE profile_type = 'PERSON'
ON CONFLICT (user_id) DO NOTHING;
