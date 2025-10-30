import React, { useState, useMemo } from 'react';
import {
  Card,
  Input,
  Button,
  Upload,
  Spin,
  Alert,
  Image,
  Row,
  Col,
  message,
  UploadProps,
  Tag,
} from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined,LoadingOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import './Demo.css';

const { TextArea } = Input;

const Demo: React.FC = () => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑模式：标签选择 vs 文本编辑
  const [editMode, setEditMode] = useState<boolean>(false);

  // 穿搭风格分类标签
  const styleCategories: Record<string, string[]> = {
    '整体风格': ['休闲', '文艺', '甜美', '复古', '运动', '学院', '居家', '商务','民族', '古风'],
    '场景': ['通勤', '约会', '派对', '旅行', '校园'],
    '季节': ['春季', '夏季', '秋季', '冬季'],
  };

  // 已选标签（按分类）
  const [selectedByCat, setSelectedByCat] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    Object.keys(styleCategories).forEach((k) => (init[k] = new Set()));
    return init;
  });

  const composePrompt = (data: Record<string, Set<string>>) => {
    const parts: string[] = [];
    Object.entries(data).forEach(([cat, set]) => {
      if (set.size) parts.push(`${cat}: ${Array.from(set).join('、')}`);
    });
    return `${parts.length ? ' ' + parts.join('；') : ''}`;
  };

  const tagsPrompt = useMemo(() => composePrompt(selectedByCat), [selectedByCat]);

  const toggleTag = (cat: string, tag: string) => {
    setSelectedByCat((prev) => {
      const next: Record<string, Set<string>> = { ...prev };
      const set = new Set(next[cat]);
      // 单选逻辑：同一分类下仅保留一个标签；再次点击同一标签则清空该分类选择
      if (set.has(tag)) {
        next[cat] = new Set();
      } else {
        next[cat] = new Set([tag]);
      }
      return next;
    });
  };

  const clearSelections = () => {
    const cleared: Record<string, Set<string>> = {};
    Object.keys(styleCategories).forEach((k) => (cleared[k] = new Set()));
    setSelectedByCat(cleared);
  };

  const hasSelections = useMemo(() => {
    return Object.values(selectedByCat).some((set) => set.size > 0);
  }, [selectedByCat]);

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

    const promptToSend = editMode ? customPrompt.trim() : tagsPrompt.trim();

    if (!promptToSend) {
      setError(editMode ? '请输入自定义提示词' : '请至少选择一个标签');
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
          prompt: promptToSend,
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
      {/* <div className="demo-header">
        <Title level={2}>穿搭风格生成器</Title>
      </div> */}
      <Row gutter={[24, 24]} className="demo-content">
        {/* 左侧：上传图片 */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* <FileImageOutlined /> */}
                <span>参考图</span>
              </div>
            }
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                {uploadedFile && (
                  <Button danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadedFile(null)}>
                    清空图片
                  </Button>
                )}
              </div>
            }
            className="upload-card"
          >
            <div className="upload-section">
              
              {/* 自定义图片预览 */}
              {uploadedFile ? (
                <div className="image-container">
                  <Image
                    src={URL.createObjectURL(uploadedFile.originFileObj as File)}
                    alt="上传的图片"
                    className="result-image"
                    width={400}
                    height={400}
                    placeholder={
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    }
                  />
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
          <Card 
            title="风格设计区" 
            className="prompt-card"
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small"  onClick={() => setEditMode((v) => !v)}>
                  {editMode ? '切换标签模式' : '切换自定义模式'}
                </Button>
                {!editMode && hasSelections && (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={clearSelections}>清空标签</Button>
                )}
              </div>
            }
          >
            <div className="prompt-section">
              {editMode ? (
                <>
                  <TextArea
                    placeholder="自由编辑提示词"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={8}
                    maxLength={1000}
                    showCount
                    className="prompt-input"
                  />
                </>
              ) : (
                <>
                  {Object.entries(styleCategories).map(([cat, tags]) => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{cat}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {tags.map((t) => {
                          const selected = selectedByCat[cat]?.has(t);
                          return (
                            <Tag
                              key={t}
                              color={selected ? 'blue' : undefined}
                              onClick={() => toggleTag(cat, t)}
                              style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}
                            >
                              {t}
                            </Tag>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {/* <Divider style={{ margin: '12px 0' }} />
                  <div style={{ fontSize: 12, color: '#888' }}>自动根据所选标签生成提示词，亦可切换到自定义编辑。</div> */}
                </>
              )}

              <Button
                type="primary"
                onClick={generateImage}
                disabled={!uploadedFile || (editMode ? !customPrompt.trim() : !hasSelections)}
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
          <Card
            title="生成结果"
            className="result-card"
            extra={
              generatedImage ? (
                <Button type="primary" icon={<DownloadOutlined />} size="small" onClick={downloadImage}>
                  下载图片
                </Button>
              ) : null
            }
          >
            <div className="result-section">
              {generatedImage ? (
                <div className="result-content">
                  <div className="image-container">
                    <Image
                      src={generatedImage}
                      alt="生成的图片"
                      className="result-image"
                      width={400}
                      height={400}
                      placeholder={
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      }
                    />
                  </div>
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