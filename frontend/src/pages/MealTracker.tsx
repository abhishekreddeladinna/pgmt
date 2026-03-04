import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Switch, message, Select } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
}

interface MealState {
  [key: string]: {
    is_eating: boolean;
    veg_non_veg: string;
  };
}

interface MealTrackerProps {
  user: User;
}

interface DeadlineInfo {
  meal_type: string;
  deadline_hour: number;
  deadline_minute: number;
}

function MealTracker({ user }: MealTrackerProps) {
  const [meals, setMeals] = useState<MealState>({
    breakfast: { is_eating: false, veg_non_veg: 'veg' },
    lunch: { is_eating: false, veg_non_veg: 'veg' },
    dinner: { is_eating: false, veg_non_veg: 'veg' },
  });
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchTodaysMeals();
    fetchDeadlines();
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
        const mealMap: MealState = {};
        userMeals.forEach((m: any) => {
          mealMap[m.meal_type] = { is_eating: m.is_eating, veg_non_veg: m.veg_non_veg };
        });
        setMeals({ ...meals, ...mealMap });
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const isToggleDisabled = (mealType: string): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dl = deadlines.find((d) => d.meal_type === mealType);
    if (!dl) return false;
    const deadlineMinutes = dl.deadline_hour * 60 + dl.deadline_minute;
    return currentMinutes >= deadlineMinutes;
  };

  const getDeadlineLabel = (mealType: string): string => {
    const dl = deadlines.find((d) => d.meal_type === mealType);
    if (!dl) return '';
    const h = dl.deadline_hour % 12 || 12;
    const m = dl.deadline_minute.toString().padStart(2, '0');
    const ampm = dl.deadline_hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  const handleMealChange = async (mealType: string, isEating: boolean) => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const mealData = {
        user_id: user.id,
        meal_type: mealType,
        date: today,
        is_eating: isEating,
        veg_non_veg: meals[mealType]?.veg_non_veg || 'veg',
      };

      await axios.post(`${API_URL}/api/meals`, mealData);
      setMeals({
        ...meals,
        [mealType]: { ...meals[mealType], is_eating: isEating },
      });
      message.success(`${mealType.toUpperCase()} updated!`);
    } catch (error) {
      message.error('Failed to update meal');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVegNonVegChange = async (mealType: string, value: string) => {
    const updated = {
      ...meals,
      [mealType]: { ...meals[mealType], veg_non_veg: value },
    };
    setMeals(updated);

    // Save to backend immediately
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_URL}/api/meals`, {
        user_id: user.id,
        meal_type: mealType,
        date: today,
        is_eating: updated[mealType].is_eating,
        veg_non_veg: value,
      });
      message.success(`${mealType.toUpperCase()} preference updated!`);
    } catch (error) {
      message.error('Failed to update preference');
      console.error(error);
    }
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const mealIcons: { [key: string]: string } = {
    breakfast: '☀️',
    lunch: '🍽️',
    dinner: '🌙',
  };

  return (
    <div>
      <Card title="Today's Meal Preferences">
        <Row gutter={16}>
          {mealTypes.map((type) => (
            <Col xs={24} sm={12} md={8} key={type}>
              <Card
                style={{
                  background: meals[type]?.is_eating ? '#f6ffed' : '#fafafa',
                  border: `2px solid ${meals[type]?.is_eating ? '#52c41a' : '#d9d9d9'}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                  {mealIcons[type]}
                </div>
                <h3 style={{ marginBottom: '15px', textTransform: 'capitalize' }}>
                  {type}
                </h3>

                <div style={{ marginBottom: '15px' }}>
                  <label>Eating: </label>
                  <Switch
                    checked={meals[type]?.is_eating || false}
                    onChange={(checked) => handleMealChange(type, checked)}
                    disabled={isToggleDisabled(type)}
                    loading={loading}
                  />
                  {isToggleDisabled(type) && (
                    <span style={{ color: '#f5222d', fontSize: '12px', marginLeft: '10px' }}>
                      Deadline passed
                    </span>
                  )}
                </div>

                {meals[type]?.is_eating && (
                  <div>
                    <label>Type: </label>
                    <Select
                      value={meals[type]?.veg_non_veg || 'veg'}
                      onChange={(value) => handleVegNonVegChange(type, value)}
                      options={[
                        { label: 'Vegetarian', value: 'veg' },
                        { label: 'Non-Vegetarian', value: 'non_veg' },
                      ]}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e6f7ff', borderRadius: '4px' }}>
        <strong>⏰ Deadlines:</strong>
        <ul style={{ marginTop: '10px', marginBottom: 0 }}>
          <li>Breakfast: Until {getDeadlineLabel('breakfast') || '9:00 AM'}</li>
          <li>Lunch: Until {getDeadlineLabel('lunch') || '9:00 AM'}</li>
          <li>Dinner: Until {getDeadlineLabel('dinner') || '7:00 PM'}</li>
        </ul>
      </div>
    </div>
  );
}

export default MealTracker;
