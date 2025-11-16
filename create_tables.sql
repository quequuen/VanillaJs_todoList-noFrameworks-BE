-- 프로덕션 환경에서 테이블 수동 생성용 SQL
-- Render PostgreSQL에서 직접 실행하거나, psql로 실행

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- magic_link_tokens 테이블 생성
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_magic_link_expires ON magic_link_tokens(expires_at);

-- 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'magic_link_tokens');

