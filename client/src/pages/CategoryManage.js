import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const CategoryManage = () => {
  const [categories, setCategories] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPositions();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('获取类别失败:', error);
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
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchCategories();
      fetchPositions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await fetch(`${API_BASE}/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('更新成功');
      } else {
        await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: '类别名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/positions/${record.id}`)}>{text}</a>
      )
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type) => type === 'social' ? '社会招聘' : '校园招聘'
    },
    { 
      title: '岗位数', 
      key: 'positionCount',
      render: (_, record) => positions.filter(p => p.category_id === record.id).length
    },
    {
      title: '操作',
      key: 'action',
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
      title="招聘类别管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增类别
        </Button>
      }
    >
      <Table columns={columns} dataSource={categories} rowKey="id" />

      <Modal
        title={editingCategory ? '编辑类别' : '新增类别'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="类别名称"
            rules={[{ required: true, message: '请输入类别名称' }]}
          >
            <Input placeholder="如：社会招聘、校园招聘" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="social">社会招聘</Select.Option>
              <Select.Option value="campus">校园招聘</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CategoryManage;
