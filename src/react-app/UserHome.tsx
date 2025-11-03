import React, { useState } from "react";
import { Layout, Card, Image, Avatar, Typography, Tag, Button, Space, Row, Col, Divider } from "antd";
import {LogoutOutlined, MailOutlined, CrownOutlined, CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { clearToken } from "./auth";
import Demo from "./Demo";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const mockUser = {
  name: "Jane",
  email: "jane@example.com",
  level: "黄金会员",
  joinAt: "2025-11-01",
  tags: ["摄影", "旅行", "学院", "时尚", "文艺", "甜美"],
  stats: [
    { label: "作品", value: 3 },
    { label: "关注", value: 1 },
    { label: "粉丝", value: 0 },
  ],
};

const images = [
  {
    title: "时尚风",
    url: "/123.png",
  },
  {
    title: "校园风",
    url: "456.jpeg",
  },
  {
    title: "商务风",
    url: "789.jpeg",
  },
];

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const [designMode, setDesignMode] = useState(false);

  const onLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <Space size={12} align="center">
          {/* <Avatar size={32} icon={<UserOutlined />} /> */}
          <Title level={4} style={{ margin: 0 }}>穿搭随心变</Title>
        </Space>
        <Space>
          {/* {getToken() && <Text type="secondary">已登录</Text>} */}
          <Button icon={<LogoutOutlined />} onClick={onLogout}>退出登录</Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={280} style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ padding: 16 }}>
            <Card bordered={false}>
              <Space align="center" direction="vertical" style={{ width: "100%" }} size={16}>
                <Avatar size={80} src="/avatar.jpg" />
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ marginBottom: 4 }}>{mockUser.name}</Title>
                  <Text type="secondary"><MailOutlined /> {mockUser.email}</Text>
                </div>
                <Space wrap>
                  <Tag color="gold"><CrownOutlined /> {mockUser.level}</Tag>
                  <Tag icon={<CalendarOutlined />}>
                    加入于 {mockUser.joinAt}
                  </Tag>
                </Space>
                <Divider style={{ margin: "8px 0" }} />
                <Space size={24} style={{ width: "100%", justifyContent: "space-around" }}>
                  {mockUser.stats.map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <Title level={4} style={{ margin: 0 }}>{s.value}</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                    </div>
                  ))}
                </Space>
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ width: "100%" }}>
                  <Text type="secondary">兴趣标签</Text>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {mockUser.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
              </Space>
            </Card>
          </div>
        </Sider>
        <Layout>
          <Content style={{ padding: 16 }}>
            <Card bordered={false} style={{ marginBottom: 12, borderRadius: 12 }} bodyStyle={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {designMode ? (
                  <Button onClick={() => setDesignMode(false)}>返回</Button>
                ) : (
                  <>
                   <Button type="primary" onClick={() => setDesignMode(true)}>设计</Button>
                  <Button>作品</Button>
                  <Button>广场</Button>
                  <Button>喜欢</Button>
                  <Button>分享</Button>
                  <Button>设置</Button>
                  </>
                 )}
              </div>
            </Card>
            <Title level={4}>今日穿搭推荐</Title>
            {designMode ? (
              <Card className="prompt-card" bodyStyle={{ padding: 12 }}>
                <Demo />
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {images.map((img) => (
                  <Col xs={24} md={12} lg={8} key={img.title}>
                    <Card
                      hoverable
                      title={img.title}
                      className="result-card"
                      bodyStyle={{ padding: 12 }}
                    >
                      <div className="image-container">
                        <Image
                          src={img.url}
                          alt={img.title}
                          className="result-image"
                          width={360}
                          height={440}
                          preview={false}
                        />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default UserHome;
