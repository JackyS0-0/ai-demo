import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Upload,
  Spin,
  Alert,
  Typography,
  Image,
  Row,
  Col,
  message,
  UploadProps,
} from 'antd';
import { UploadOutlined, DownloadOutlined, LoadingOutlined, PictureOutlined, FileImageOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import './Demo.css';

const { Title } = Typography;
const { TextArea } = Input;

const Demo: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 预设提示词
  const presetPrompts = [
    {
      label: '人物手办',
      prompt: '使用提供的图片制作一个1/7比例的商用角色立绘，采用写实风格和环境。将角色放置在电脑桌上，使用一个无文字的圆形透明亚克力底座。在电脑屏幕上，显示该角色的ZBrush建模过程。在电脑屏幕旁边，放置一个印有原画的BANDAI风格玩具包装盒。'
    },
    {
      label: '法天象地',
      prompt: '把人物改为巨大化虚影，画面中间添加原图人物，用极低角度的仰视视角拍摄，形成法天象地的电影画面感，保持画面中的服装，发型，道具等一致性，自动选择合适的背景保持画面的冲击力。'
    },
  ];

  // 应用预设提示词
  const applyPresetPrompt = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };

  // API端点URL
  const apiBaseUrl = '/api';

  // 图片上传前的验证
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    // 检查文件类型
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return Upload.LIST_IGNORE;
    }

    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!');
      return Upload.LIST_IGNORE;
    }

    // 验证图片尺寸
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const { width, height } = img;
          const aspectRatio = width / height;
          
          // 检查宽高比
          if (aspectRatio < 1/3 || aspectRatio > 3) {
            message.error('图片宽高比必须在 1/3 到 3 之间!');
            reject(false);
            return;
          }

          // 检查最小尺寸
          if (width < 14 || height < 14) {
            message.error('图片宽高必须大于 14px!');
            reject(false);
            return;
          }

          // 检查最大像素
          if (width * height > 6000 * 6000) {
            message.error('图片总像素不能超过 6000×6000!');
            reject(false);
            return;
          }

          resolve(true);
        };
        img.onerror = () => reject(false);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(false);
      reader.readAsDataURL(file);
    });
  };

  // 处理图片上传 - 简化版本
  const handleUpload: UploadProps['onChange'] = (info) => {
    const { file } = info;
    
    
      setUploadedFile(file);
      setError(null);
      message.success(`${file.name} 上传成功`);
   
  };

  // 自定义上传实现 - 直接返回成功
  const customUpload = async (options: any) => {
    const { file, onSuccess } = options;
    
    // 模拟上传过程
    setTimeout(() => {
      onSuccess?.('ok', file);
    }, 100);
  };

  // 将图片转换为Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // 提取格式并确保小写
        const format = file.type.split('/')[1].toLowerCase();
        resolve(`data:image/${format};base64,${base64.split(',')[1]}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 生成图片
  const generateImage = async () => {
    if (!uploadedFile) {
      setError('请上传一张参考图片');
      return;
    }

    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 将图片转换为Base64
      const base64Image = await fileToBase64(uploadedFile.originFileObj as File);

      // 调用worker API
      const response = await fetch(`${apiBaseUrl}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: base64Image,
          size: '2K'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API调用失败');
      }

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        message.success('图片生成成功!');
      } else {
        throw new Error('未收到有效的图片URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成图片时发生未知错误';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 下载生成的图片
  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <Title level={2}>AI 图片编辑</Title>
      </div>


      <Row gutter={[24, 24]} className="demo-content">
        {/* 左侧：上传图片 */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* <FileImageOutlined /> */}
                <span>上传一张参考图片</span>
              </div>
            }
            extra={
              <Upload
                name="image"
                multiple={false}
                maxCount={1}
                beforeUpload={beforeUpload}
                onChange={handleUpload}
                customRequest={customUpload}
                accept=".jpg,.jpeg,.png"
                fileList={uploadedFile ? [uploadedFile] : []}
                showUploadList={false}
                onRemove={() => setUploadedFile(null)}
              >
                <Button type="primary" icon={<UploadOutlined />} size="small">
                  选择图片
                </Button>
              </Upload>
            }
            className="upload-card"
          >
            <div className="upload-section">
              
              {/* 自定义图片预览 */}
              {uploadedFile ? (
                <div className="custom-image-preview">
                  <div className="preview-image-container">
                    <Image
                      src={URL.createObjectURL(uploadedFile.originFileObj as File)}
                      alt="上传的图片"
                      className="preview-image"
                      placeholder={
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      }
                    />
                  </div>
                  <div className="preview-info">
                    <div className="file-name">{uploadedFile.name}</div>
                    <div className="file-size">
                      {(uploadedFile.size! / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => setUploadedFile(null)}
                      className="remove-button"
                    >
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="empty-result">
                  <div className="empty-icon">
                    <PictureOutlined />
                  </div>
                  <div className="empty-text">
                    <div className="empty-title">等待上传图片</div>
                    <div className="empty-subtitle">点击"选择图片"按钮上传参考图片</div>
                  </div>
                </div>
              )}
              

            </div>
          </Card>
        </Col>

        {/* 中间：输入提示词 */}
        <Col xs={24} md={8}>
          <Card title="输入提示词" className="prompt-card">
            <div className="prompt-section">
              {/* 快捷按钮区域 */}
              <div>
                <div className="quick-buttons-title">快捷提示词</div>
                <div className="quick-buttons-grid">
                  {presetPrompts.map((preset, index) => (
                    <Button
                      key={index}
                      size="small"
                      className="quick-button"
                      onClick={() => applyPresetPrompt(preset.prompt)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <TextArea
                placeholder="请详细描述您希望编辑内容"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                maxLength={1000}
                showCount
                className="prompt-input"
              />
              
              <Button
                type="primary"
                onClick={generateImage}
                disabled={!uploadedFile || !prompt.trim()}
                loading={loading}
                size="large"
                block
                className="generate-button"
              >
                {loading ? '生成中...' : '生成图片'}
              </Button>
            </div>
          </Card>
        </Col>

        {/* 右侧：生成结果 */}
        <Col xs={24} md={8}>
          <Card title="生成结果" className="result-card">
            <div className="result-section">
              {generatedImage ? (
                <div className="result-content">
                  <div className="image-container">
                    <Image
                      src={generatedImage}
                      alt="生成的图片"
                      className="result-image"
                      placeholder={
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      }
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={downloadImage}
                    size="large"
                    block
                    className="download-button"
                  >
                    下载图片
                  </Button>
                </div>
              ) : (
                <div className="empty-result">
                  <div className="empty-icon">
                    <PictureOutlined />
                  </div>
                  <div className="empty-text">
                    <div className="empty-title">等待生成结果</div>
                    <div className="empty-subtitle">上传图片并输入描述后，生成结果将在此处显示</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 错误显示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="error-alert"
        />
      )}
    </div>
  );
};

export default Demo;