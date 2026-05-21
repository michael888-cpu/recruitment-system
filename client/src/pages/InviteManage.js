import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';

const API_BASE = 'http://localhost:3001/api';
const BASE_URL = window.location.origin;

const InviteManage = () => {
  const [invites, setInvites] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchInvites();
    fetchPositions();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await fetch(`${API_BASE}/invites`);
      const data = await res.json();
      setInvites(data);
    } catch (error) {
      console.error('获取邀请记录失败:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch(`${API_BASE}/positions`);
      const data = await res.json();
      setPositions(data);
    } catch (error) {
      console.error('获取岗位失败:', error);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/invites/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchInvites();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await fetch(`${API_BASE}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      message.success('创建成功');
      setIsModalOpen(false);
      fetchInvites();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(text);
      message.success('复制成功！');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // 兼容旧浏览器
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(text);
      message.success('复制成功！');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const getInterviewUrl = (link) => {
    return `${BASE_URL}/interview/${link}`;
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'orange', completed: 'green', cancelled: 'red' };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = { pending: '待面试', completed: '已完成', cancelled: '已取消' };
    return texts[status] || status;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { 
      title: '候选人', 
      dataIndex: 'candidate_name', 
      key: 'candidate_name',
      render: (name) => name || '-'
    },
    { 
      title: '岗位', 
      dataIndex: 'position_name', 
      key: 'position_name',
      render: (name, record) => `${record.position_sequence || ''} ${name}`.trim()
    },
    { 
      title: '面试链接', 
      key: 'interview_link',
      width: 300,
      render: (_, record) => (
        <Space>
          <Input
            value={getInterviewUrl(record.interview_link)}
            readOnly
            style={{ width: 250, fontSize: 12 }}
            size="small"
          />
          <Tooltip title={copySuccess === getInterviewUrl(record.interview_link) ? '已复制' : '复制链接'}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(getInterviewUrl(record.interview_link))}
              style={{ color: copySuccess === getInterviewUrl(record.interview_link) ? '#52c41a' : '#1890ff' }}
            />
          </Tooltip>
        </Space>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { 
      title: '邀请时间', 
      dataIndex: 'invited_at', 
      key: 'invited_at',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    { 
      title: '过期时间', 
      dataIndex: 'expires_at', 
      key: 'expires_at',
      render: (date) => {
        if (!date) return '-';
        const isExpired = new Date(date) < new Date();
        return (
          <span style={{ color: isExpired ? 'red' : '#666' }}>
            {new Date(date).toLocaleString('zh-CN')}
            {isExpired && ' (已过期)'}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => copyToClipboard(getInterviewUrl(record.interview_link))}>
            复制
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="面试邀请管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建面试邀请
        </Button>
      }
    >
      <Table 
        columns={columns} 
        dataSource={invites} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="创建面试邀请"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="positionId"
            label="选择岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位">
              {positions.map(pos => (
                <Select.Option key={pos.id} value={pos.id}>
                  {pos.category_name} - {pos.sequence} {pos.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="candidateName"
            label="候选人姓名（可选）"
          >
            <Input placeholder="请输入候选人姓名" />
          </Form.Item>
          <Form.Item
            name="candidateEmail"
            label="候选人邮箱（可选）"
          >
            <Input placeholder="请输入候选人邮箱" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default InviteManage;
