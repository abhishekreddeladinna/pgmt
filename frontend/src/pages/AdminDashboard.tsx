import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, message, Tabs, Typography, TimePicker, Space } from 'antd';
import { TeamOutlined, CoffeeOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { format } from 'date-fns';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  password?: string;
  is_admin: boolean;
  created_at: string;
}

interface MealSummary {
  total_eating: number;
  veg: number;
  non_veg: number;
  breakfast?: number;
  lunch?: number;
  dinner?: number;
}

interface ServiceRequest {
  id: number;
  user_id: number;
  issue: string;
  status: string;
  created_at: string;
}

interface DeadlineInfo {
  meal_type: string;
  deadline_hour: number;
  deadline_minute: number;
}

interface AdminDashboardProps {
  user: { id: number; name: string; phone: string; aadhar: string; is_admin: boolean; created_at?: string };
}

function AdminDashboard({ user }: AdminDashboardProps) {
  const [mealSummary, setMealSummary] = useState<MealSummary | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [mealResponse, requestsResponse, usersResponse, deadlinesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/meal-summary/${today}`),
        axios.get(`${API_URL}/api/service-requests`),
        axios.get(`${API_URL}/api/admin/users`),
        axios.get(`${API_URL}/api/deadlines`),
      ]);

      setMealSummary(mealResponse.data);
      setServiceRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : []);
      setAllUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setDeadlines(Array.isArray(deadlinesResponse.data) ? deadlinesResponse.data : []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleCloseRequest = async (requestId: number) => {
    Modal.confirm({
      title: 'Mark as Fixed?',
      content: 'Are you sure you want to close this request?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setLoading(true);
        try {
          await axios.put(`${API_URL}/api/service-requests/${requestId}`, {
            status: 'Fixed',
          });
          message.success('Request closed successfully');
          fetchAdminData();
        } catch (error) {
          message.error('Failed to close request');
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeadlineChange = async (mealType: string, time: dayjs.Dayjs | null) => {
    if (!time) return;
    try {
      await axios.put(`${API_URL}/api/admin/deadlines`, {
        meal_type: mealType,
        deadline_hour: time.hour(),
        deadline_minute: time.minute(),
      });
      message.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} deadline updated!`);
      fetchAdminData();
    } catch (error) {
      message.error('Failed to update deadline');
    }
  };

  const getDeadlineTime = (mealType: string): dayjs.Dayjs => {
    const d = deadlines.find((dl) => dl.meal_type === mealType);
    if (d) return dayjs().hour(d.deadline_hour).minute(d.deadline_minute);
    return dayjs().hour(9).minute(0);
  };

  const serviceColumns: TableColumnsType<ServiceRequest> = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 50,
      responsive: ['md'] as const,
    },
    { 
      title: 'Issue', 
      dataIndex: 'issue', 
      key: 'issue',
      width: '40%',
    },
    { 
      title: 'User ID', 
      dataIndex: 'user_id', 
      key: 'user_id',
      width: '20%',
      responsive: ['sm'] as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status: string) => (
        <Tag
          icon={status === 'Fixed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={status === 'Fixed' ? 'green' : 'orange'}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      responsive: ['md'] as const,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      width: '20%',
      render: (_, record: ServiceRequest) => {
        if (record.status === 'Fixed') return <span>-</span>;
        return (
          <Button type="primary" size="small" onClick={() => handleCloseRequest(record.id)} loading={loading}>
            Close
          </Button>
        );
      },
    },
  ];

  const userColumns: TableColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Aadhar',
      dataIndex: 'aadhar',
      key: 'aadhar',
      render: (aadhar: string) => aadhar ? `${aadhar.slice(0, 4)}****${aadhar.slice(-4)}` : '-',
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      render: (password: string) => password ? <Text code copyable>{password}</Text> : '-',
    },
    {
      title: 'Role',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin: boolean) => (
        <Tag color={isAdmin ? 'red' : 'blue'}>{isAdmin ? 'Admin' : 'Tenant'}</Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Card title="Admin Dashboard" style={{ marginBottom: '20px' }}>
        <p>Welcome, {user.name} (Admin)</p>
      </Card>

      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={allUsers.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Eating Today"
              value={mealSummary?.total_eating || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Breakfast"
              value={mealSummary?.breakfast || 0}
              prefix={<CoffeeOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Lunch"
              value={mealSummary?.lunch || 0}
              prefix={<CoffeeOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Dinner"
              value={mealSummary?.dinner || 0}
              prefix={<CoffeeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="🍽️ Food Inventory Summary" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }} headStyle={{ color: 'white' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card
              style={{
                background: '#52c41a20',
                border: '2px solid #52c41a',
                borderRadius: '8px',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🥬</div>
              <h3 style={{ color: '#52c41a', marginBottom: '8px' }}>Vegetarian</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                {mealSummary?.veg || 0}
              </div>
              <p style={{ color: '#999', marginTop: '8px', marginBottom: 0, fontSize: '12px' }}>
                People eating vegetarian today
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              style={{
                background: '#f522200d',
                border: '2px solid #f5222d',
                borderRadius: '8px',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🍗</div>
              <h3 style={{ color: '#f5222d', marginBottom: '8px' }}>Non-Vegetarian</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f5222d' }}>
                {mealSummary?.non_veg || 0}
              </div>
              <p style={{ color: '#999', marginTop: '8px', marginBottom: 0, fontSize: '12px' }}>
                People eating non-vegetarian today
              </p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: `👥 Users (${allUsers.length})`,
            children: (
              <Table
                dataSource={allUsers}
                columns={userColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            ),
          },
          {
            key: '2',
            label: 'Service Requests',
            children: (
              <Table
                dataSource={serviceRequests}
                columns={serviceColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ),
          },
          {
            key: '3',
            label: 'Food Inventory',
            children: (
              <Card>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Card style={{ background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🥬</div>
                      <h3>Vegetarian Meals</h3>
                      <p style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                        {mealSummary?.veg || 0}
                      </p>
                      <p style={{ color: '#666' }}>Portions needed today</p>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card style={{ background: '#fff1f0', borderLeft: '4px solid #f5222d' }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🍖</div>
                      <h3>Non-Vegetarian Meals</h3>
                      <p style={{ fontSize: '24px', color: '#f5222d', fontWeight: 'bold' }}>
                        {mealSummary?.non_veg || 0}
                      </p>
                      <p style={{ color: '#666' }}>Portions needed today</p>
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: '4',
            label: '⚙️ Settings',
            children: (
              <Card title="Meal Deadline Settings" extra={<SettingOutlined />}>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  Set the cut-off time for each meal. Tenants won't be able to change their meal preference after this time.
                </p>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                    const icons: Record<string, string> = { breakfast: '☀️', lunch: '🍽️', dinner: '🌙' };
                    return (
                      <Card
                        key={mealType}
                        size="small"
                        style={{ borderLeft: '4px solid #1890ff' }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>{icons[mealType]}</span>
                            <Text strong style={{ fontSize: '16px', textTransform: 'capitalize' }}>
                              {mealType}
                            </Text>
                          </Col>
                          <Col>
                            <Space>
                              <Text type="secondary">Deadline:</Text>
                              <TimePicker
                                value={getDeadlineTime(mealType)}
                                format="hh:mm A"
                                onChange={(time) => handleDeadlineChange(mealType, time)}
                                use12Hours
                                allowClear={false}
                                style={{ width: 140 }}
                              />
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </Space>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

export default AdminDashboard;
