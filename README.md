# 招聘面试管理系统

基于 Supabase 的全栈招聘面试系统，支持 AI 视频面试、语音识别、摄像头录制和在线评分。

## 功能概览

### 1. HR 管理端（index.html）
- **首页仪表盘**：数据统计、最近邀请和候选人一览
- **招聘类别管理**：社会招聘 / 校园招聘大类划分
- **岗位管理**：在大类下创建岗位（含序列号），配置评分维度
- **题库管理**：按岗位划分题库，支持文本/语音/选择题类型
- **批量导入题库**：通过文本批量导入多道题目（格式：题目 | 类型 | 答案模板）
- **面试邀请**：创建面试链接，复制分享给候选人
- **候选人管理**：查看候选人信息和答题记录
- **面试记录**：查看视频面试记录（时长、题数、转录文本），支持导出

### 2. 候选人端（interview.html）
- **登录验证**：通过面试链接访问，填写姓名/邮箱
- **AI 视频面试**：
  - AI 面试官语音提问（TTS）
  - 语音识别回答（Web Speech API）
  - 键盘输入备选
  - 摄像头实时预览与录制（MediaRecorder）
  - 面试实时计时
  - 问答进度跟踪
- **面试记录**：实时转录面板，显示问答过程
- **导出功能**：面试完成后可导出文字记录和录制视频

### 3. 评分系统
- **岗位级别评分维度**：不同岗位配置不同评分标准与权重
- **题目级别评分**：每道题独立评分和评语
- **面试回答记录**：存储候选人回答，供后续分析

## 技术栈

- **前端**：原生 HTML/CSS/JavaScript（无框架依赖）
- **数据库**：Supabase（PostgreSQL + REST API + RLS）
- **视频录制**：MediaRecorder API
- **语音识别**：Web Speech API（SpeechRecognition）
- **语音合成**：SpeechSynthesis API
- **样式**：CSS3 自定义属性 + 暗色科技风主题

## 项目结构

```
├── index.html              # HR 管理端
├── interview.html          # 候选人端（视频面试）
├── css/
│   └── admin.css           # HR 管理端样式
├── js/
│   ├── supabase-config.js  # Supabase 配置与 API 封装
│   └── admin.js            # HR 管理端逻辑
├── dist/                   # 部署目录（同步自根目录文件）
├── supabase-schema.sql     # 数据库建表 SQL
├── package.json
└── README.md
```

## 快速开始

### 1. 创建 Supabase 数据库
1. 注册 [Supabase](https://supabase.com) 并创建项目
2. 进入 SQL Editor，粘贴 `supabase-schema.sql` 内容并执行

### 2. 配置连接
编辑 `js/supabase-config.js`，填入你的 Supabase 项目信息：
```javascript
const SUPABASE_URL = '你的Project URL';
const SUPABASE_ANON_KEY = '你的anon key';
```

### 3. 本地运行
直接用浏览器打开 `index.html` 即可使用 HR 管理端。
候选人端通过 `interview.html?link=面试链接` 访问。

> 建议使用本地服务器（如 VS Code Live Server）以避免跨域问题。

### 4. 部署
支持部署到 EdgeOne Pages、Netlify、Vercel 等静态托管平台。详见 [部署说明.md](./部署说明.md)。

## 数据库结构

| 表名 | 说明 |
|------|------|
| recruitment_categories | 招聘大类（社会/校园） |
| positions | 岗位 |
| question_banks | 题库 |
| rating_dimensions | 评分维度 |
| interview_invites | 面试邀请 |
| candidates | 候选人 |
| interview_answers | 面试回答 |
| interview_records | 面试记录（视频面试） |

## 浏览器兼容性

- **推荐**：Chrome 80+（完整支持语音识别和摄像头录制）
- **部分支持**：Edge、Safari（语音识别可能不可用，可使用键盘输入）
- **不支持**：IE
