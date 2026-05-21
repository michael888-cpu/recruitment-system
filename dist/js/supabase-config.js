/**
 * Supabase 配置
 */
const SUPABASE_URL = 'https://llsibvpgzowtchxylyjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsc2lidnBnem93dGNoeHlseWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTA3NjgsImV4cCI6MjA5NDgyNjc2OH0.mUzlkC6KkDp4UX-vM926fO5ZrzS9kp1o-S6TX0VK5rA';

let supabaseClient;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

const API = {
  // ========== 大类管理 ==========
  async getCategories() {
    const { data, error } = await supabaseClient
      .from('recruitment_categories')
      .select('*')
      .order('id');
    return { data, error };
  },
  async createCategory(name, type) {
    const { data, error } = await supabaseClient
      .from('recruitment_categories')
      .insert([{ name, type }])
      .select();
    return { data, error };
  },
  async deleteCategory(id) {
    const { error } = await supabaseClient
      .from('recruitment_categories')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ========== 岗位管理 ==========
  async getPositions(categoryId) {
    let query = supabaseClient
      .from('positions')
      .select('*, recruitment_categories(name)')
      .order('id');
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data, error } = await query;
    return { data, error };
  },
  async getPosition(id) {
    const { data, error } = await supabaseClient
      .from('positions')
      .select('*, recruitment_categories(name, type)')
      .eq('id', id)
      .single();
    return { data, error };
  },
  async createPosition(categoryId, sequence, name) {
    const { data, error } = await supabaseClient
      .from('positions')
      .insert([{ category_id: categoryId, sequence, name }])
      .select();
    return { data, error };
  },
  async updatePosition(id, sequence, name) {
    const { error } = await supabaseClient
      .from('positions')
      .update({ sequence, name })
      .eq('id', id);
    return { error };
  },
  async deletePosition(id) {
    const { error } = await supabaseClient
      .from('positions')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ========== 岗位-题目关联 ==========
  async getPositionQuestions(positionId) {
    const { data, error } = await supabaseClient
      .from('position_questions')
      .select('*, question_banks(*)')
      .eq('position_id', positionId)
      .order('sort_order');
    return { data, error };
  },
  async addQuestionToPosition(positionId, questionId, sortOrder) {
    const { data, error } = await supabaseClient
      .from('position_questions')
      .insert([{ position_id: positionId, question_id: questionId, sort_order: sortOrder || 0 }])
      .select();
    return { data, error };
  },
  async removeQuestionFromPosition(positionId, questionId) {
    const { error } = await supabaseClient
      .from('position_questions')
      .delete()
      .eq('position_id', positionId)
      .eq('question_id', questionId);
    return { error };
  },
  async batchAddQuestionsToPosition(positionId, questionIds) {
    const rows = questionIds.map((qid, idx) => ({
      position_id: positionId,
      question_id: qid,
      sort_order: idx
    }));
    const { data, error } = await supabaseClient
      .from('position_questions')
      .insert(rows)
      .select();
    return { data, error };
  },

  // ========== 题库管理（全局题库，不绑定岗位） ==========
  async getQuestions() {
    const { data, error } = await supabaseClient
      .from('question_banks')
      .select('*, position_questions(positions(id, name))')
      .order('id');
    return { data, error };
  },
  async createQuestion(question, questionType, answerTemplate, category) {
    const { data, error } = await supabaseClient
      .from('question_banks')
      .insert([{ question, question_type: questionType, answer_template: answerTemplate, category }])
      .select();
    return { data, error };
  },
  async createQuestionsBatch(questions) {
    const { data, error } = await supabaseClient
      .from('question_banks')
      .insert(questions)
      .select();
    return { data, error };
  },
  async updateQuestion(id, question, questionType, answerTemplate, category) {
    const { error } = await supabaseClient
      .from('question_banks')
      .update({ question, question_type: questionType, answer_template: answerTemplate, category })
      .eq('id', id);
    return { error };
  },
  async deleteQuestion(id) {
    const { error } = await supabaseClient
      .from('question_banks')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ========== 评分维度管理 ==========
  async getDimensions(positionId) {
    const { data, error } = await supabaseClient
      .from('rating_dimensions')
      .select('*')
      .eq('position_id', positionId)
      .order('id');
    return { data, error };
  },
  async createDimension(positionId, dimensionName, weight, description) {
    const { data, error } = await supabaseClient
      .from('rating_dimensions')
      .insert([{ position_id: positionId, dimension_name: dimensionName, weight, description }])
      .select();
    return { data, error };
  },
  async updateDimension(id, dimensionName, weight, description) {
    const { error } = await supabaseClient
      .from('rating_dimensions')
      .update({ dimension_name: dimensionName, weight, description })
      .eq('id', id);
    return { error };
  },
  async deleteDimension(id) {
    const { error } = await supabaseClient
      .from('rating_dimensions')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ========== 面试邀请管理 ==========
  async getInvites() {
    const { data, error } = await supabaseClient
      .from('interview_invites')
      .select('*, positions(name, sequence)')
      .order('invited_at', { ascending: false });
    return { data, error };
  },
  async createInvite(positionId, candidateName, candidateEmail) {
    const interviewLink = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
      .from('interview_invites')
      .insert([{
        position_id: positionId,
        interview_link: interviewLink,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        expires_at: expiresAt
      }])
      .select();
    return { data, error };
  },
  async deleteInvite(id) {
    const { error } = await supabaseClient
      .from('interview_invites')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ========== 候选人管理 ==========
  async getCandidates() {
    const { data, error } = await supabaseClient
      .from('candidates')
      .select('*, positions(name)')
      .order('created_at', { ascending: false });
    return { data, error };
  },
  async getCandidate(id) {
    const { data: candidate, error: candidateErr } = await supabaseClient
      .from('candidates')
      .select('*, positions(name)')
      .eq('id', id)
      .single();
    if (candidateErr) return { data: null, error: candidateErr };

    const { data: answers, error: answersErr } = await supabaseClient
      .from('interview_answers')
      .select('*, question_banks(question, answer_template)')
      .eq('candidate_id', id)
      .order('created_at');
    if (answersErr) return { data: null, error: answersErr };

    const { data: records } = await supabaseClient
      .from('interview_records')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at');

    return { data: { ...candidate, answers, records: records || [] }, error: null };
  },
  async createCandidate(name, email, phone, positionId, inviteLink) {
    const { data, error } = await supabaseClient
      .from('candidates')
      .insert([{ name, email, phone, position_id: positionId, invite_link: inviteLink }])
      .select();
    return { data, error };
  },

  // ========== 面试回答 ==========
  async submitAnswer(candidateId, questionId, answerText) {
    const { data, error } = await supabaseClient
      .from('interview_answers')
      .insert([{ candidate_id: candidateId, question_id: questionId, answer_text: answerText }])
      .select();
    return { data, error };
  },
  async rateAnswer(id, ratingScore, ratingComment) {
    const { error } = await supabaseClient
      .from('interview_answers')
      .update({ rating_score: ratingScore, rating_comment: ratingComment, rated_by: 'admin' })
      .eq('id', id);
    return { error };
  },

  // ========== 面试记录（视频面试） ==========
  async saveInterviewRecord(candidateId, recordData) {
    const { data, error } = await supabaseClient
      .from('interview_records')
      .insert([{
        candidate_id: candidateId,
        position_id: recordData.positionId,
        transcript: recordData.transcript,
        duration_seconds: recordData.durationSeconds,
        question_count: recordData.questionCount,
        status: recordData.status || 'completed'
      }])
      .select();
    return { data, error };
  },
  async getInterviewRecords() {
    const { data, error } = await supabaseClient
      .from('interview_records')
      .select('*, candidates(name, email), positions(name)')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // ========== 候选人端 ==========
  async getInterviewByLink(link) {
    const { data: invite, error: inviteErr } = await supabaseClient
      .from('interview_invites')
      .select('*, positions(id, name)')
      .eq('interview_link', link)
      .single();
    if (inviteErr) return { data: null, error: inviteErr };

    // 通过 position_questions 获取该岗位关联的题目
    const { data: pqData, error: pqErr } = await supabaseClient
      .from('position_questions')
      .select('question_id, sort_order, question_banks(id, question, question_type, answer_template)')
      .eq('position_id', invite.position_id)
      .order('sort_order');
    if (pqErr) return { data: null, error: pqErr };

    const questions = pqData.map(pq => ({
      id: pq.question_banks.id,
      question: pq.question_banks.question,
      question_type: pq.question_banks.question_type,
      answer_template: pq.question_banks.answer_template
    }));

    return { data: { ...invite, questions }, error: null };
  },

  // ========== 更新邀请状态 ==========
  async updateInviteStatus(id, status) {
    const { error } = await supabaseClient
      .from('interview_invites')
      .update({ status })
      .eq('id', id);
    return { error };
  }
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
