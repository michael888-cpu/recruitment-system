-- 招聘面试系统 - Supabase 数据库结构

-- 1. 大类表（社会招聘/校园招聘）
CREATE TABLE recruitment_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('social', 'campus')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 岗位表
CREATE TABLE positions (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES recruitment_categories(id) ON DELETE CASCADE,
  sequence TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 题库表
CREATE TABLE question_banks (
  id BIGSERIAL PRIMARY KEY,
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',
  answer_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 评分维度表（岗位级别）
CREATE TABLE rating_dimensions (
  id BIGSERIAL PRIMARY KEY,
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 面试邀请表
CREATE TABLE interview_invites (
  id BIGSERIAL PRIMARY KEY,
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  interview_link TEXT NOT NULL UNIQUE,
  candidate_name TEXT,
  candidate_email TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 6. 候选人表
CREATE TABLE candidates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position_id BIGINT,
  invite_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 面试回答表
CREATE TABLE interview_answers (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  rating_score INTEGER,
  rating_comment TEXT,
  rated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 面试记录表（视频面试）
CREATE TABLE interview_records (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_id BIGINT REFERENCES positions(id) ON DELETE SET NULL,
  transcript TEXT,
  duration_seconds INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS策略
ALTER TABLE recruitment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_records ENABLE ROW LEVEL SECURITY;

-- 允许公开读写（后续可添加管理员验证）
CREATE POLICY "Allow all" ON recruitment_categories FOR ALL USING (true);
CREATE POLICY "Allow all" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all" ON question_banks FOR ALL USING (true);
CREATE POLICY "Allow all" ON rating_dimensions FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_invites FOR ALL USING (true);
CREATE POLICY "Allow all" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_answers FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_records FOR ALL USING (true);
