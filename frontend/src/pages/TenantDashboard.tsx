import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Button } from 'antd';
import { CoffeeOutlined, ToolOutlined, PhoneOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/TenantDashboard.css';

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

type MealType = 'breakfast' | 'lunch' | 'dinner';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

function TenantDashboard({ user }: TenantDashboardProps) {
  const [stats, setStats] = useState<Meal[] | null>(null);
  const navigate = useNavigate();
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

  const mealPreferenceMap = useMemo(() => {
    const map: Record<MealType, boolean> = {
      breakfast: false,
      lunch: false,
      dinner: false,
    };

    (stats || []).forEach((meal) => {
      const key = (meal.meal_type || '').toLowerCase() as MealType;
      if (key in map) {
        map[key] = Boolean(meal.is_eating);
      }
    });

    return map;
  }, [stats]);

  return (
    <div className="tenant-dashboard">
      <Card className="tenant-hero-card" bordered={false}>
        <div className="tenant-hero-content">
          <div>
            <p className="tenant-eyebrow">Resident Dashboard</p>
            <h2 className="tenant-title">Hello, {user.name}</h2>
            <p className="tenant-phone">
              <PhoneOutlined /> {user.phone}
            </p>
          </div>
          <div className="tenant-meal-status">
            {mealTypes.map((mealType) => {
              const opted = mealPreferenceMap[mealType];
              return (
                <span
                  key={mealType}
                  className={`tenant-status-pill ${opted ? 'is-opted' : 'is-not-opted'}`}
                >
                  {mealLabels[mealType]}: {opted ? 'Opted' : 'Not Opted'}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

      <Card title="Quick Actions" className="tenant-section-card">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Card
              className="tenant-action-card"
              hoverable
              onClick={() => navigate('/meals')}
            >
              <CoffeeOutlined className="tenant-action-icon" />
              <h4 className="tenant-action-title">Update Meals</h4>
              <p className="tenant-action-desc">Change breakfast, lunch, and dinner selections.</p>
              <Button type="primary">Go to Meals</Button>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              className="tenant-action-card"
              hoverable
              onClick={() => navigate('/service-requests')}
            >
              <ToolOutlined className="tenant-action-icon" />
              <h4 className="tenant-action-title">Report Issues</h4>
              <p className="tenant-action-desc">Create and track your service requests quickly.</p>
              <Button>Open Requests</Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default TenantDashboard;
