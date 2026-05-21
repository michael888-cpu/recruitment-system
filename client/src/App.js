import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import MainMenu from './components/MainMenu';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManage from './pages/CategoryManage';
import PositionManage from './pages/PositionManage';
import QuestionManage from './pages/QuestionManage';
import InviteManage from './pages/InviteManage';
import CandidateManage from './pages/CandidateManage';
import CandidateInterview from './pages/CandidateInterview';
import InterviewLink from './pages/InterviewLink';

const { Header, Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout className="app-container">
        <Routes>
          {/* 候选人端 - 通过链接访问 */}
          <Route path="/interview/:link" element={<CandidateInterview />} />
          
          {/* 管理端 */}
          <Route path="/*" element={
            <Layout className="main-layout">
              <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
                <div className="menu-logo">招聘面试管理系统</div>
                <MainMenu />
              </Header>
              <Content style={{ padding: '24px' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/categories" element={<CategoryManage />} />
                  <Route path="/positions" element={<PositionManage />} />
                  <Route path="/positions/:categoryId" element={<PositionManage />} />
                  <Route path="/questions/:positionId" element={<QuestionManage />} />
                  <Route path="/invites" element={<InviteManage />} />
                  <Route path="/candidates" element={<CandidateManage />} />
                  <Route path="/candidates/:id" element={<CandidateManage />} />
                  <Route path="/interview-link" element={<InterviewLink />} />
                </Routes>
              </Content>
            </Layout>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
