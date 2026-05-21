const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
const dbPath = path.join(__dirname, 'interview.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// ==================== 大类管理 ====================

// 获取所有大类
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM recruitment_categories ORDER BY id').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建大类
app.post('/api/categories', (req, res) => {
  try {
    const { name, type } = req.body;
    const stmt = db.prepare('INSERT INTO recruitment_categories (name, type) VALUES (?, ?)');
    const result = stmt.run(name, type);
    res.json({ id: result.lastInsertRowid, name, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除大类
app.delete('/api/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recruitment_categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 岗位管理 ====================

// 获取某大类下的所有岗位
app.get('/api/positions', (req, res) => {
  try {
    const { categoryId } = req.query;
    let sql = `SELECT p.*, c.name as category_name 
               FROM positions p 
               JOIN recruitment_categories c ON p.category_id = c.id`;
    const params = [];
    if (categoryId) {
      sql += ' WHERE p.category_id = ?';
      params.push(categoryId);
    }
    sql += ' ORDER BY p.id';
    const positions = db.prepare(sql).all(...params);
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个岗位详情（含评分维度）
app.get('/api/positions/:id', (req, res) => {
  try {
    const position = db.prepare(`
      SELECT p.*, c.name as category_name, c.type as category_type
      FROM positions p
      JOIN recruitment_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);
    
    if (!position) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    
    // 获取该岗位的评分维度
    const dimensions = db.prepare('SELECT * FROM rating_dimensions WHERE position_id = ?').all(req.params.id);
    position.dimensions = dimensions;
    
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建岗位
app.post('/api/positions', (req, res) => {
  try {
    const { categoryId, sequence, name } = req.body;
    const stmt = db.prepare('INSERT INTO positions (category_id, sequence, name) VALUES (?, ?, ?)');
    const result = stmt.run(categoryId, sequence || '', name);
    res.json({ id: result.lastInsertRowid, categoryId, sequence, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新岗位
app.put('/api/positions/:id', (req, res) => {
  try {
    const { sequence, name } = req.body;
    db.prepare('UPDATE positions SET sequence = ?, name = ? WHERE id = ?')
      .run(sequence, name, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除岗位
app.delete('/api/positions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 题库管理 ====================

// 获取某岗位的所有题目
app.get('/api/questions', (req, res) => {
  try {
    const { positionId } = req.query;
    let sql = `SELECT q.*, p.name as position_name 
               FROM question_banks q 
               JOIN positions p ON q.position_id = p.id`;
    const params = [];
    if (positionId) {
      sql += ' WHERE q.position_id = ?';
      params.push(positionId);
    }
    sql += ' ORDER BY q.id';
    const questions = db.prepare(sql).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建题目
app.post('/api/questions', (req, res) => {
  try {
    const { positionId, question, questionType, answerTemplate } = req.body;
    const stmt = db.prepare('INSERT INTO question_banks (position_id, question, question_type, answer_template) VALUES (?, ?, ?, ?)');
    const result = stmt.run(positionId, question, questionType || 'text', answerTemplate || '');
    res.json({ id: result.lastInsertRowid, positionId, question, questionType, answerTemplate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新题目
app.put('/api/questions/:id', (req, res) => {
  try {
    const { question, questionType, answerTemplate } = req.body;
    db.prepare('UPDATE question_banks SET question = ?, question_type = ?, answer_template = ? WHERE id = ?')
      .run(question, questionType, answerTemplate, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除题目
app.delete('/api/questions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM question_banks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 评分维度管理 ====================

// 获取某岗位的评分维度
app.get('/api/dimensions', (req, res) => {
  try {
    const { positionId } = req.query;
    const dimensions = db.prepare('SELECT * FROM rating_dimensions WHERE position_id = ? ORDER BY id').all(positionId);
    res.json(dimensions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建评分维度
app.post('/api/dimensions', (req, res) => {
  try {
    const { positionId, dimensionName, weight, description } = req.body;
    const stmt = db.prepare('INSERT INTO rating_dimensions (position_id, dimension_name, weight, description) VALUES (?, ?, ?, ?)');
    const result = stmt.run(positionId, dimensionName, weight || 0, description || '');
    res.json({ id: result.lastInsertRowid, positionId, dimensionName, weight, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新评分维度
app.put('/api/dimensions/:id', (req, res) => {
  try {
    const { dimensionName, weight, description } = req.body;
    db.prepare('UPDATE rating_dimensions SET dimension_name = ?, weight = ?, description = ? WHERE id = ?')
      .run(dimensionName, weight, description, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除评分维度
app.delete('/api/dimensions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM rating_dimensions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 面试邀请管理 ====================

// 获取所有面试邀请
app.get('/api/invites', (req, res) => {
  try {
    const { positionId } = req.query;
    let sql = `SELECT i.*, p.name as position_name, p.sequence as position_sequence
               FROM interview_invites i
               JOIN positions p ON i.position_id = p.id`;
    const params = [];
    if (positionId) {
      sql += ' WHERE i.position_id = ?';
      params.push(positionId);
    }
    sql += ' ORDER BY i.invited_at DESC';
    const invites = db.prepare(sql).all(...params);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建面试邀请
app.post('/api/invites', (req, res) => {
  try {
    const { positionId, candidateName, candidateEmail } = req.body;
    const interviewLink = `${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天后过期
    
    const stmt = db.prepare(`
      INSERT INTO interview_invites (position_id, interview_link, candidate_name, candidate_email, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(positionId, interviewLink, candidateName || '', candidateEmail || '', expiresAt);
    
    const invite = db.prepare('SELECT * FROM interview_invites WHERE id = ?').get(result.lastInsertRowid);
    res.json(invite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除面试邀请
app.delete('/api/invites/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM interview_invites WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 候选人端接口 ====================

// 通过邀请链接获取面试信息
app.get('/api/interview/:link', (req, res) => {
  try {
    const invite = db.prepare(`
      SELECT i.*, p.name as position_name, p.id as position_id
      FROM interview_invites i
      JOIN positions p ON i.position_id = p.id
      WHERE i.interview_link = ?
    `).get(req.params.link);
    
    if (!invite) {
      return res.status(404).json({ error: '面试邀请不存在' });
    }
    
    // 检查是否过期
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: '面试邀请已过期' });
    }
    
    // 获取该岗位的题目
    const questions = db.prepare('SELECT id, question, question_type FROM question_banks WHERE position_id = ?').all(invite.position_id);
    
    res.json({ ...invite, questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 候选人提交信息
app.post('/api/interview/:link/register', (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const invite = db.prepare('SELECT * FROM interview_invites WHERE interview_link = ?').get(req.params.link);
    
    if (!invite) {
      return res.status(404).json({ error: '面试邀请不存在' });
    }
    
    // 创建或更新候选人
    const candidateStmt = db.prepare(`
      INSERT INTO candidates (name, email, phone, position_id, invite_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = candidateStmt.run(name, email, phone, invite.position_id, req.params.link);
    
    res.json({ success: true, candidateId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 候选人提交回答
app.post('/api/answers', (req, res) => {
  try {
    const { candidateId, questionId, answerText } = req.body;
    const stmt = db.prepare('INSERT INTO interview_answers (candidate_id, question_id, answer_text) VALUES (?, ?, ?)');
    const result = stmt.run(candidateId, questionId, answerText);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取候选人的所有回答
app.get('/api/answers', (req, res) => {
  try {
    const { candidateId } = req.query;
    const answers = db.prepare(`
      SELECT a.*, q.question, q.question_type
      FROM interview_answers a
      JOIN question_banks q ON a.question_id = q.id
      WHERE a.candidate_id = ?
      ORDER BY a.created_at
    `).all(candidateId);
    res.json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 评分回答
app.put('/api/answers/:id/rate', (req, res) => {
  try {
    const { ratingScore, ratingComment, ratedBy } = req.body;
    db.prepare('UPDATE interview_answers SET rating_score = ?, rating_comment = ?, rated_by = ? WHERE id = ?')
      .run(ratingScore, ratingComment, ratedBy || '', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 候选人列表 ====================

// 获取所有候选人
app.get('/api/candidates', (req, res) => {
  try {
    const { positionId } = req.query;
    let sql = `SELECT c.*, p.name as position_name
               FROM candidates c
               LEFT JOIN positions p ON c.position_id = p.id`;
    const params = [];
    if (positionId) {
      sql += ' WHERE c.position_id = ?';
      params.push(positionId);
    }
    sql += ' ORDER BY c.created_at DESC';
    const candidates = db.prepare(sql).all(...params);
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取候选人的完整面试信息（含回答和评分）
app.get('/api/candidates/:id', (req, res) => {
  try {
    const candidate = db.prepare(`
      SELECT c.*, p.name as position_name
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      WHERE c.id = ?
    `).get(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: '候选人不存在' });
    }
    
    // 获取回答
    const answers = db.prepare(`
      SELECT a.*, q.question, q.question_type, q.answer_template
      FROM interview_answers a
      JOIN question_banks q ON a.question_id = q.id
      WHERE a.candidate_id = ?
    `).all(req.params.id);
    
    // 获取该岗位的评分维度
    const dimensions = db.prepare('SELECT * FROM rating_dimensions WHERE position_id = ?').all(candidate.position_id);
    
    res.json({ ...candidate, answers, dimensions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
