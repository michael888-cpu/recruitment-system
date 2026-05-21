import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress } from 'antd';
import { UserOutlined, FileTextOutlined, LinkOutlined, TeamOutlined } from '@ant-design/icons';

const API_BASE = 'http://localhost:3001/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    positions: 0,
    invites: 0,
    candidates: 0
  });
  const [recentInvites, setRecentInvites] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, posRes, invRes, candRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/positions`),
        fetch(`${API_BASE}/invites`),
        fetch(`${API_BASE}/candidates`)
      ]);
      
      const [categories, positions, invites, candidates] = await Promise.all([
        catRes.json(),
        posRes.json(),
        invRes.json(),
        candRes.json()
      ]);
      
      setStats({
        categories: Array.isArray(categories) ? categories.length : 0,
        positions: Array.isArray(positions) ? positions.length : 0,
        invites: Array.isArray(invites) ? invites.length : 0,
        candidates: Array.isArray(candidates) ? candidates.length : 0
      });
      
      setRecentInvites(Array.isArray(invites) ? invites.slice(0, 5) : []);
      setRecentCandidates(Array.isArray(candidates) ? candidates.slice(0, 5) : []);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const inviteColumns = [
    { title: '候选人', dataIndex: 'candidate_name', key: 'candidate_name' },
    { title: '岗位', dataIndex: 'position_name', key: 'position_name' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (status) => (
        <span style={{ color: status === 'completed' ? 'green' : 'orange' }}>
          {status === 'completed' ? '已完成' : '待面试'}
        </span>
      )
    },
    { title: '邀请时间', dataIndex: 'invited_at', key: 'invited_at',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ];

  const candidateColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '岗位', dataIndex: 'position_name', key: 'position_name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>数据概览</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="招聘类别"
              value={stats.categories}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="招聘岗位"
              value={stats.positions}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="面试邀请"
              value={stats.invites}
              prefix={<LinkOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="候选人"
              value={stats.candidates}
              prefix={<TeamOutlined style={{ color: '#f5222d' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="最近面试邀请" extra={<a href="/invites">查看全部</a>}>
            <Table
              columns={inviteColumns}
              dataSource={recentInvites}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近候选人" extra={<a href="/candidates">查看全部</a>}>
            <Table
              columns={candidateColumns}
              dataSource={recentCandidates}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
