import React, { useState } from 'react';
import { Card, Row, Col, Tag, Button } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

interface Perk {
  id: number;
  name: string;
  discount: string;
  description: string;
  image: string;
}

function Perks() {
  const [perks] = useState<Perk[]>([
    {
      id: 1,
      name: 'Gym Plus',
      discount: '30% OFF',
      description: 'Premium gym membership near you',
      image: '💪',
    },
    {
      id: 2,
      name: 'Coffee House',
      discount: '20% OFF',
      description: 'Free coffee on membership',
      image: '☕',
    },
    {
      id: 3,
      name: 'Swiggy',
      discount: '50% OFF',
      description: 'First order discount with code PG50',
      image: '🍔',
    },
    {
      id: 4,
      name: 'Zomato',
      discount: '₹150 OFF',
      description: 'Min order ₹300',
      image: '🍕',
    },
    {
      id: 5,
      name: 'Laundry Service',
      discount: '25% OFF',
      description: 'Home pickup & delivery',
      image: '👕',
    },
    {
      id: 6,
      name: 'Yoga Classes',
      discount: '₹99/month',
      description: 'Online & offline sessions',
      image: '🧘',
    },
  ]);

  return (
    <div>
      <Card
        title="Local Perks & Deals"
        extra={<ShoppingOutlined />}
        style={{ marginBottom: '20px' }}
      >
        <p>Exclusive deals for PG Buddy residents</p>
      </Card>

      <Row gutter={[16, 16]}>
        {perks.map((perk) => (
          <Col xs={24} sm={12} md={8} key={perk.id}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                {perk.image}
              </div>
              <h3 style={{ marginBottom: '5px', color: 'white' }}>{perk.name}</h3>
              <Tag
                color="#fff"
                style={{
                  color: '#667eea',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                }}
              >
                {perk.discount}
              </Tag>
              <p style={{ marginBottom: '10px', fontSize: '12px' }}>
                {perk.description}
              </p>
              <Button type="primary" size="small" block>
                View Details
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="More Perks Coming Soon!"
        style={{ marginTop: '20px', textAlign: 'center' }}
      >
        <p>Partner with us to add your business to our perks list</p>
        <Button type="primary">Contact Admin</Button>
      </Card>
    </div>
  );
}

export default Perks;
