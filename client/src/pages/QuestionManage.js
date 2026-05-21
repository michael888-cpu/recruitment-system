import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const QuestionManage = () => {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [position, setPosition] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (positionId) {
      fetchPosition();
      fetchQuestions();
    }
  }, [positionId]);

  const fetchPosition = async () => {
    try {
      const res = await fetch(`${API_BASE}/positions/${positionId}`);
      const data = await res.json();
      setPosition(data);
    } catch (error) {
      console.error('获取岗位失败:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/questions?positionId=${positionId}`);
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error('获取题目失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    form.setFieldsValue({ positionId: parseInt(positionId) });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingQuestion(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchQuestions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingQuestion) {
        await fetch(`${API_BASE}/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('更新成功');
      } else {
        await fetch(`${API_BASE}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { 
      title: '题目内容', 
      dataIndex: 'question', 
      key: 'question',
      ellipsis: true
    },
    { 
      title: '题目类型', 
      dataIndex: 'question_type', 
      key: 'question_type',
      width: 100,
      render: (type) => {
        const colors = { text: 'blue', choice: 'green', file: 'orange' };
        const labels = { text: '文本', choice: '选择', file: '文件' };
        return <Tag color={colors[type] || 'default'}>{labels[type] || type}</Tag>;
      }
    },
    { 
      title: '答案模板', 
      dataIndex: 'answer_template', 
      key: 'answer_template',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={`${position?.name || '岗位'} - 题库管理`}
      extra={
        <Space>
          <Button onClick={() => navigate('/categories')}>返回类别</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增题目
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>
          类别: {position?.category_name} | 岗位: {position?.name}
        </span>
      </div>

      <Table 
        columns={columns} 
        dataSource={questions} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingQuestion ? '编辑题目' : '新增题目'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="question"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入面试题目内容" 
            />
          </Form.Item>
          <Form.Item
            name="question_type"
            label="题目类型"
            initialValue="text"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select>
              <Select.Option value="text">文本回答</Select.Option>
              <Select.Option value="choice">选择题</Select.Option>
              <Select.Option value="file">文件上传</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="answer_template"
            label="答案模板/评分要点"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="填写此题的参考回答或评分要点，AI将根据此判断候选人回答质量" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default QuestionManage;
