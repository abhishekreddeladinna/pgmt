import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Modal,
  message,
  Tabs,
  Typography,
  TimePicker,
  Space,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { format } from 'date-fns';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import '../styles/AdminDashboard.css';

const { Text, Title } = Typography;

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
  meal_breakdown?: {
    breakfast?: { total: number; veg: number; non_veg: number };
    lunch?: { total: number; veg: number; non_veg: number };
    dinner?: { total: number; veg: number; non_veg: number };
  };
}

interface ServiceRequest {
  id: number;
  user_id: number;
  issue: string;
  status: string;
  created_at: string;
}

interface MealRecord {
  id: number;
  user_id: number;
  meal_type: string;
  date: string;
  is_eating: boolean;
  veg_non_veg: string;
}

interface DeadlineInfo {
  meal_type: string;
  deadline_hour: number;
  deadline_minute: number;
}

interface AdminDashboardProps {
  user: { id: number; name: string; phone: string; aadhar: string; is_admin: boolean; created_at?: string };
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const mealColors: Record<MealType, string> = {
  breakfast: '#d97706',
  lunch: '#dc2626',
  dinner: '#0f766e',
};

function AdminDashboard({ user }: AdminDashboardProps) {
  const [mealSummary, setMealSummary] = useState<MealSummary | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [liveMealBreakdown, setLiveMealBreakdown] = useState<Record<MealType, { total: number; veg: number; non_veg: number }>>({
    breakfast: { total: 0, veg: 0, non_veg: 0 },
    lunch: { total: 0, veg: 0, non_veg: 0 },
    dinner: { total: 0, veg: 0, non_veg: 0 },
  });
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
      const [mealResponse, requestsResponse, usersResponse, deadlinesResponse, mealsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/meal-summary/${today}`),
        axios.get(`${API_URL}/api/service-requests`),
        axios.get(`${API_URL}/api/admin/users`),
        axios.get(`${API_URL}/api/deadlines`),
        axios.get(`${API_URL}/api/meals/${today}`),
      ]);

      setMealSummary(mealResponse.data);
      setServiceRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : []);
      setAllUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setDeadlines(Array.isArray(deadlinesResponse.data) ? deadlinesResponse.data : []);

      const freshBreakdown: Record<MealType, { total: number; veg: number; non_veg: number }> = {
        breakfast: { total: 0, veg: 0, non_veg: 0 },
        lunch: { total: 0, veg: 0, non_veg: 0 },
        dinner: { total: 0, veg: 0, non_veg: 0 },
      };

      const records: MealRecord[] = Array.isArray(mealsResponse.data) ? mealsResponse.data : [];

      records.forEach((meal) => {
        if (!meal?.is_eating) return;

        const mealType = (meal.meal_type || '').trim().toLowerCase() as MealType;
        if (!mealTypes.includes(mealType)) return;

        const prefRaw = (meal.veg_non_veg || '').trim().toLowerCase();
        const pref = prefRaw === 'nonveg' || prefRaw === 'non-veg' || prefRaw === 'non veg' ? 'non_veg' : prefRaw;

        freshBreakdown[mealType].total += 1;
        if (pref === 'veg') freshBreakdown[mealType].veg += 1;
        if (pref === 'non_veg') freshBreakdown[mealType].non_veg += 1;
      });

      setLiveMealBreakdown(freshBreakdown);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleCloseRequest = async (requestId: number) => {
    Modal.confirm({
      title: 'Mark this request as fixed?',
      content: 'This action will move the request to resolved state.',
      okText: 'Mark Fixed',
      cancelText: 'Cancel',
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

  const handleDeadlineChange = async (mealType: MealType, time: dayjs.Dayjs | null) => {
    if (!time) return;
    try {
      await axios.put(`${API_URL}/api/admin/deadlines`, {
        meal_type: mealType,
        deadline_hour: time.hour(),
        deadline_minute: time.minute(),
      });
      message.success(`${mealLabels[mealType]} deadline updated`);
      fetchAdminData();
    } catch (error) {
      message.error('Failed to update deadline');
    }
  };

  const getDeadlineTime = (mealType: MealType): dayjs.Dayjs => {
    const d = deadlines.find((dl) => dl.meal_type === mealType);
    if (d) return dayjs().hour(d.deadline_hour).minute(d.deadline_minute);
    return mealType === 'dinner' ? dayjs().hour(19).minute(0) : dayjs().hour(9).minute(0);
  };

  const getMealBreakdown = (mealType: MealType) => {
    const fromLive = liveMealBreakdown[mealType];
    if (fromLive.total > 0 || fromLive.veg > 0 || fromLive.non_veg > 0) {
      return fromLive;
    }

    const details = mealSummary?.meal_breakdown?.[mealType];
    const fallbackTotal =
      mealType === 'breakfast'
        ? mealSummary?.breakfast
        : mealType === 'lunch'
          ? mealSummary?.lunch
          : mealSummary?.dinner;

    return {
      total: details?.total ?? fallbackTotal ?? 0,
      veg: details?.veg ?? 0,
      non_veg: details?.non_veg ?? 0,
    };
  };

  const pendingRequests = serviceRequests.filter((r) => r.status !== 'Fixed').length;
  const resolvedRequests = serviceRequests.length - pendingRequests;
  const todayLabel = format(new Date(), 'EEE, dd MMM yyyy');

  const serviceColumns: TableColumnsType<ServiceRequest> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      responsive: ['md'] as const,
    },
    {
      title: 'Issue',
      dataIndex: 'issue',
      key: 'issue',
      width: '40%',
    },
    {
      title: 'User',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 110,
      responsive: ['sm'] as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag icon={status === 'Fixed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} color={status === 'Fixed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      responsive: ['md'] as const,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record: ServiceRequest) => {
        if (record.status === 'Fixed') return <Text type="secondary">Resolved</Text>;
        return (
          <Button type="primary" size="small" onClick={() => handleCloseRequest(record.id)} loading={loading}>
            Mark Fixed
          </Button>
        );
      },
    },
  ];

  const userColumns: TableColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Aadhar',
      dataIndex: 'aadhar',
      key: 'aadhar',
      render: (aadhar: string) => (aadhar ? `${aadhar.slice(0, 4)}****${aadhar.slice(-4)}` : '-'),
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      render: (password: string) => (password ? <Text code copyable>{password}</Text> : '-'),
    },
    {
      title: 'Role',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin: boolean) => <Tag color={isAdmin ? 'red' : 'blue'}>{isAdmin ? 'Admin' : 'Tenant'}</Tag>,
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="admin-dashboard">
      <Card className="admin-hero" bordered={false}>
        <div className="admin-hero-content">
          <div>
            <p className="admin-eyebrow">Control Center</p>
            <Title level={3} style={{ margin: 0 }}>
              Welcome, {user.name}
            </Title>
            <Text type="secondary">Monitor meals, users, requests, and deadlines from one place.</Text>
          </div>
          <div className="admin-hero-chips">
            <Tag icon={<CalendarOutlined />} color="processing">
              {todayLabel}
            </Tag>
            <Tag color="gold">Pending Requests: {pendingRequests}</Tag>
            <Tag color="green">Resolved: {resolvedRequests}</Tag>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="admin-stat-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card">
            <Statistic title="Total Users" value={allUsers.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card">
            <Statistic title="Eating Today" value={mealSummary?.total_eating || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card veg">
            <Statistic title="Veg Total" value={mealSummary?.veg || 0} valueStyle={{ color: '#15803d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card nonveg">
            <Statistic title="Non-Veg Total" value={mealSummary?.non_veg || 0} valueStyle={{ color: '#c2410c' }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="users"
        className="admin-tabs"
        items={[
          {
            key: 'users',
            label: `Users (${allUsers.length})`,
            children: (
              <Card className="admin-tab-card" bordered={false}>
                <Table
                  dataSource={allUsers}
                  columns={userColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              </Card>
            ),
          },
          {
            key: 'requests',
            label: `Service Requests (${pendingRequests})`,
            children: (
              <Card className="admin-tab-card" bordered={false}>
                <Table
                  dataSource={serviceRequests}
                  columns={serviceColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 'max-content' }}
                  size="small"
                />
              </Card>
            ),
          },
          {
            key: 'inventory',
            label: 'Food Inventory',
            children: (
              <Card className="admin-tab-card" title="Meal-wise Breakdown">
                <Row gutter={[16, 16]}>
                  {mealTypes.map((mealType) => {
                    const stats = getMealBreakdown(mealType);
                    return (
                      <Col xs={24} sm={12} lg={8} key={mealType}>
                        <Card className="meal-breakdown-card" style={{ borderTop: `4px solid ${mealColors[mealType]}` }}>
                          <div className="meal-breakdown-head">
                            <Text strong>{mealLabels[mealType]}</Text>
                            <Tag color="blue">Total: {stats.total}</Tag>
                          </div>
                          <div className="meal-breakdown-values">
                            <div>
                              <Text type="secondary">Veg</Text>
                              <Title level={4} style={{ margin: 0, color: '#15803d' }}>
                                {stats.veg}
                              </Title>
                            </div>
                            <div>
                              <Text type="secondary">Non-Veg</Text>
                              <Title level={4} style={{ margin: 0, color: '#c2410c' }}>
                                {stats.non_veg}
                              </Title>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            ),
          },
          {
            key: 'settings',
            label: 'Settings',
            children: (
              <Card title="Meal Deadline Settings" className="admin-tab-card" extra={<SettingOutlined />}>
                <Text type="secondary" style={{ marginBottom: 18, display: 'block' }}>
                  Set the cut-off time for each meal. Tenants cannot change meal preference after the configured time.
                </Text>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {mealTypes.map((mealType) => (
                    <Card key={mealType} size="small" className="deadline-setting-card">
                      <Row align="middle" justify="space-between" gutter={[12, 12]}>
                        <Col>
                          <Space>
                            <span className="meal-dot" style={{ background: mealColors[mealType] }} />
                            <Text strong>{mealLabels[mealType]}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            <Text type="secondary">Deadline</Text>
                            <TimePicker
                              value={getDeadlineTime(mealType)}
                              format="hh:mm A"
                              onChange={(time) => handleDeadlineChange(mealType, time)}
                              use12Hours
                              allowClear={false}
                              style={{ width: 150 }}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
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
