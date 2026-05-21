import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Space, message, Tooltip } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';

const BASE_URL = window.location.origin;

const InterviewLink = () => {
  const [link, setLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // 生成一个新的面试链接UUID
    const generateLink = () => {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      return `${BASE_URL}/interview/${uuid}`;
    };
    setLink(generateLink());
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const regenerateLink = () => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    setLink(`${BASE_URL}/interview/${uuid}`);
    setCopySuccess(false);
    message.info('已生成新链接');
  };

  return (
    <Card title="面试链接生成器">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <h4>生成面试邀请链接</h4>
          <p style={{ color: '#666' }}>
            点击下方按钮生成新的面试链接，然后选择岗位发送给候选人。
          </p>
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={link}
            readOnly
            style={{ fontSize: 16 }}
            prefix={<LinkOutlined />}
          />
          <Tooltip title={copySuccess ? '已复制' : '复制链接'}>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              style={{ 
                backgroundColor: copySuccess ? '#52c41a' : undefined,
                borderColor: copySuccess ? '#52c41a' : undefined
              }}
            >
              {copySuccess ? '已复制' : '复制'}
            </Button>
          </Tooltip>
        </Space.Compact>

        <Button onClick={regenerateLink}>
          重新生成链接
        </Button>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h4>使用说明</h4>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#666' }}>
            <li>在"面试邀请"页面创建邀请记录，选择对应岗位</li>
            <li>系统会自动生成包含岗位信息的面试链接</li>
            <li>将链接发送给候选人，候选人点击即可开始面试</li>
            <li>候选人提交答案后，可在"候选人管理"中查看和评分</li>
          </ol>
        </div>
      </Space>
    </Card>
  );
};

export default InterviewLink;
