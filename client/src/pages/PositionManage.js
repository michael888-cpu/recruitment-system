import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tabs, Divider, Rate } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const PositionManage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId ? parseInt(categoryId) : null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDimensionModalOpen, setIsDimensionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [editingDimension, setEditingDimension] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [form] = Form.useForm();
  const [dimensionForm] = Form.useForm();

  useEffect(() => {
    fetchCategories();
    fetchPositions();
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(data);
      if (!selectedCategory && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
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

  const fetchDimensions = async (positionId) => {
    try {
      const res = await fetch(`${API_BASE}/dimensions?positionId=${positionId}`);
      const data = await res.json();
      setDimensions(data);
    } catch (error) {
      console.error('获取评分维度失败:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate(`/positions/${categoryId}`);
  };

  const handleAdd = () => {
    setEditingPosition(null);
    form.resetFields();
    form.setFieldsValue({ categoryId: selectedCategory });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingPosition(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/positions/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchPositions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPosition) {
        await fetch(`${API_BASE}/positions/${editingPosition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('更新成功');
      } else {
        await fetch(`${API_BASE}/positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchPositions();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDimensionClick = (position) => {
    setEditingPosition(position);
    fetchDimensions(position.id);
    setIsDimensionModalOpen(true);
  };

  const handleAddDimension = () => {
    setEditingDimension(null);
    dimensionForm.resetFields();
    dimensionForm.setFieldsValue({ positionId: editingPosition.id });
  };

  const handleEditDimension = (record) => {
    setEditingDimension(record);
    dimensionForm.setFieldsValue(record);
  };

  const handleDeleteDimension = async (id) => {
    try {
      await fetch(`${API_BASE}/dimensions/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchDimensions(editingPosition.id);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDimensionSubmit = async () => {
    try {
      const values = await dimensionForm.validateFields();
      if (editingDimension) {
        await fetch(`${API_BASE}/dimensions/${editingDimension.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('更新成功');
      } else {
        await fetch(`${API_BASE}/dimensions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        message.success('创建成功');
      }
      dimensionForm.resetFields();
      fetchDimensions(editingPosition.id);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getCategoryType = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.type || '';
  };

  const totalWeight = dimensions.reduce((sum, d) => sum + (d.weight || 0), 0);

  const dimensionColumns = [
    { title: '维度名称', dataIndex: 'dimension_name', key: 'dimension_name' },
    { 
      title: '权重(%)', 
      dataIndex: 'weight', 
      key: 'weight',
      render: (weight) => `${weight}%`
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditDimension(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteDimension(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = categories.map(cat => ({
    key: cat.id.toString(),
    label: cat.name,
    children: (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setSelectedCategory(cat.id);
              handleAdd();
            }}>
              新增岗位
            </Button>
          </Space>
        </div>
        <Table
          columns={[
            { title: '序列', dataIndex: 'sequence', key: 'sequence', width: 120 },
            { title: '岗位名称', dataIndex: 'name', key: 'name' },
            { 
              title: '题库', 
              key: 'questions',
              render: (_, record) => (
                <Button 
                  type="link" 
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(`/questions/${record.id}`)}
                >
                  管理题库
                </Button>
              )
            },
            { 
              title: '评分维度', 
              key: 'dimensions',
              render: (_, record) => (
                <Button type="link" onClick={() => handleDimensionClick(record)}>
                  配置评分
                </Button>
              )
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
          ]}
          dataSource={positions.filter(p => p.category_id === cat.id)}
          rowKey="id"
        />
      </div>
    )
  }));

  return (
    <div>
      <Card title="岗位管理">
        <Tabs 
          activeKey={selectedCategory?.toString()} 
          onChange={handleCategoryChange}
          items={tabItems}
        />
      </Card>

      {/* 岗位表单弹窗 */}
      <Modal
        title={editingPosition ? '编辑岗位' : '新增岗位'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="categoryId"
            label="所属类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select>
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sequence" label="序列">
            <Input placeholder="如：A、B、C 或 1、2、3" />
          </Form.Item>
          <Form.Item
            name="name"
            label="岗位名称"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 评分维度弹窗 */}
      <Modal
        title={`${editingPosition?.name} - 评分维度配置`}
        open={isDimensionModalOpen}
        onCancel={() => setIsDimensionModalOpen(false)}
        width={700}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddDimension}>新增评分维度</Button>
          {dimensions.length > 0 && (
            <span style={{ marginLeft: 16 }}>
              总权重: <span style={{ color: totalWeight === 100 ? 'green' : 'red', fontWeight: 'bold' }}>{totalWeight}%</span>
              {totalWeight !== 100 && <span style={{ color: '#999', marginLeft: 8 }}>(建议总权重为100%)</span>}
            </span>
          )}
        </div>
        
        <Table 
          columns={dimensionColumns} 
          dataSource={dimensions} 
          rowKey="id"
          pagination={false}
        />

        {(editingDimension || dimensionForm.getFieldValue('dimension_name') !== undefined) && (
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <Form 
              form={dimensionForm} 
              layout="vertical"
              onFinish={handleDimensionSubmit}
            >
              <Space>
                <Form.Item name="dimension_name" label="维度名称" rules={[{ required: true }]}>
                  <Input placeholder="如：技术能力、沟通表达" style={{ width: 150 }} />
                </Form.Item>
                <Form.Item name="weight" label="权重%" rules={[{ required: true }]}>
                  <Input type="number" placeholder="0-100" style={{ width: 80 }} />
                </Form.Item>
                <Form.Item name="description" label="说明">
                  <Input placeholder="评分标准说明" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item name="positionId" hidden>
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" style={{ marginTop: 5 }}>
                  {editingDimension ? '更新' : '添加'}
                </Button>
                <Button onClick={() => {
                  dimensionForm.resetFields();
                  setEditingDimension(null);
                }} style={{ marginTop: 5 }}>
                  取消
                </Button>
              </Space>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PositionManage;
