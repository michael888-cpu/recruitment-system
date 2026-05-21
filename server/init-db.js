const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'interview.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建数据表
db.exec(`
  -- 大类表（社会招聘/校园招聘）
  CREATE TABLE IF NOT EXISTS recruitment_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('social', 'campus')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 岗位表
  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    sequence TEXT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES recruitment_categories(id) ON DELETE CASCADE
  );

  -- 题库表
  CREATE TABLE IF NOT EXISTS question_banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    question_type TEXT DEFAULT 'text',
    answer_template TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
  );

  -- 评分维度表（岗位级别）
  CREATE TABLE IF NOT EXISTS rating_dimensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    dimension_name TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
  );

  -- 面试邀请表
  CREATE TABLE IF NOT EXISTS interview_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    interview_link TEXT NOT NULL UNIQUE,
    candidate_name TEXT,
    candidate_email TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
  );

  -- 候选人信息表
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position_id INTEGER,
    invite_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
  );

  -- 面试回答表（存储候选人回答）
  CREATE TABLE IF NOT EXISTS interview_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    rating_score INTEGER,
    rating_comment TEXT,
    rated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_banks(id) ON DELETE CASCADE
  );

  -- 面试会话表
  CREATE TABLE IF NOT EXISTS interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invite_id TEXT NOT NULL UNIQUE,
    position_id INTEGER NOT NULL,
    candidate_id INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'expired')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE SET NULL
  );
`);

// 插入默认大类
const insertCategory = db.prepare('INSERT OR IGNORE INTO recruitment_categories (name, type) VALUES (?, ?)');
insertCategory.run('社会招聘', 'social');
insertCategory.run('校园招聘', 'campus');

console.log('数据库初始化完成！');
db.close();
