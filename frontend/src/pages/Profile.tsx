import React from 'react';
import { Card, Descriptions, Button, Tag, Row, Col } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined, EditOutlined } from '@ant-design/icons';

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
  created_at?: string;
}

interface ProfileProps {
  user: User;
}

function Profile({ user }: ProfileProps) {
  return (
    <div>
      <Card title="My Profile">
        <Descriptions
          column={1}
          bordered
          size="small"
          items={[
            {
              key: '1',
              label: 'Name',
              children: user.name,
              span: 3,
            },
            {
              key: '2',
              label: 'Phone',
              children: user.phone,
              span: 3,
            },
            {
              key: '3',
              label: 'Aadhar',
              children: `****${user.aadhar?.slice(-4)}`,
              span: 3,
            },
            {
              key: '4',
              label: 'Role',
              children: (
                <Tag color={user.is_admin ? 'red' : 'blue'}>
                  {user.is_admin ? 'Admin' : 'Tenant'}
                </Tag>
              ),
              span: 3,
            },
            {
              key: '5',
              label: 'Member Since',
              children: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
              span: 3,
            },
          ]}
        />
      </Card>

      <Card title="Settings" style={{ marginTop: '20px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Button block icon={<EditOutlined />}>
              Edit Profile
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button block>
              Change Password
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        title="App Information"
        style={{ marginTop: '20px' }}
      >
        <p><strong>App Name:</strong> PG Buddy v1.0</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Installed:</strong> Yes (PWA)</p>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          PG Buddy - PG Management Tool | Made for Bengaluru Hostels
        </p>
      </Card>
    </div>
  );
}

export default Profile;
