// ========== 全局变量 ==========
let categories = [];
let positions = [];
let currentCategoryId = null;
let currentPositionId = null;
let editingPosition = null;
let currentRecordData = null;

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  if (!initSupabase()) {
    alert('系统加载失败，请刷新页面');
    return;
  }

  // 导航切换
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + link.dataset.page).classList.add('active');
      loadPage(link.dataset.page);
    });
  });

  loadPage('dashboard');
});

function loadPage(page) {
  switch(page) {
    case 'dashboard': loadDashboard(); break;
    case 'categories': loadCategories(); break;
    case 'positions': loadPositions(); break;
    case 'questions': loadQuestions(); break;
    case 'invites': loadInvites(); break;
    case 'candidates': loadCandidates(); break;
    case 'records': loadRecords(); break;
  }
}

// ========== 通用 ==========
function openModal(name) {
  document.getElementById(name + '-overlay').style.display = 'block';
  document.getElementById(name + '-modal').style.display = 'block';
}

function closeModal(name) {
  document.getElementById(name + '-overlay').style.display = 'none';
  document.getElementById(name + '-modal').style.display = 'none';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function copyLink(btn, url) {
  copyToClipboard(url);
  btn.textContent = '已复制';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 2000);
}

// ========== 首页 ==========
async function loadDashboard() {
  const [catRes, posRes, invRes, candRes] = await Promise.all([
    API.getCategories(), API.getPositions(), API.getInvites(), API.getCandidates()
  ]);

  const s = {
    categories: catRes.data?.length || 0,
    positions: posRes.data?.length || 0,
    invites: invRes.data?.length || 0,
    candidates: candRes.data?.length || 0
  };

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-icon si1">📂</div><div class="stat-value">${s.categories}</div><div class="stat-label">招聘类别</div></div>
    <div class="stat-card"><div class="stat-icon si2">💼</div><div class="stat-value">${s.positions}</div><div class="stat-label">招聘岗位</div></div>
    <div class="stat-card"><div class="stat-icon si3">✉️</div><div class="stat-value">${s.invites}</div><div class="stat-label">面试邀请</div></div>
    <div class="stat-card"><div class="stat-icon si4">👥</div><div class="stat-value">${s.candidates}</div><div class="stat-label">候选人</div></div>
  `;

  const ri = invRes.data?.slice(0, 5) || [];
  document.getElementById('recent-invites').innerHTML = ri.length ? `
    <thead><tr><th>候选人</th><th>岗位</th><th>状态</th><th>时间</th></tr></thead>
    <tbody>${ri.map(i => `<tr><td>${i.candidate_name||'-'}</td><td>${i.positions?.name||'-'}</td><td><span class="tag ${i.status==='completed'?'tag-green':'tag-orange'}">${i.status==='completed'?'已完成':'待面试'}</span></td><td>${new Date(i.invited_at).toLocaleString('zh-CN')}</td></tr>`).join('')}</tbody>
  ` : '<tbody><tr><td colspan="4" style="text-align:center;color:var(--t3);padding:40px">暂无数据</td></tr></tbody>';

  const rc = candRes.data?.slice(0, 5) || [];
  document.getElementById('recent-candidates').innerHTML = rc.length ? `
    <thead><tr><th>姓名</th><th>岗位</th><th>邮箱</th><th>时间</th></tr></thead>
    <tbody>${rc.map(c => `<tr><td>${c.name}</td><td>${c.positions?.name||'-'}</td><td>${c.email||'-'}</td><td>${new Date(c.created_at).toLocaleString('zh-CN')}</td></tr>`).join('')}</tbody>
  ` : '<tbody><tr><td colspan="4" style="text-align:center;color:var(--t3);padding:40px">暂无数据</td></tr></tbody>';
}

// ========== 类别管理 ==========
async function loadCategories() {
  const { data } = await API.getCategories();
  categories = data || [];
  const posRes = await API.getPositions();
  positions = posRes.data || [];

  document.getElementById('categories-table').querySelector('tbody').innerHTML = categories.map(c => `
    <tr>
      <td>${c.id}</td>
      <td><a href="#" onclick="goToPositions(${c.id})" style="color:var(--p)">${c.name}</a></td>
      <td><span class="tag ${c.type==='social'?'tag-blue':'tag-orange'}">${c.type==='social'?'社会招聘':'校园招聘'}</span></td>
      <td>${positions.filter(p=>p.category_id===c.id).length}</td>
      <td><button class="btn btn-o btn-xs" onclick="deleteCategory(${c.id})">删除</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:40px">暂无数据</td></tr>';
}

function showCategoryModal() {
  document.getElementById('category-id').value = '';
  document.getElementById('category-name').value = '';
  document.getElementById('category-type').value = 'social';
  document.getElementById('category-modal-title').textContent = '新增类别';
  openModal('category');
}

async function saveCategory() {
  const name = document.getElementById('category-name').value.trim();
  const type = document.getElementById('category-type').value;
  if (!name) { alert('请输入类别名称'); return; }
  const { error } = await API.createCategory(name, type);
  if (error) alert('创建失败: ' + error.message);
  else { closeModal('category'); loadCategories(); }
}

async function deleteCategory(id) {
  if (!confirm('确认删除？')) return;
  const { error } = await API.deleteCategory(id);
  if (error) alert('删除失败: ' + error.message);
  else loadCategories();
}

function goToPositions(categoryId) {
  currentCategoryId = categoryId;
  document.querySelector('[data-page="positions"]').click();
}

// ========== 岗位管理 ==========
async function loadPositions() {
  const [catRes, posRes] = await Promise.all([API.getCategories(), API.getPositions()]);
  categories = catRes.data || [];
  positions = posRes.data || [];

  document.getElementById('position-tabs').innerHTML = categories.map(c => `
    <div class="tab ${currentCategoryId==c.id||(!currentCategoryId&&c.id==categories[0]?.id)?'active':''}" onclick="switchPositionTab(${c.id},this)">${c.name}</div>
  `).join('');

  const activeTab = currentCategoryId || categories[0]?.id;
  renderPositions(activeTab);

  document.getElementById('position-category').innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function switchPositionTab(categoryId, el) {
  document.querySelectorAll('#position-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentCategoryId = categoryId;
  renderPositions(categoryId);
}

function renderPositions(categoryId) {
  const filtered = positions.filter(p => p.category_id == categoryId);
  document.getElementById('positions-table').querySelector('tbody').innerHTML = filtered.map(p => `
    <tr>
      <td>${p.sequence||'-'}</td><td>${p.name}</td>
      <td><a href="#" onclick="goToQuestions(${p.id})" style="color:var(--p)">管理题库</a></td>
      <td><a href="#" onclick="showDimensionModal(${p.id},'${p.name}')" style="color:var(--p)">配置评分</a></td>
      <td><button class="btn btn-o btn-xs" onclick="editPosition(${p.id})">编辑</button> <button class="btn btn-er btn-xs" onclick="deletePosition(${p.id})">删除</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:40px">暂无岗位</td></tr>';
}

function showPositionModal(id) {
  editingPosition = id ? positions.find(p => p.id === id) : null;
  document.getElementById('position-modal-title').textContent = id ? '编辑岗位' : '新增岗位';
  if (editingPosition) {
    document.getElementById('position-id').value = id;
    document.getElementById('position-category').value = editingPosition.category_id;
    document.getElementById('position-sequence').value = editingPosition.sequence || '';
    document.getElementById('position-name').value = editingPosition.name;
  } else {
    document.getElementById('position-id').value = '';
    document.getElementById('position-category').value = currentCategoryId || categories[0]?.id;
    document.getElementById('position-sequence').value = '';
    document.getElementById('position-name').value = '';
  }
  openModal('position');
}

function closePositionModal() { closeModal('position'); editingPosition = null; }

async function editPosition(id) { showPositionModal(id); }

async function savePosition() {
  const id = document.getElementById('position-id').value;
  const categoryId = parseInt(document.getElementById('position-category').value);
  const sequence = document.getElementById('position-sequence').value.trim();
  const name = document.getElementById('position-name').value.trim();
  if (!name) { alert('请输入岗位名称'); return; }
  if (id) {
    const { error } = await API.updatePosition(parseInt(id), sequence, name);
    if (error) alert('更新失败'); else { closeModal('position'); loadPositions(); }
  } else {
    const { error } = await API.createPosition(categoryId, sequence, name);
    if (error) alert('创建失败'); else { closeModal('position'); loadPositions(); }
  }
}

async function deletePosition(id) {
  if (!confirm('确认删除？')) return;
  const { error } = await API.deletePosition(id);
  if (error) alert('删除失败'); else loadPositions();
}

function goToQuestions(positionId) {
  currentPositionId = positionId;
  document.querySelector('[data-page="questions"]').click();
}

// ========== 题库管理 ==========
async function loadQuestions() {
  const [posRes, quesRes] = await Promise.all([API.getPositions(), API.getQuestions()]);
  positions = posRes.data || [];

  const sel = document.getElementById('question-position');
  sel.innerHTML = positions.map(p => `<option value="${p.id}">${p.recruitment_categories?.name||''} - ${p.sequence||''} ${p.name}</option>`).join('');
  if (currentPositionId) sel.value = currentPositionId;

  const positionId = parseInt(sel.value);
  const filtered = quesRes.data?.filter(q => q.position_id === positionId) || [];
  window._allQuestions = quesRes.data || [];

  document.getElementById('questions-table').querySelector('tbody').innerHTML = filtered.map(q => `
    <tr>
      <td>${q.id}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.question}</td>
      <td><span class="tag ${q.question_type==='voice'?'tag-cyan':q.question_type==='text'?'tag-blue':'tag-orange'}">${q.question_type==='voice'?'语音':q.question_type==='text'?'文本':'选择'}</span></td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.answer_template||'-'}</td>
      <td><button class="btn btn-o btn-xs" onclick="editQuestion(${q.id})">编辑</button> <button class="btn btn-er btn-xs" onclick="deleteQuestion(${q.id})">删除</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:40px">暂无题目</td></tr>';
}

function showQuestionModal(id) {
  const positionId = parseInt(document.getElementById('question-position').value);
  if (!positionId) { alert('请先选择岗位'); return; }
  document.getElementById('question-modal-title').textContent = id ? '编辑题目' : '新增题目';
  if (id) {
    const q = window._allQuestions?.find(x => x.id === id);
    if (q) {
      document.getElementById('question-id').value = id;
      document.getElementById('question-content').value = q.question;
      document.getElementById('question-type').value = q.question_type;
      document.getElementById('question-template').value = q.answer_template || '';
    }
  } else {
    document.getElementById('question-id').value = '';
    document.getElementById('question-content').value = '';
    document.getElementById('question-type').value = 'voice';
    document.getElementById('question-template').value = '';
  }
  openModal('question');
}

async function editQuestion(id) {
  const { data } = await API.getQuestions();
  window._allQuestions = data || [];
  showQuestionModal(id);
}

async function saveQuestion() {
  const id = document.getElementById('question-id').value;
  const positionId = parseInt(document.getElementById('question-position').value);
  const question = document.getElementById('question-content').value.trim();
  const questionType = document.getElementById('question-type').value;
  const answerTemplate = document.getElementById('question-template').value.trim();
  if (!question) { alert('请输入题目内容'); return; }
  if (id) {
    const { error } = await API.updateQuestion(parseInt(id), question, questionType, answerTemplate);
    if (error) alert('更新失败'); else { closeModal('question'); loadQuestions(); }
  } else {
    const { error } = await API.createQuestion(positionId, question, questionType, answerTemplate);
    if (error) alert('创建失败'); else { closeModal('question'); loadQuestions(); }
  }
}

async function deleteQuestion(id) {
  if (!confirm('确认删除？')) return;
  const { error } = await API.deleteQuestion(id);
  if (error) alert('删除失败'); else loadQuestions();
}

// ========== 批量导入题库 ==========
function showImportModal() {
  const sel = document.getElementById('import-position');
  sel.innerHTML = positions.map(p => `<option value="${p.id}">${p.recruitment_categories?.name||''} - ${p.name}</option>`).join('');
  if (currentPositionId) sel.value = currentPositionId;
  document.getElementById('import-text').value = '';
  openModal('import');
}

async function doImport() {
  const positionId = parseInt(document.getElementById('import-position').value);
  const text = document.getElementById('import-text').value.trim();
  if (!text) { alert('请输入题目内容'); return; }

  const lines = text.split('\n').filter(l => l.trim());
  const questions = [];
  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim());
    const question = parts[0];
    const type = parts[1] || 'voice';
    const template = parts[2] || '';
    if (question) {
      questions.push({ position_id: positionId, question, question_type: type, answer_template: template });
    }
  }

  if (questions.length === 0) { alert('未解析到有效题目'); return; }

  const { data, error } = await API.createQuestionsBatch(questions);
  if (error) {
    alert('批量导入失败: ' + error.message);
  } else {
    alert(`成功导入 ${questions.length} 道题目！`);
    closeModal('import');
    loadQuestions();
  }
}

// ========== 评分维度 ==========
async function showDimensionModal(positionId, positionName) {
  document.getElementById('dimension-position-name').textContent = positionName;
  document.getElementById('dimension-position-id').value = positionId;
  document.getElementById('dimension-id').value = '';
  document.getElementById('dimension-name').value = '';
  document.getElementById('dimension-weight').value = '';
  document.getElementById('dimension-desc').value = '';
  await loadDimensions(positionId);
  openModal('dimension');
}

async function loadDimensions(positionId) {
  const { data } = await API.getDimensions(positionId);
  const dims = data || [];
  const totalWeight = dims.reduce((s, d) => s + (d.weight || 0), 0);

  document.getElementById('dimensions-list').innerHTML = `
    <div style="margin-bottom:16px;color:var(--t2)">总权重: <strong style="color:${totalWeight===100?'var(--ok)':'var(--er)'}">${totalWeight}%</strong>${totalWeight!==100?' <span>(建议100%)</span>':''}</div>
    ${dims.map(d => `
      <div class="dim-item">
        <div class="dim-name">${d.dimension_name}</div>
        <div class="dim-bar"><div class="dim-bar-fill" style="width:${d.weight}%"></div></div>
        <span class="dim-weight">${d.weight}%</span>
        <button class="btn btn-o btn-xs" onclick="editDimension(${d.id},'${d.dimension_name}',${d.weight},'${d.description||''}')">编辑</button>
        <button class="btn btn-er btn-xs" onclick="deleteDimension(${d.id},${positionId})">删除</button>
      </div>
    `).join('') || '<div style="text-align:center;color:var(--t3);padding:20px">暂无评分维度</div>'}
  `;
}

function editDimension(id, name, weight, desc) {
  document.getElementById('dimension-id').value = id;
  document.getElementById('dimension-name').value = name;
  document.getElementById('dimension-weight').value = weight;
  document.getElementById('dimension-desc').value = desc;
}

async function saveDimension() {
  const id = document.getElementById('dimension-id').value;
  const positionId = parseInt(document.getElementById('dimension-position-id').value);
  const dimensionName = document.getElementById('dimension-name').value.trim();
  const weight = parseInt(document.getElementById('dimension-weight').value) || 0;
  const description = document.getElementById('dimension-desc').value.trim();
  if (!dimensionName) { alert('请输入维度名称'); return; }

  if (id) {
    const { error } = await API.updateDimension(parseInt(id), dimensionName, weight, description);
    if (error) alert('更新失败');
  } else {
    const { error } = await API.createDimension(positionId, dimensionName, weight, description);
    if (error) alert('创建失败');
  }

  document.getElementById('dimension-id').value = '';
  document.getElementById('dimension-name').value = '';
  document.getElementById('dimension-weight').value = '';
  document.getElementById('dimension-desc').value = '';
  await loadDimensions(positionId);
}

async function deleteDimension(id, positionId) {
  if (!confirm('确认删除？')) return;
  const { error } = await API.deleteDimension(id);
  if (error) alert('删除失败'); else await loadDimensions(positionId);
}

// ========== 面试邀请 ==========
async function loadInvites() {
  const [posRes, invRes] = await Promise.all([API.getPositions(), API.getInvites()]);
  positions = posRes.data || [];
  const invites = invRes.data || [];

  document.getElementById('invite-position').innerHTML = positions.map(p =>
    `<option value="${p.id}">${p.recruitment_categories?.name||''} - ${p.sequence||''} ${p.name}</option>`
  ).join('');

  const BASE = window.location.origin + window.location.pathname.replace('index.html','');
  document.getElementById('invites-table').querySelector('tbody').innerHTML = invites.map(i => `
    <tr>
      <td>${i.id}</td><td>${i.candidate_name||'-'}</td>
      <td>${i.positions?.sequence||''} ${i.positions?.name||'-'}</td>
      <td><div class="copy-group"><input type="text" class="copy-input" value="${BASE}interview.html?link=${i.interview_link}" readonly><button class="copy-btn" onclick="copyLink(this,'${BASE}interview.html?link=${i.interview_link}')">复制</button></div></td>
      <td><span class="tag ${i.status==='completed'?'tag-green':i.status==='in_progress'?'tag-blue':'tag-orange'}">${i.status==='completed'?'已完成':i.status==='in_progress'?'进行中':'待面试'}</span></td>
      <td>${new Date(i.invited_at).toLocaleString('zh-CN')}</td>
      <td><button class="btn btn-er btn-xs" onclick="deleteInvite(${i.id})">删除</button></td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:40px">暂无邀请</td></tr>';
}

function showInviteModal() {
  document.getElementById('invite-name').value = '';
  document.getElementById('invite-email').value = '';
  openModal('invite');
}

async function createInvite() {
  const positionId = parseInt(document.getElementById('invite-position').value);
  const candidateName = document.getElementById('invite-name').value.trim();
  const candidateEmail = document.getElementById('invite-email').value.trim();
  const { data, error } = await API.createInvite(positionId, candidateName, candidateEmail);
  if (error) { alert('创建失败: ' + error.message); return; }
  const BASE = window.location.origin + window.location.pathname.replace('index.html','');
  copyToClipboard(BASE + 'interview.html?link=' + data[0].interview_link);
  alert('创建成功！链接已复制到剪贴板');
  closeModal('invite');
  loadInvites();
}

async function deleteInvite(id) {
  if (!confirm('确认删除？')) return;
  const { error } = await API.deleteInvite(id);
  if (error) alert('删除失败'); else loadInvites();
}

// ========== 候选人管理 ==========
async function loadCandidates() {
  const { data } = await API.getCandidates();
  const candidates = data || [];

  document.getElementById('candidates-table').querySelector('tbody').innerHTML = candidates.map(c => `
    <tr>
      <td>${c.id}</td><td>${c.name}</td><td>${c.email||'-'}</td>
      <td>${c.phone||'-'}</td><td>${c.positions?.name||'-'}</td>
      <td>${new Date(c.created_at).toLocaleString('zh-CN')}</td>
      <td><button class="btn btn-p btn-xs" onclick="viewCandidate(${c.id})">查看详情</button></td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:40px">暂无候选人</td></tr>';
}

async function viewCandidate(id) {
  const { data, error } = await API.getCandidate(id);
  if (error) { alert('获取详情失败'); return; }

  document.getElementById('candidate-name').textContent = data.name;

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">邮箱</div><div style="font-weight:600">${data.email||'-'}</div></div>
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">电话</div><div style="font-weight:600">${data.phone||'-'}</div></div>
      <div class="answer-card" style="grid-column:span 2"><div style="font-size:12px;color:var(--t3)">应聘岗位</div><div style="font-weight:600">${data.positions?.name||'-'}</div></div>
    </div>
    <h4 style="margin-bottom:12px">📝 面试回答 (${data.answers?.length||0})</h4>
  `;

  if (data.answers?.length > 0) {
    data.answers.forEach((a, i) => {
      html += `
        <div class="answer-card">
          <div class="answer-q">Q${i+1}: ${a.question_banks?.question||'题目'}</div>
          <div class="answer-a">${a.answer_text}</div>
          ${a.question_banks?.answer_template?`<div style="font-size:12px;color:var(--t3);margin-top:8px">参考: ${a.question_banks.answer_template}</div>`:''}
          <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
            <span style="font-size:13px">评分:</span>
            <select class="rate-select" onchange="rateAnswer(${a.id},this.value)">
              <option value="">未评分</option>
              ${[1,2,3,4,5].map(n=>`<option value="${n}" ${a.rating_score==n?'selected':''}>${n}分</option>`).join('')}
            </select>
            ${a.rating_score?`<span class="tag tag-green">${a.rating_score}分</span>`:''}
          </div>
        </div>
      `;
    });
  } else {
    html += '<p style="color:var(--t3);text-align:center;padding:20px">暂无回答记录</p>';
  }

  // 面试记录
  if (data.records?.length > 0) {
    html += `<h4 style="margin:20px 0 12px">🎬 面试记录 (${data.records.length})</h4>`;
    data.records.forEach(r => {
      const m = Math.floor((r.duration_seconds||0)/60);
      const s = (r.duration_seconds||0)%60;
      html += `
        <div class="answer-card">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span class="tag tag-green">${r.status==='completed'?'已完成':'进行中'}</span>
            <span style="color:var(--t3);font-size:13px">时长: ${m}分${s}秒 · ${r.question_count||0}题</span>
          </div>
          <div style="font-size:13px;color:var(--t3);margin-bottom:8px">${new Date(r.created_at).toLocaleString('zh-CN')}</div>
          ${r.transcript?`<div style="background:#f1f5f9;border-radius:6px;padding:10px;font-size:13px;max-height:150px;overflow-y:auto;white-space:pre-wrap">${r.transcript}</div>`:''}
        </div>
      `;
    });
  }

  document.getElementById('candidate-detail').innerHTML = html;
  openModal('candidate');
}

async function rateAnswer(answerId, score) {
  if (!score) return;
  const { error } = await API.rateAnswer(answerId, parseInt(score), '');
  if (error) alert('评分失败');
}

// ========== 面试记录 ==========
async function loadRecords() {
  const { data, error } = await API.getInterviewRecords();
  const records = data || [];

  document.getElementById('records-table').querySelector('tbody').innerHTML = records.map(r => {
    const m = Math.floor((r.duration_seconds||0)/60);
    const s = (r.duration_seconds||0)%60;
    return `
      <tr>
        <td>${r.id}</td>
        <td>${r.candidates?.name||'-'}</td>
        <td>${r.positions?.name||'-'}</td>
        <td>${m}分${s}秒</td>
        <td>${r.question_count||0}</td>
        <td><span class="tag ${r.status==='completed'?'tag-green':'tag-orange'}">${r.status==='completed'?'已完成':'进行中'}</span></td>
        <td>${new Date(r.created_at).toLocaleString('zh-CN')}</td>
        <td><button class="btn btn-o btn-xs" onclick="viewRecord(${r.id})">查看</button></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--t3);padding:40px">暂无面试记录</td></tr>';
}

async function viewRecord(id) {
  const { data } = await API.getInterviewRecords();
  const record = data?.find(r => r.id === id);
  if (!record) { alert('记录不存在'); return; }
  currentRecordData = record;

  const m = Math.floor((record.duration_seconds||0)/60);
  const s = (record.duration_seconds||0)%60;

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">候选人</div><div style="font-weight:600">${record.candidates?.name||'-'}</div></div>
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">岗位</div><div style="font-weight:600">${record.positions?.name||'-'}</div></div>
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">时长</div><div style="font-weight:600">${m}分${s}秒</div></div>
      <div class="answer-card"><div style="font-size:12px;color:var(--t3)">题数</div><div style="font-weight:600">${record.question_count||0}</div></div>
    </div>
  `;

  if (record.transcript) {
    const lines = record.transcript.split('\n');
    html += '<h4 style="margin-bottom:12px">📝 面试记录</h4><div class="transcript-box">';
    lines.forEach(line => {
      if (line.includes('面试官:')) {
        html += `<div><span class="role-i">面试官:</span> ${line.split('面试官:')[1]||''}</div>`;
      } else if (line.includes('候选人:')) {
        html += `<div><span class="role-c">候选人:</span> ${line.split('候选人:')[1]||''}</div>`;
      } else {
        html += `<div style="color:var(--t3)">${line}</div>`;
      }
    });
    html += '</div>';
  }

  document.getElementById('record-detail').innerHTML = html;
  openModal('record');
}

function exportSingleRecord() {
  if (!currentRecordData) return;
  const r = currentRecordData;
  const m = Math.floor((r.duration_seconds||0)/60);
  const s = (r.duration_seconds||0)%60;
  let content = `面试记录导出\n================\n候选人: ${r.candidates?.name||'-'}\n岗位: ${r.positions?.name||'-'}\n时长: ${m}分${s}秒\n日期: ${new Date(r.created_at).toLocaleDateString('zh-CN')}\n\n================\n\n`;
  if (r.transcript) content += r.transcript;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `面试记录_${r.candidates?.name||''}_${new Date().toLocaleDateString('zh-CN')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllRecords() {
  const table = document.getElementById('records-table');
  const rows = table.querySelectorAll('tbody tr');
  if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('[colspan]'))) {
    alert('暂无记录可导出');
    return;
  }
  let csv = 'ID,候选人,岗位,时长,题数,状态,时间\n';
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7) {
      csv += Array.from(cells).slice(0, 7).map(c => `"${c.textContent.trim()}"`).join(',') + '\n';
    }
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `面试记录汇总_${new Date().toLocaleDateString('zh-CN')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
