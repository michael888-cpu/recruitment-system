import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Steps, Result, message, Spin, Rate } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';

const API_BASE = 'http://localhost:3001/api';

const CandidateInterview = () => {
  const { link } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0); // 0: 信息填写, 1: 答题, 2: 完成
  const [candidateId, setCandidateId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInterview();
  }, [link]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/interview/${link}`);
      
      if (res.status === 404) {
        setError('面试邀请不存在');
        return;
      }
      
      if (res.status === 410) {
        setError('面试邀请已过期');
        return;
      }
      
      if (!res.ok) {
        setError('获取面试信息失败');
        return;
      }
      
      const data = await res.json();
      setInterview(data);
      // 初始化答案对象
      const initialAnswers = {};
      data.questions?.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/interview/${link}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (!res.ok) {
        throw new Error('注册失败');
      }
      
      const data = await res.json();
      setCandidateId(data.candidateId);
      setStep(1);
      message.success('信息提交成功，开始面试');
    } catch (err) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitAnswers = async () => {
    try {
      setSubmitting(true);
      
      // 检查是否所有题目都已回答
      const unanswered = Object.entries(answers).filter(([_, value]) => !value.trim());
      if (unanswered.length > 0) {
        message.warning(`还有 ${unanswered.length} 道题目未回答`);
        return;
      }

      // 提交所有答案
      for (const [questionId, answerText] of Object.entries(answers)) {
        await fetch(`${API_BASE}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId,
            questionId: parseInt(questionId),
            answerText
          })
        });
      }

      setStep(2);
      message.success('面试完成，感谢参与！');
    } catch (err) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Result
            status="error"
            title="无法开始面试"
            subTitle={error}
          />
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Result
            status="success"
            title="面试已完成"
            subTitle={`感谢您参加 ${interview.position_name} 的面试，我们会尽快与您联系。`}
            extra={
              <Button type="primary" onClick={() => window.close()}>
                关闭页面
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const totalQuestions = interview?.questions?.length || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px 0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <Card style={{ marginBottom: 24 }}>
          <h1 style={{ textAlign: 'center', marginBottom: 8 }}>{interview.position_name}</h1>
          <p style={{ textAlign: 'center', color: '#666' }}>面试邀请</p>
        </Card>

        <Card>
          <Steps current={step} items={[
            { title: '填写信息' },
            { title: '回答问题' },
            { title: '完成' }
          ]} style={{ marginBottom: 32 }} />

          {step === 0 && (
            <div>
              <h3 style={{ marginBottom: 24 }}>请填写您的基本信息</h3>
              <Form form={form} layout="vertical" onFinish={handleRegister}>
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入您的姓名' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" size="large" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入您的邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="请输入您的邮箱" size="large" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="电话"
                >
                  <Input prefix={<PhoneOutlined />} placeholder="请输入您的联系电话（可选）" size="large" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
                    开始面试
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3>面试问题</h3>
                <span style={{ color: '#666' }}>
                  已回答: {answeredCount} / {totalQuestions}
                </span>
              </div>
              
              {interview.questions?.map((question, index) => (
                <div key={question.id} style={{ marginBottom: 32 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    <span style={{ color: '#1890ff', marginRight: 8 }}>Q{index + 1}.</span>
                    {question.question}
                  </div>
                  <Input.TextArea
                    rows={4}
                    placeholder="请输入您的回答..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  />
                </div>
              ))}

              <Button 
                type="primary" 
                size="large" 
                block 
                onClick={handleSubmitAnswers}
                loading={submitting}
                disabled={answeredCount < totalQuestions}
              >
                提交答案 {answeredCount < totalQuestions && `(${answeredCount}/${totalQuestions})`}
              </Button>
              
              {answeredCount < totalQuestions && (
                <p style={{ textAlign: 'center', color: '#faad14', marginTop: 8 }}>
                  请回答所有问题后再提交
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateInterview;
