import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Modal, Typography } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined, CopyOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const { Text, Title } = Typography;

interface SignupFormValues {
  name: string;
  phone: string;
  aadhar: string;
}

interface SignupResponse {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  password: string;
  is_admin: boolean;
  created_at: string;
}

function Signup() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<SignupResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleSignup = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name: values.name,
        phone: values.phone,
        aadhar: values.aadhar,
      });
      setCreatedUser(response.data);
      setShowModal(true);
      message.success('Account created successfully!');
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Signup failed. Please try again.';
      message.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (createdUser?.password) {
      navigator.clipboard.writeText(createdUser.password);
      message.success('Password copied to clipboard!');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/login');
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={12} lg={8}>
          <Card
            title="PG Buddy Sign Up"
            variant="borderless"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSignup}
              autoComplete="off"
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter your name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name"
                />
              </Form.Item>

              <Form.Item
                label="WhatsApp Number"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter your WhatsApp number' },
                  { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit number' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="10-digit WhatsApp number"
                  type="tel"
                />
              </Form.Item>

              <Form.Item
                label="Aadhar Number"
                name="aadhar"
                rules={[
                  { required: true, message: 'Please enter your Aadhar number' },
                  { pattern: /^[0-9]{12}$/, message: 'Please enter a valid 12-digit Aadhar number' },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  size="large"
                >
                  Sign Up
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Button type="link" onClick={() => navigate('/login')}>
                  Already have an account? Login
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        title="🎉 Account Created Successfully!"
        open={showModal}
        onOk={handleModalClose}
        onCancel={handleModalClose}
        okText="Go to Login"
        cancelButtonProps={{ style: { display: 'none' } }}
        closable={false}
        maskClosable={false}
      >
        {createdUser && (
          <div style={{ padding: '10px 0' }}>
            <p><Text strong>Name:</Text> {createdUser.name}</p>
            <p><Text strong>Phone:</Text> {createdUser.phone}</p>
            <p><Text strong>Aadhar:</Text> {createdUser.aadhar}</p>
            <div
              style={{
                background: '#f6ffed',
                border: '2px solid #52c41a',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px',
                textAlign: 'center',
              }}
            >
              <Text type="secondary">Your generated password</Text>
              <Title level={2} style={{ margin: '8px 0', color: '#52c41a', letterSpacing: '4px' }}>
                {createdUser.password}
              </Title>
              <Button
                icon={<CopyOutlined />}
                onClick={copyPassword}
                type="primary"
                ghost
              >
                Copy Password
              </Button>
            </div>
            <p style={{ color: '#ff4d4f', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>
              ⚠️ Save this password! You will need it to login.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Signup;
