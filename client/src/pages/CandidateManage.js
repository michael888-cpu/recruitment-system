import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Rate, InputNumber, message, Space, Tag, Descriptions, Progress } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';

const API_BASE = 'http://localhost:3001/api';

const CandidateManage = () => {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCandidates();
    fetchPositions();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_BASE}/candidates`);
      const data = await res.json();
      setCandidates(data);
    } catch (error) {
      console.error('获取候选人失败:', error);
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

  const handleViewDetail = async (record) => {
    try {
      setSelectedCandidate(record);
      const res = await fetch(`${API_BASE}/candidates/${record.id}`);
      const data = await res.json();
      setAnswers(data.answers || []);
      setDimensions(data.dimensions || []);
      setIsDetailModalOpen(true);
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const handleRateAnswer = async (answerId, score, comment) => {
    try {
      await fetch(`${API_BASE}/answers/${answerId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingScore: score, ratingComment: comment, ratedBy: 'admin' })
      });
      message.success('评分成功');
      // 刷新回答列表
      const res = await fetch(`${API_BASE}/candidates/${selectedCandidate.id}`);
      const data = await res.json();
      setAnswers(data.answers || []);
    } catch (error) {
      message.error('评分失败');
    }
  };

  const getAverageScore = () => {
    const ratedAnswers = answers.filter(a => a.rating_score != null);
    if (ratedAnswers.length === 0) return 0;
    return ratedAnswers.reduce((sum, a) => sum + a.rating_score, 0) / ratedAnswers.length;
  };

  const getDimensionScore = (dimensionName) => {
    // 这里简单处理，实际可以关联题目和维度
    const relevantAnswers = answers.filter(a => a.rating_score != null);
    if (relevantAnswers.length === 0) return null;
    return relevantAnswers.reduce((sum, a) => sum + a.rating_score, 0) / relevantAnswers.length;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { 
      title: '应聘岗位', 
      dataIndex: 'position_name', 
      key: 'position_name',
      render: (name) => name || '-'
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      )
    }
  ];

  return (
    <Card title="候选人管理">
      <Table 
        columns={columns} 
        dataSource={candidates} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`候选人详情 - ${selectedCandidate?.name}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={900}
        footer={null}
      >
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="姓名">{selectedCandidate?.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{selectedCandidate?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="电话">{selectedCandidate?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="应聘岗位">{selectedCandidate?.position_name}</Descriptions.Item>
        </Descriptions>

        {dimensions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h4>评分维度</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              {dimensions.map(d => {
                const score = getDimensionScore(d.dimension_name);
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 120 }}>{d.dimension_name}</span>
                    <Progress 
                      percent={score ? (score / 5) * 100 : 0} 
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <span style={{ width: 50 }}>{score ? score.toFixed(1) : '-'}</span>
                    <span style={{ color: '#999' }}>({d.weight}%)</span>
                  </div>
                );
              })}
            </Space>
            <div style={{ marginTop: 16, fontSize: 16 }}>
              <strong>综合评分: </strong>
              <Rate disabled value={getAverageScore()} allowHalf />
              <span style={{ marginLeft: 8 }}>{getAverageScore().toFixed(1)} / 5</span>
            </div>
          </div>
        )}

        <h4>面试回答</h4>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {answers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无回答记录</div>
          ) : (
            answers.map((answer, index) => (
              <div key={answer.id} style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag icon={<FileTextOutlined />} color="blue">题目 {index + 1}</Tag>
                </div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>{answer.question}</div>
                <div style={{ background: '#fff', padding: 12, borderRadius: 4, marginBottom: 8 }}>
                  <strong>回答:</strong>
                  <p style={{ margin: '8px 0 0 0' }}>{answer.answer_text}</p>
                </div>
                {answer.answer_template && (
                  <div style={{ background: '#e6f7ff', padding: 8, borderRadius: 4, fontSize: 12, color: '#666' }}>
                    <strong>参考要点:</strong> {answer.answer_template}
                  </div>
                )}
                
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>评分:</span>
                  <Rate 
                    value={answer.rating_score || 0} 
                    onChange={(value) => handleRateAnswer(answer.id, value, answer.rating_comment)}
                  />
                  {answer.rating_score && (
                    <Tag color="green">{answer.rating_score}分</Tag>
                  )}
                </div>
                {answer.rating_comment && (
                  <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                    评语: {answer.rating_comment}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default CandidateManage;
