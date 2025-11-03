import React from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { setToken } from "./auth";
import "./Login.css";

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/user";

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "登录失败");

      setToken(data.token);
      message.success("登录成功");
      navigate(from, { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "登录失败");
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={3} className="login-title">
          用户登录
        </Title>
        <Form layout="vertical" onFinish={onFinish} className="login-form">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input placeholder="请输入用户名" autoComplete="username" />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
        </Form.Item>
        <div className="login-buttons">
          <Button type="primary" htmlType="submit" block className="login-button">
            登录
          </Button>
          <Button block type="default" className="register-button">
            注册
          </Button>
        </div>
      </Form>
    </Card>
  </div>
  );
};

export default Login;
