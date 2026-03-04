import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Empty, Button } from 'antd';
import { UserOutlined, CoffeeOutlined, AppstoreOutlined } from '@ant-design/icons';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
}

interface Meal {
  id: number;
  user_id: number;
  meal_type: string;
  date: string;
  is_eating: boolean;
  veg_non_veg: string;
}

interface TenantDashboardProps {
  user: User;
}

function TenantDashboard({ user }: TenantDashboardProps) {
  const [stats, setStats] = useState<Meal[] | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API_URL}/api/meals/${today}`);
      const meals: Meal[] = response.data;
      const todayMeals = meals.filter((m: Meal) => m.user_id === user.id);
      setStats(todayMeals);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={`Hello, ${user.name}`}
              value=""
              prefix={<UserOutlined />}
            />
            <p style={{ color: '#999', marginTop: '10px' }}>
              Phone: {user.phone}
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Your Meals Today"
              value={stats?.length || 0}
              prefix={<CoffeeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => window.location.href = '/#/meals'}
              style={{ cursor: 'pointer', textAlign: 'center', padding: '20px' }}
            >
              <CoffeeOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <p style={{ marginTop: '10px', marginBottom: 0 }}>Update Meal Preferences</p>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => window.location.href = '/#/service-requests'}
              style={{ cursor: 'pointer', textAlign: 'center', padding: '20px' }}
            >
              <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <p style={{ marginTop: '10px', marginBottom: 0 }}>Report Issues</p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card 
        title="About PGMT App" 
        style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        headStyle={{ color: 'white' }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <AppstoreOutlined style={{ fontSize: '64px', color: '#fff', marginBottom: '10px' }} />
          </Col>
          <Col xs={24} sm={16}>
            <h3 style={{ color: 'white', marginTop: 0 }}>PG Meal & Service Tracker</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '10px' }}>
              Your all-in-one solution for managing meals, service requests, and accessing exclusive perks at your PG.
            </p>
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                ✓ Track daily meals<br/>
                ✓ Report maintenance issues<br/>
                ✓ Access exclusive deals
              </p>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="Today's Meal Preferences">
        {stats && stats.length > 0 ? (
          <div>
            {stats.map((meal: Meal) => (
              <div key={meal.id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                <Tag color={meal.is_eating ? 'green' : 'red'}>
                  {meal.meal_type.toUpperCase()}: {meal.is_eating ? 'YES' : 'NO'}
                </Tag>
                {meal.is_eating && <Tag color="blue">{meal.veg_non_veg.toUpperCase()}</Tag>}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="No meals recorded yet" />
        )}
      </Card>
    </div>
  );
}

export default TenantDashboard;
