import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Switch, message, Select, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/MealTracker.css';

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface MealPreference {
  is_eating: boolean;
  veg_non_veg: string;
}

type MealState = Record<MealType, MealPreference>;

interface MealTrackerProps {
  user: User;
}

interface DeadlineInfo {
  meal_type: string;
  deadline_hour: number;
  deadline_minute: number;
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const mealColors: Record<MealType, string> = {
  breakfast: '#c77d1f',
  lunch: '#c2410c',
  dinner: '#0f766e',
};

const fallbackDeadlineLabels: Record<MealType, string> = {
  breakfast: '9:00 AM',
  lunch: '9:00 AM',
  dinner: '7:00 PM',
};

function MealTracker({ user }: MealTrackerProps) {
  const [meals, setMeals] = useState<MealState>({
    breakfast: { is_eating: false, veg_non_veg: 'veg' },
    lunch: { is_eating: false, veg_non_veg: 'veg' },
    dinner: { is_eating: false, veg_non_veg: 'veg' },
  });
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [savingMeal, setSavingMeal] = useState<MealType | null>(null);
  const [, setNowTick] = useState(Date.now());
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchTodaysMeals();
    fetchDeadlines();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchDeadlines = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/deadlines`);
      setDeadlines(response.data);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchTodaysMeals = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`${API_URL}/api/meals/${today}`);
      const userMeals = response.data.filter((m: any) => m.user_id === user.id);

      if (userMeals.length > 0) {
        const mealMap: Partial<MealState> = {};
        userMeals.forEach((m: any) => {
          const mealType = (m.meal_type || '').toLowerCase() as MealType;
          if (mealTypes.includes(mealType)) {
            mealMap[mealType] = { is_eating: Boolean(m.is_eating), veg_non_veg: m.veg_non_veg || 'veg' };
          }
        });
        setMeals((prev) => ({ ...prev, ...mealMap }));
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const isToggleDisabled = (mealType: MealType): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dl = deadlines.find((d) => d.meal_type === mealType);
    if (!dl) return false;
    const deadlineMinutes = dl.deadline_hour * 60 + dl.deadline_minute;
    return currentMinutes >= deadlineMinutes;
  };

  const getDeadlineLabel = (mealType: MealType): string => {
    const dl = deadlines.find((d) => d.meal_type === mealType);
    if (!dl) return '';
    const h = dl.deadline_hour % 12 || 12;
    const m = dl.deadline_minute.toString().padStart(2, '0');
    const ampm = dl.deadline_hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  const handleMealChange = async (mealType: MealType, isEating: boolean) => {
    if (isToggleDisabled(mealType)) {
      message.error(`${mealLabels[mealType]} deadline has passed`);
      return;
    }

    setSavingMeal(mealType);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_URL}/api/meals`, {
        user_id: user.id,
        meal_type: mealType,
        date: today,
        is_eating: isEating,
        veg_non_veg: meals[mealType]?.veg_non_veg || 'veg',
      });
      setMeals((prev) => ({
        ...prev,
        [mealType]: { ...prev[mealType], is_eating: isEating },
      }));
      message.success(`${mealLabels[mealType]} updated`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        message.error(error.response.data?.detail || 'Deadline has passed');
      } else {
        message.error('Failed to update meal');
      }
      console.error(error);
    } finally {
      setSavingMeal(null);
    }
  };

  const handleVegNonVegChange = async (mealType: MealType, value: string) => {
    if (isToggleDisabled(mealType)) {
      message.error(`${mealLabels[mealType]} deadline has passed`);
      return;
    }

    const updated = {
      ...meals,
      [mealType]: { ...meals[mealType], veg_non_veg: value },
    };
    setMeals(updated);
    setSavingMeal(mealType);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_URL}/api/meals`, {
        user_id: user.id,
        meal_type: mealType,
        date: today,
        is_eating: updated[mealType].is_eating,
        veg_non_veg: value,
      });
      message.success(`${mealLabels[mealType]} preference updated`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        message.error(error.response.data?.detail || 'Deadline has passed');
      } else {
        message.error('Failed to update preference');
      }
      console.error(error);
    } finally {
      setSavingMeal(null);
    }
  };

  return (
    <div className="meal-tracker">
      <Card className="meal-tracker-hero" bordered={false}>
        <div className="meal-tracker-hero-inner">
          <div>
            <h2 className="meal-tracker-title">Deadline for today</h2>
            <p className="meal-tracker-subtitle">Update your choices before each deadline.</p>
          </div>
          <div className="meal-tracker-hero-deadlines">
            {mealTypes.map((type) => (
              <span key={type} className={`meal-deadline-pill ${isToggleDisabled(type) ? 'is-locked' : ''}`}>
                {mealLabels[type]}: {getDeadlineLabel(type) || fallbackDeadlineLabels[type]}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Meal Selection" className="meal-main-card">
        <Row gutter={[16, 16]}>
          {mealTypes.map((type) => (
            <Col xs={24} sm={12} md={8} key={type}>
              <Card
                className={`meal-option-card ${meals[type]?.is_eating ? 'is-active' : ''}`}
                style={{ borderTop: `4px solid ${mealColors[type]}` }}
                hoverable
              >
                <div className="meal-option-header">
                  <h3>{mealLabels[type]}</h3>
                  <Tag icon={<ClockCircleOutlined />} color={isToggleDisabled(type) ? 'red' : 'processing'}>
                    {isToggleDisabled(type) ? 'Locked' : getDeadlineLabel(type) || fallbackDeadlineLabels[type]}
                  </Tag>
                </div>

                <div className="meal-option-row">
                  <span className="meal-row-label">I am eating</span>
                  <Switch
                    checked={meals[type]?.is_eating || false}
                    onChange={(checked) => handleMealChange(type, checked)}
                    disabled={isToggleDisabled(type)}
                    loading={savingMeal === type}
                  />
                </div>

                <div className="meal-option-status">
                  <Tag
                    icon={meals[type]?.is_eating ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={meals[type]?.is_eating ? 'green' : 'default'}
                  >
                    {meals[type]?.is_eating ? 'Opted In' : 'Not Opted'}
                  </Tag>
                  {isToggleDisabled(type) && <Tag color="red">Deadline Passed</Tag>}
                </div>

                <div className="meal-option-row">
                  <span className="meal-row-label">Food Type</span>
                  <Select
                    value={meals[type]?.veg_non_veg || 'veg'}
                    onChange={(value) => handleVegNonVegChange(type, value)}
                    disabled={!meals[type]?.is_eating || isToggleDisabled(type)}
                    options={[
                      { label: 'Vegetarian', value: 'veg' },
                      { label: 'Non-Vegetarian', value: 'non_veg' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

    </div>
  );
}

export default MealTracker;
